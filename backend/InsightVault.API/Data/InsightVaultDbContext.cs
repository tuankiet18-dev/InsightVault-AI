using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace InsightVault.API.Data;

public sealed class InsightVaultDbContext(DbContextOptions<InsightVaultDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<WorkspaceMember> WorkspaceMembers => Set<WorkspaceMember>();
    public DbSet<Folder> Folders => Set<Folder>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentChunk> DocumentChunks => Set<DocumentChunk>();
    public DbSet<AiJob> AiJobs => Set<AiJob>();
    public DbSet<ChatSession> ChatSessions => Set<ChatSession>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<ChatMessageContext> ChatMessageContexts => Set<ChatMessageContext>();
    public DbSet<ChatMessageSource> ChatMessageSources => Set<ChatMessageSource>();
    public DbSet<Report> Reports => Set<Report>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("vector");
        modelBuilder.HasPostgresExtension("pgcrypto");

        ConfigureUsers(modelBuilder);
        ConfigureWorkspaces(modelBuilder);
        ConfigureWorkspaceMembers(modelBuilder);
        ConfigureFolders(modelBuilder);
        ConfigureDocuments(modelBuilder);
        ConfigureDocumentChunks(modelBuilder);
        ConfigureAiJobs(modelBuilder);
        ConfigureChatSessions(modelBuilder);
        ConfigureChatMessages(modelBuilder);
        ConfigureChatMessageContexts(modelBuilder);
        ConfigureChatMessageSources(modelBuilder);
        ConfigureReports(modelBuilder);
    }

    private static void ConfigureUsers(ModelBuilder modelBuilder)
    {
        var systemRoleConverter = new EnumToStringConverter<SystemRole>();

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.GoogleId).HasMaxLength(255).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(255).IsRequired();
            entity.Property(x => x.FullName).HasMaxLength(255).IsRequired();
            entity.Property(x => x.SystemRole).HasConversion(systemRoleConverter).HasMaxLength(50).IsRequired();
            entity.Property(x => x.IsActive).HasDefaultValue(true);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasIndex(x => x.GoogleId).IsUnique();
            entity.HasIndex(x => x.Email).IsUnique();
            entity.HasIndex(x => x.SystemRole);
        });
    }

    private static void ConfigureWorkspaces(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Workspace>(entity =>
        {
            entity.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.Name).HasMaxLength(255).IsRequired();
            entity.Property(x => x.IsArchived).HasDefaultValue(false);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(x => x.Owner)
                .WithMany(x => x.OwnedWorkspaces)
                .HasForeignKey(x => x.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => x.OwnerId);
            entity.HasIndex(x => x.DeletedAt);
        });
    }

    private static void ConfigureWorkspaceMembers(ModelBuilder modelBuilder)
    {
        var roleConverter = new EnumToStringConverter<WorkspaceRole>();
        var statusConverter = new EnumToStringConverter<MemberStatus>();

        modelBuilder.Entity<WorkspaceMember>(entity =>
        {
            entity.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.Email).HasMaxLength(255).IsRequired();
            entity.Property(x => x.Role).HasConversion(roleConverter).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Status).HasConversion(statusConverter).HasMaxLength(50).IsRequired();
            entity.Property(x => x.InvitedAt).HasDefaultValueSql("now()");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(x => x.Workspace)
                .WithMany(x => x.Members)
                .HasForeignKey(x => x.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.User)
                .WithMany(x => x.WorkspaceMemberships)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.InvitedBy)
                .WithMany()
                .HasForeignKey(x => x.InvitedById)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(x => new { x.WorkspaceId, x.Email })
                .IsUnique()
                .HasFilter("removed_at IS NULL");

            entity.HasIndex(x => new { x.WorkspaceId, x.UserId })
                .IsUnique()
                .HasFilter("removed_at IS NULL AND user_id IS NOT NULL");
            entity.HasIndex(x => x.UserId);
            entity.HasIndex(x => x.Email);
            entity.HasIndex(x => x.Status);
            entity.HasIndex(x => x.RemovedAt);
        });
    }

    private static void ConfigureFolders(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Folder>(entity =>
        {
            entity.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.Name).HasMaxLength(255).IsRequired();
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(x => x.Workspace)
                .WithMany(x => x.Folders)
                .HasForeignKey(x => x.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.ParentFolder)
                .WithMany(x => x.ChildFolders)
                .HasForeignKey(x => x.ParentFolderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.CreatedBy)
                .WithMany(x => x.CreatedFolders)
                .HasForeignKey(x => x.CreatedById)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasAlternateKey(x => new { x.Id, x.WorkspaceId });
            entity.HasIndex(x => new { x.WorkspaceId, x.ParentFolderId, x.Name })
                .IsUnique()
                .HasFilter("parent_folder_id IS NOT NULL AND deleted_at IS NULL");

            entity.HasIndex(x => new { x.WorkspaceId, x.Name })
                .IsUnique()
                .HasFilter("parent_folder_id IS NULL AND deleted_at IS NULL");
            entity.HasIndex(x => x.WorkspaceId);
            entity.HasIndex(x => x.ParentFolderId);
            entity.HasIndex(x => x.DeletedAt);
        });
    }

    private static void ConfigureDocuments(ModelBuilder modelBuilder)
    {
        var statusConverter = new EnumToStringConverter<DocumentStatus>();

        modelBuilder.Entity<Document>(entity =>
        {
            entity.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.FileName).HasMaxLength(500).IsRequired();
            entity.Property(x => x.OriginalFileName).HasMaxLength(500).IsRequired();
            entity.Property(x => x.FileType).HasMaxLength(50).IsRequired();
            entity.Property(x => x.MimeType).HasMaxLength(255);
            entity.Property(x => x.MinioBucket).HasMaxLength(255).IsRequired();
            entity.Property(x => x.MinioObjectKey).IsRequired();
            entity.Property(x => x.Status).HasConversion(statusConverter).HasMaxLength(50).IsRequired();
            entity.Property(x => x.DocumentType).HasMaxLength(100);
            entity.Property(x => x.AudienceFit).HasMaxLength(100);
            entity.Property(x => x.KeyPoints).HasColumnType("jsonb").HasDefaultValueSql("'[]'::jsonb");
            entity.Property(x => x.Insights).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            entity.Property(x => x.Keywords).HasColumnType("jsonb").HasDefaultValueSql("'[]'::jsonb");
            entity.Property(x => x.ExtractedTextHash).HasMaxLength(128);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(x => x.Workspace)
                .WithMany(x => x.Documents)
                .HasForeignKey(x => x.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Folder)
                .WithMany(x => x.Documents)
                .HasForeignKey(x => x.FolderId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.UploadedBy)
                .WithMany(x => x.UploadedDocuments)
                .HasForeignKey(x => x.UploadedById)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasAlternateKey(x => new { x.Id, x.WorkspaceId });
            entity.HasIndex(x => x.WorkspaceId);
            entity.HasIndex(x => x.FolderId);
            entity.HasIndex(x => new { x.WorkspaceId, x.FolderId, x.FileName })
                .IsUnique()
                .HasFilter("folder_id IS NOT NULL AND deleted_at IS NULL");
            entity.HasIndex(x => new { x.WorkspaceId, x.FileName })
                .IsUnique()
                .HasFilter("folder_id IS NULL AND deleted_at IS NULL");
            entity.HasIndex(x => x.UploadedById);
            entity.HasIndex(x => x.Status);
            entity.HasIndex(x => x.DocumentType);
            entity.HasIndex(x => x.CreatedAt);
            entity.HasIndex(x => x.DeletedAt);
            entity.HasIndex(x => x.Insights).HasMethod("gin");
        });
    }

    private static void ConfigureDocumentChunks(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DocumentChunk>(entity =>
        {
            entity.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.Content).IsRequired();
            entity.Property(x => x.NormalizedContent).IsRequired().HasDefaultValue("");
            entity.Property(x => x.Embedding).HasColumnType("vector(768)").IsRequired();
            entity.Property(x => x.EmbeddingModel).HasMaxLength(255).IsRequired();
            entity.Property(x => x.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");

            entity.HasOne(x => x.Document)
                .WithMany(x => x.Chunks)
                .HasForeignKey(x => x.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Workspace)
                .WithMany()
                .HasForeignKey(x => x.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Folder)
                .WithMany()
                .HasForeignKey(x => x.FolderId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(x => new { x.DocumentId, x.ChunkIndex }).IsUnique();
            entity.HasIndex(x => x.DocumentId);
            entity.HasIndex(x => x.WorkspaceId);
            entity.HasIndex(x => x.FolderId);
            entity.HasIndex(x => x.Embedding)
                .HasMethod("hnsw")
                .HasOperators("vector_cosine_ops");
            entity.HasIndex(x => x.Metadata).HasMethod("gin");
        });
    }

    private static void ConfigureAiJobs(ModelBuilder modelBuilder)
    {
        var typeConverter = new EnumToStringConverter<AiJobType>();
        var statusConverter = new EnumToStringConverter<AiJobStatus>();

        modelBuilder.Entity<AiJob>(entity =>
        {
            entity.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.JobType).HasConversion(typeConverter).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Status).HasConversion(statusConverter).HasMaxLength(50).IsRequired();
            entity.Property(x => x.InputPayload).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            entity.Property(x => x.OutputPayload).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(x => x.Workspace)
                .WithMany(x => x.AiJobs)
                .HasForeignKey(x => x.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Document)
                .WithMany(x => x.AiJobs)
                .HasForeignKey(x => x.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.CreatedBy)
                .WithMany(x => x.AiJobs)
                .HasForeignKey(x => x.CreatedById)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(x => x.WorkspaceId);
            entity.HasIndex(x => x.DocumentId);
            entity.HasIndex(x => x.Status);
            entity.HasIndex(x => x.JobType);
            entity.HasIndex(x => x.CreatedAt);
        });
    }

    private static void ConfigureChatSessions(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ChatSession>(entity =>
        {
            entity.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.Title).HasMaxLength(255);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(x => x.Workspace)
                .WithMany(x => x.ChatSessions)
                .HasForeignKey(x => x.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.CreatedBy)
                .WithMany(x => x.ChatSessions)
                .HasForeignKey(x => x.CreatedById)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasAlternateKey(x => new { x.Id, x.WorkspaceId });
            entity.HasIndex(x => x.WorkspaceId);
            entity.HasIndex(x => x.CreatedById);
            entity.HasIndex(x => x.DeletedAt);
        });
    }

    private static void ConfigureChatMessages(ModelBuilder modelBuilder)
    {
        var roleConverter = new EnumToStringConverter<ChatMessageRole>();

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.Role).HasConversion(roleConverter).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Content).IsRequired();
            entity.Property(x => x.ModelName).HasMaxLength(255);
            entity.Property(x => x.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");

            entity.HasOne(x => x.ChatSession)
                .WithMany(x => x.Messages)
                .HasForeignKey(x => new { x.ChatSessionId, x.WorkspaceId })
                .HasPrincipalKey(x => new { x.Id, x.WorkspaceId })
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasAlternateKey(x => new { x.Id, x.WorkspaceId });
            entity.HasIndex(x => x.ChatSessionId);
            entity.HasIndex(x => x.WorkspaceId);
            entity.HasIndex(x => x.CreatedAt);
        });
    }

    private static void ConfigureChatMessageContexts(ModelBuilder modelBuilder)
    {
        var contextTypeConverter = new EnumToStringConverter<ChatContextType>();

        modelBuilder.Entity<ChatMessageContext>(entity =>
        {
            entity.ToTable(table => table.HasCheckConstraint(
                "ck_chat_message_contexts_context_shape",
                "(context_type = 'Folder' AND document_id IS NULL) OR " +
                "(context_type = 'Document' AND folder_id IS NULL)"));

            entity.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.ContextType).HasConversion(contextTypeConverter).HasMaxLength(50).IsRequired();
            entity.Property(x => x.IncludeSubfolders).HasDefaultValue(true);
            entity.Property(x => x.ContextDisplayName).HasMaxLength(500);
            entity.Property(x => x.ContextPath).HasMaxLength(2000);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");

            entity.HasOne(x => x.ChatMessage)
                .WithMany(x => x.Contexts)
                .HasForeignKey(x => new { x.ChatMessageId, x.WorkspaceId })
                .HasPrincipalKey(x => new { x.Id, x.WorkspaceId })
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Folder)
                .WithMany(x => x.ChatMessageContexts)
                .HasForeignKey(x => x.FolderId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.Document)
                .WithMany(x => x.ChatMessageContexts)
                .HasForeignKey(x => x.DocumentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(x => x.WorkspaceId);
            entity.HasIndex(x => x.ChatMessageId);
            entity.HasIndex(x => x.FolderId);
            entity.HasIndex(x => x.DocumentId);
            entity.HasIndex(x => new { x.ChatMessageId, x.ContextOrder });
            entity.HasIndex(x => new { x.ChatMessageId, x.ContextType, x.FolderId })
                .IsUnique()
                .HasFilter("folder_id IS NOT NULL");
            entity.HasIndex(x => new { x.ChatMessageId, x.ContextType, x.DocumentId })
                .IsUnique()
                .HasFilter("document_id IS NOT NULL");
        });
    }

    private static void ConfigureChatMessageSources(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ChatMessageSource>(entity =>
        {
            entity.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.FileName).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");

            entity.HasOne(x => x.ChatMessage)
                .WithMany(x => x.Sources)
                .HasForeignKey(x => x.ChatMessageId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Document)
                .WithMany(x => x.ChatMessageSources)
                .HasForeignKey(x => x.DocumentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.DocumentChunk)
                .WithMany(x => x.ChatMessageSources)
                .HasForeignKey(x => x.DocumentChunkId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(x => x.ChatMessageId);
            entity.HasIndex(x => x.DocumentId);
            entity.HasIndex(x => x.Metadata).HasMethod("gin");
        });
    }

    private static void ConfigureReports(ModelBuilder modelBuilder)
    {
        var reportTypeConverter = new EnumToStringConverter<ReportType>();

        modelBuilder.Entity<Report>(entity =>
        {
            entity.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.ReportGroupId).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.VersionNumber).HasDefaultValue(1);
            entity.Property(x => x.Title).HasMaxLength(255).IsRequired();
            entity.Property(x => x.ReportType).HasConversion(reportTypeConverter).HasMaxLength(50).IsRequired();
            entity.Property(x => x.MarkdownContent).IsRequired();
            entity.Property(x => x.SourceDocuments).HasColumnType("jsonb").HasDefaultValueSql("'[]'::jsonb");
            entity.Property(x => x.StructuredResult).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            entity.Property(x => x.ModelName).HasMaxLength(255);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");

            entity.HasOne(x => x.Workspace)
                .WithMany(x => x.Reports)
                .HasForeignKey(x => x.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Folder)
                .WithMany(x => x.Reports)
                .HasForeignKey(x => x.FolderId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.CreatedBy)
                .WithMany(x => x.Reports)
                .HasForeignKey(x => x.CreatedById)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.AiJob)
                .WithMany(x => x.Reports)
                .HasForeignKey(x => x.AiJobId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(x => x.WorkspaceId);
            entity.HasIndex(x => x.FolderId);
            entity.HasIndex(x => x.CreatedById);
            entity.HasIndex(x => x.ReportGroupId);
            entity.HasIndex(x => new { x.WorkspaceId, x.ReportGroupId, x.VersionNumber })
                .IsUnique();
            entity.HasIndex(x => x.ReportType);
            entity.HasIndex(x => x.CreatedAt);
            entity.HasIndex(x => x.DeletedAt);
            entity.HasIndex(x => x.SourceDocuments).HasMethod("gin");
            entity.HasIndex(x => x.StructuredResult).HasMethod("gin");
        });
    }
}
