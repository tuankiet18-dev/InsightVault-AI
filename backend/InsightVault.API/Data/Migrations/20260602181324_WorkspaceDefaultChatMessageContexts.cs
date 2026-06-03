using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsightVault.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class WorkspaceDefaultChatMessageContexts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_chat_sessions_documents_scope_document_id",
                table: "chat_sessions");

            migrationBuilder.DropForeignKey(
                name: "fk_chat_sessions_folders_scope_folder_id",
                table: "chat_sessions");

            migrationBuilder.DropForeignKey(
                name: "fk_chat_sessions_workspaces_scope_workspace_id",
                table: "chat_sessions");

            migrationBuilder.DropIndex(
                name: "ix_chat_sessions_scope_document_id",
                table: "chat_sessions");

            migrationBuilder.DropIndex(
                name: "ix_chat_sessions_scope_folder_id",
                table: "chat_sessions");

            migrationBuilder.DropIndex(
                name: "ix_chat_sessions_scope_type_scope_workspace_id_scope_folder_id",
                table: "chat_sessions");

            migrationBuilder.DropIndex(
                name: "ix_chat_sessions_scope_workspace_id",
                table: "chat_sessions");

            migrationBuilder.DropColumn(
                name: "include_subfolders",
                table: "chat_sessions");

            migrationBuilder.DropColumn(
                name: "scope_document_id",
                table: "chat_sessions");

            migrationBuilder.DropColumn(
                name: "scope_folder_id",
                table: "chat_sessions");

            migrationBuilder.DropColumn(
                name: "scope_type",
                table: "chat_sessions");

            migrationBuilder.DropColumn(
                name: "scope_workspace_id",
                table: "chat_sessions");

            migrationBuilder.CreateTable(
                name: "chat_message_contexts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    chat_message_id = table.Column<Guid>(type: "uuid", nullable: false),
                    context_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    folder_id = table.Column<Guid>(type: "uuid", nullable: true),
                    document_id = table.Column<Guid>(type: "uuid", nullable: true),
                    include_subfolders = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    context_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_chat_message_contexts", x => x.id);
                    table.CheckConstraint("ck_chat_message_contexts_context_shape", "(context_type = 'Folder' AND folder_id IS NOT NULL AND document_id IS NULL) OR (context_type = 'Document' AND document_id IS NOT NULL AND folder_id IS NULL)");
                    table.ForeignKey(
                        name: "fk_chat_message_contexts_chat_messages_chat_message_id",
                        column: x => x.chat_message_id,
                        principalTable: "chat_messages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_chat_message_contexts_documents_document_id",
                        column: x => x.document_id,
                        principalTable: "documents",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_chat_message_contexts_folders_folder_id",
                        column: x => x.folder_id,
                        principalTable: "folders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_contexts_chat_message_id",
                table: "chat_message_contexts",
                column: "chat_message_id");

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_contexts_chat_message_id_context_order",
                table: "chat_message_contexts",
                columns: new[] { "chat_message_id", "context_order" });

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_contexts_document_id",
                table: "chat_message_contexts",
                column: "document_id");

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_contexts_folder_id",
                table: "chat_message_contexts",
                column: "folder_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "chat_message_contexts");

            migrationBuilder.AddColumn<bool>(
                name: "include_subfolders",
                table: "chat_sessions",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<Guid>(
                name: "scope_document_id",
                table: "chat_sessions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "scope_folder_id",
                table: "chat_sessions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "scope_type",
                table: "chat_sessions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "scope_workspace_id",
                table: "chat_sessions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_chat_sessions_scope_document_id",
                table: "chat_sessions",
                column: "scope_document_id");

            migrationBuilder.CreateIndex(
                name: "ix_chat_sessions_scope_folder_id",
                table: "chat_sessions",
                column: "scope_folder_id");

            migrationBuilder.CreateIndex(
                name: "ix_chat_sessions_scope_type_scope_workspace_id_scope_folder_id",
                table: "chat_sessions",
                columns: new[] { "scope_type", "scope_workspace_id", "scope_folder_id", "scope_document_id" });

            migrationBuilder.CreateIndex(
                name: "ix_chat_sessions_scope_workspace_id",
                table: "chat_sessions",
                column: "scope_workspace_id");

            migrationBuilder.AddForeignKey(
                name: "fk_chat_sessions_documents_scope_document_id",
                table: "chat_sessions",
                column: "scope_document_id",
                principalTable: "documents",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_chat_sessions_folders_scope_folder_id",
                table: "chat_sessions",
                column: "scope_folder_id",
                principalTable: "folders",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_chat_sessions_workspaces_scope_workspace_id",
                table: "chat_sessions",
                column: "scope_workspace_id",
                principalTable: "workspaces",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
