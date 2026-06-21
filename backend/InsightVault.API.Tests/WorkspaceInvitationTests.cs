using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.DTOs.Common;
using InsightVault.API.DTOs.Invitations;
using Microsoft.Extensions.DependencyInjection;

namespace InsightVault.API.Tests;

public sealed class WorkspaceInvitationTests(InsightVaultApiFactory factory)
    : IClassFixture<InsightVaultApiFactory>
{
    [Fact]
    public async Task Owner_can_invite_existing_user_without_creating_active_member()
    {
        var seeded = await SeedWorkspaceAsync();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = Bearer(seeded.OwnerToken);

        var response = await client.PostAsJsonAsync(
            $"/api/workspaces/{seeded.WorkspaceId}/invitations",
            new
            {
                email = seeded.InvitedUser.Email,
                role = "viewer"
            });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var invitation = await response.Content.ReadFromJsonAsync<WorkspaceInvitationDto>();
        Assert.NotNull(invitation);
        Assert.Equal(seeded.WorkspaceId, invitation.WorkspaceId);
        Assert.Equal(seeded.InvitedUser.Id, invitation.InvitedUserId);
        Assert.Equal(ApiWorkspaceInvitationStatus.Pending, invitation.Status);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InsightVaultDbContext>();
        Assert.DoesNotContain(
            db.WorkspaceMembers,
            member => member.WorkspaceId == seeded.WorkspaceId
                && member.UserId == seeded.InvitedUser.Id
                && member.Status == MemberStatus.Active);
    }

    [Fact]
    public async Task Invited_user_can_accept_invitation_and_become_active_member()
    {
        var seeded = await SeedWorkspaceAsync();
        var invitationId = await CreateInvitationAsync(seeded);

        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = Bearer(seeded.InvitedUserToken);

        var response = await client.PostAsync(
            $"/api/me/workspace-invitations/{invitationId}/accept",
            content: null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var invitation = await response.Content.ReadFromJsonAsync<WorkspaceInvitationDto>();
        Assert.NotNull(invitation);
        Assert.Equal(ApiWorkspaceInvitationStatus.Accepted, invitation.Status);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InsightVaultDbContext>();
        Assert.Contains(
            db.WorkspaceMembers,
            member => member.WorkspaceId == seeded.WorkspaceId
                && member.UserId == seeded.InvitedUser.Id
                && member.Status == MemberStatus.Active
                && member.Role == WorkspaceRole.Viewer);
    }

    [Fact]
    public async Task Wrong_user_cannot_view_or_accept_invitation()
    {
        var seeded = await SeedWorkspaceAsync();
        var invitationId = await CreateInvitationAsync(seeded);

        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = Bearer(seeded.OtherUserToken);

        var getResponse = await client.GetAsync(
            $"/api/me/workspace-invitations/{invitationId}");
        var acceptResponse = await client.PostAsync(
            $"/api/me/workspace-invitations/{invitationId}/accept",
            content: null);

        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, acceptResponse.StatusCode);
    }

    private async Task<Guid> CreateInvitationAsync(SeededWorkspace seeded)
    {
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = Bearer(seeded.OwnerToken);

        var response = await client.PostAsJsonAsync(
            $"/api/workspaces/{seeded.WorkspaceId}/invitations",
            new
            {
                email = seeded.InvitedUser.Email,
                role = "viewer"
            });

        response.EnsureSuccessStatusCode();
        var invitation = await response.Content.ReadFromJsonAsync<WorkspaceInvitationDto>();
        return invitation!.Id;
    }

    private async Task<SeededWorkspace> SeedWorkspaceAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InsightVaultDbContext>();
        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();

        var now = DateTimeOffset.UtcNow;
        var owner = CreateUser("owner@example.com", "Owner User");
        var invitedUser = CreateUser("invited@example.com", "Invited User");
        var otherUser = CreateUser("other@example.com", "Other User");
        var workspaceId = Guid.NewGuid();
        var workspace = new Workspace
        {
            Id = workspaceId,
            OwnerId = owner.Id,
            Name = "Invitation Workspace",
            Description = "Workspace for invitation tests",
            CreatedAt = now,
            UpdatedAt = now
        };

        var ownerMember = new WorkspaceMember
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            UserId = owner.Id,
            Email = owner.Email,
            Role = WorkspaceRole.Owner,
            Status = MemberStatus.Active,
            InvitedById = owner.Id,
            InvitedAt = now,
            JoinedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        var plan = new SubscriptionPlan
        {
            Id = Guid.NewGuid(),
            Code = $"invitation-test-{workspaceId:N}",
            Name = "Invitation Test",
            Description = "Plan for invitation integration tests",
            PriceVnd = 0,
            BillingPeriodMonths = 1,
            IncludedCredits = 100,
            MaxMembers = 5,
            StorageLimitBytes = 1024L * 1024 * 1024,
            IsActive = true,
            DisplayOrder = 99,
            CreatedAt = now,
            UpdatedAt = now
        };

        var subscription = new UserSubscription
        {
            Id = Guid.NewGuid(),
            UserId = owner.Id,
            PlanId = plan.Id,
            Plan = plan,
            Status = SubscriptionStatus.Active,
            RecurringCreditsRemaining = plan.IncludedCredits,
            TopUpCreditsRemaining = 0,
            CurrentPeriodStart = now,
            CurrentPeriodEnd = now.AddMonths(1),
            CreatedAt = now,
            UpdatedAt = now
        };

        db.Users.AddRange(owner, invitedUser, otherUser);
        db.Workspaces.Add(workspace);
        db.WorkspaceMembers.Add(ownerMember);
        db.SubscriptionPlans.Add(plan);
        db.UserSubscriptions.Add(subscription);
        await db.SaveChangesAsync();

        var tokenService = scope.ServiceProvider.GetRequiredService<IJwtTokenService>();
        return new SeededWorkspace(
            workspaceId,
            owner,
            invitedUser,
            otherUser,
            tokenService.GenerateToken(owner).AccessToken,
            tokenService.GenerateToken(invitedUser).AccessToken,
            tokenService.GenerateToken(otherUser).AccessToken);
    }

    private static User CreateUser(string email, string fullName)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            GoogleId = Guid.NewGuid().ToString("N"),
            Email = email,
            FullName = fullName,
            SystemRole = SystemRole.User,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    private static AuthenticationHeaderValue Bearer(string token) =>
        new("Bearer", token);

    private sealed record SeededWorkspace(
        Guid WorkspaceId,
        User Owner,
        User InvitedUser,
        User OtherUser,
        string OwnerToken,
        string InvitedUserToken,
        string OtherUserToken);
}
