using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Abstractions.Services.Emails;
using InsightVault.API.Application.Abstractions.Messaging;
using InsightVault.API.Application.Services.Auth;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.DTOs.Auth;
using InsightVault.API.Infrastructure.Persistence.Repositories;
using InsightVault.API.Infrastructure.Emails;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace InsightVault.API.Tests;

public sealed class AuthEmailResilienceTests
{
    [Fact]
    public async Task LoginWithGoogle_EmailQueueFails_LoginStillSucceeds()
    {
        await using var db = CreateDbContext();
        var emailService = new RecordingEmailService(throwOnSend: true);
        var service = CreateService(db, emailService);

        var response = await service.LoginWithGoogleAsync(new GoogleLoginRequest("valid-token"));

        Assert.Equal("test-access-token", response.AccessToken);
        Assert.Equal(1, emailService.LoginNotificationCount);
        Assert.Single(await db.Users.ToListAsync());
    }

    [Fact]
    public async Task LoginWithGoogle_ExistingUser_DoesNotSendRepeatedNotification()
    {
        await using var db = CreateDbContext();
        db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            GoogleId = "google-user-id",
            Email = "user@example.com",
            FullName = "Existing User",
            LastLoginAt = DateTimeOffset.UtcNow.AddDays(-1),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-2),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1)
        });
        await db.SaveChangesAsync();

        var emailService = new RecordingEmailService(throwOnSend: false);
        var service = CreateService(db, emailService);

        var response = await service.LoginWithGoogleAsync(new GoogleLoginRequest("valid-token"));

        Assert.Equal("test-access-token", response.AccessToken);
        Assert.Equal(0, emailService.LoginNotificationCount);
    }

    [Fact]
    public async Task MessagingEmailService_RabbitMqFails_PrimaryOperationCanContinue()
    {
        var service = new MessagingEmailService(
            new ThrowingMessagePublisher(),
            NullLogger<MessagingEmailService>.Instance);

        await service.SendWorkspaceInviteAsync(
            "member@example.com",
            "Workspace Owner",
            "Research",
            "editor",
            "https://example.com/invitations/test",
            DateTimeOffset.UtcNow.AddDays(1));
    }

    private static AuthService CreateService(
        InsightVaultDbContext db,
        IEmailService emailService) =>
        new(
            new FakeGoogleTokenVerifier(),
            new FakeJwtTokenService(),
            new AnonymousCurrentUserService(),
            new UserRepository(db),
            emailService,
            db,
            NullLogger<AuthService>.Instance);

    private static InsightVaultDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<InsightVaultDbContext>()
            .UseInMemoryDatabase($"auth-email-resilience-{Guid.NewGuid()}")
            .Options;
        return new InsightVaultDbContext(options);
    }

    private sealed class FakeGoogleTokenVerifier : IGoogleTokenVerifier
    {
        public Task<GoogleUserInfo> VerifyAsync(
            string idToken,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new GoogleUserInfo(
                "google-user-id",
                "user@example.com",
                "Test User",
                null));
    }

    private sealed class FakeJwtTokenService : IJwtTokenService
    {
        public JwtTokenResult GenerateToken(User user) =>
            new("test-access-token", DateTimeOffset.UtcNow.AddMinutes(30));
    }

    private sealed class AnonymousCurrentUserService : ICurrentUserService
    {
        public Guid? UserId => null;
        public string? Email => null;
        public bool IsAuthenticated => false;
    }

    private sealed class RecordingEmailService(bool throwOnSend) : IEmailService
    {
        public int LoginNotificationCount { get; private set; }

        public Task SendLoginNotificationAsync(
            string email,
            string fullName,
            DateTimeOffset loginTime,
            CancellationToken cancellationToken = default)
        {
            LoginNotificationCount++;
            return throwOnSend
                ? Task.FromException(new InvalidOperationException("RabbitMQ is unavailable."))
                : Task.CompletedTask;
        }

        public Task SendWorkspaceInviteAsync(
            string email,
            string inviterName,
            string workspaceName,
            string role,
            string viewInvitationUrl,
            DateTimeOffset expiresAt,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task SendRoleUpdatedAsync(
            string email,
            string workspaceName,
            string newRole,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task SendRemovedFromWorkspaceAsync(
            string email,
            string workspaceName,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }

    private sealed class ThrowingMessagePublisher : IMessagePublisher
    {
        public Task PublishDocumentProcessingJobAsync(
            Guid jobId,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task PublishAiJobAsync(
            Guid jobId,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task PublishEmailAsync(
            EmailMessage message,
            CancellationToken cancellationToken = default) =>
            Task.FromException(new InvalidOperationException("RabbitMQ is unavailable."));
    }
}
