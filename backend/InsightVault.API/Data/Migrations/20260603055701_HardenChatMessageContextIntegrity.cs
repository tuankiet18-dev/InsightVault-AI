using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsightVault.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class HardenChatMessageContextIntegrity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_chat_message_contexts_chat_messages_chat_message_id",
                table: "chat_message_contexts");

            migrationBuilder.DropForeignKey(
                name: "fk_chat_message_contexts_documents_document_id",
                table: "chat_message_contexts");

            migrationBuilder.DropForeignKey(
                name: "fk_chat_message_contexts_folders_folder_id",
                table: "chat_message_contexts");

            migrationBuilder.DropForeignKey(
                name: "fk_chat_messages_chat_sessions_chat_session_id",
                table: "chat_messages");

            migrationBuilder.AddColumn<Guid>(
                name: "workspace_id",
                table: "chat_messages",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "context_display_name",
                table: "chat_message_contexts",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "context_path",
                table: "chat_message_contexts",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "workspace_id",
                table: "chat_message_contexts",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE chat_messages AS message
                SET workspace_id = session.workspace_id
                FROM chat_sessions AS session
                WHERE message.chat_session_id = session.id;
                """);

            migrationBuilder.Sql("""
                UPDATE chat_message_contexts AS context
                SET workspace_id = message.workspace_id
                FROM chat_messages AS message
                WHERE context.chat_message_id = message.id;
                """);

            migrationBuilder.Sql("""
                UPDATE chat_message_contexts AS context
                SET context_display_name = folder.name
                FROM folders AS folder
                WHERE context.folder_id = folder.id
                    AND context.workspace_id = folder.workspace_id
                    AND context.context_type = 'Folder'
                    AND context.context_display_name IS NULL;
                """);

            migrationBuilder.Sql("""
                UPDATE chat_message_contexts AS context
                SET context_display_name = document.original_file_name
                FROM documents AS document
                WHERE context.document_id = document.id
                    AND context.workspace_id = document.workspace_id
                    AND context.context_type = 'Document'
                    AND context.context_display_name IS NULL;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "workspace_id",
                table: "chat_messages",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "workspace_id",
                table: "chat_message_contexts",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddUniqueConstraint(
                name: "ak_folders_id_workspace_id",
                table: "folders",
                columns: new[] { "id", "workspace_id" });

            migrationBuilder.AddUniqueConstraint(
                name: "ak_documents_id_workspace_id",
                table: "documents",
                columns: new[] { "id", "workspace_id" });

            migrationBuilder.AddUniqueConstraint(
                name: "ak_chat_sessions_id_workspace_id",
                table: "chat_sessions",
                columns: new[] { "id", "workspace_id" });

            migrationBuilder.AddUniqueConstraint(
                name: "ak_chat_messages_id_workspace_id",
                table: "chat_messages",
                columns: new[] { "id", "workspace_id" });

            migrationBuilder.CreateIndex(
                name: "ix_chat_messages_chat_session_id_workspace_id",
                table: "chat_messages",
                columns: new[] { "chat_session_id", "workspace_id" });

            migrationBuilder.CreateIndex(
                name: "ix_chat_messages_workspace_id",
                table: "chat_messages",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_contexts_chat_message_id_context_type_document",
                table: "chat_message_contexts",
                columns: new[] { "chat_message_id", "context_type", "document_id" },
                unique: true,
                filter: "document_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_contexts_chat_message_id_context_type_folder_id",
                table: "chat_message_contexts",
                columns: new[] { "chat_message_id", "context_type", "folder_id" },
                unique: true,
                filter: "folder_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_contexts_chat_message_id_workspace_id",
                table: "chat_message_contexts",
                columns: new[] { "chat_message_id", "workspace_id" });

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_contexts_document_id_workspace_id",
                table: "chat_message_contexts",
                columns: new[] { "document_id", "workspace_id" });

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_contexts_folder_id_workspace_id",
                table: "chat_message_contexts",
                columns: new[] { "folder_id", "workspace_id" });

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_contexts_workspace_id",
                table: "chat_message_contexts",
                column: "workspace_id");

            migrationBuilder.AddForeignKey(
                name: "fk_chat_message_contexts_chat_messages_chat_message_id_workspa",
                table: "chat_message_contexts",
                columns: new[] { "chat_message_id", "workspace_id" },
                principalTable: "chat_messages",
                principalColumns: new[] { "id", "workspace_id" },
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_chat_message_contexts_documents_document_id_workspace_id",
                table: "chat_message_contexts",
                columns: new[] { "document_id", "workspace_id" },
                principalTable: "documents",
                principalColumns: new[] { "id", "workspace_id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_chat_message_contexts_folders_folder_id_workspace_id",
                table: "chat_message_contexts",
                columns: new[] { "folder_id", "workspace_id" },
                principalTable: "folders",
                principalColumns: new[] { "id", "workspace_id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_chat_messages_chat_sessions_chat_session_id_workspace_id",
                table: "chat_messages",
                columns: new[] { "chat_session_id", "workspace_id" },
                principalTable: "chat_sessions",
                principalColumns: new[] { "id", "workspace_id" },
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_chat_message_contexts_chat_messages_chat_message_id_workspa",
                table: "chat_message_contexts");

            migrationBuilder.DropForeignKey(
                name: "fk_chat_message_contexts_documents_document_id_workspace_id",
                table: "chat_message_contexts");

            migrationBuilder.DropForeignKey(
                name: "fk_chat_message_contexts_folders_folder_id_workspace_id",
                table: "chat_message_contexts");

            migrationBuilder.DropForeignKey(
                name: "fk_chat_messages_chat_sessions_chat_session_id_workspace_id",
                table: "chat_messages");

            migrationBuilder.DropUniqueConstraint(
                name: "ak_folders_id_workspace_id",
                table: "folders");

            migrationBuilder.DropUniqueConstraint(
                name: "ak_documents_id_workspace_id",
                table: "documents");

            migrationBuilder.DropUniqueConstraint(
                name: "ak_chat_sessions_id_workspace_id",
                table: "chat_sessions");

            migrationBuilder.DropUniqueConstraint(
                name: "ak_chat_messages_id_workspace_id",
                table: "chat_messages");

            migrationBuilder.DropIndex(
                name: "ix_chat_messages_chat_session_id_workspace_id",
                table: "chat_messages");

            migrationBuilder.DropIndex(
                name: "ix_chat_messages_workspace_id",
                table: "chat_messages");

            migrationBuilder.DropIndex(
                name: "ix_chat_message_contexts_chat_message_id_context_type_document",
                table: "chat_message_contexts");

            migrationBuilder.DropIndex(
                name: "ix_chat_message_contexts_chat_message_id_context_type_folder_id",
                table: "chat_message_contexts");

            migrationBuilder.DropIndex(
                name: "ix_chat_message_contexts_chat_message_id_workspace_id",
                table: "chat_message_contexts");

            migrationBuilder.DropIndex(
                name: "ix_chat_message_contexts_document_id_workspace_id",
                table: "chat_message_contexts");

            migrationBuilder.DropIndex(
                name: "ix_chat_message_contexts_folder_id_workspace_id",
                table: "chat_message_contexts");

            migrationBuilder.DropIndex(
                name: "ix_chat_message_contexts_workspace_id",
                table: "chat_message_contexts");

            migrationBuilder.DropColumn(
                name: "workspace_id",
                table: "chat_messages");

            migrationBuilder.DropColumn(
                name: "context_display_name",
                table: "chat_message_contexts");

            migrationBuilder.DropColumn(
                name: "context_path",
                table: "chat_message_contexts");

            migrationBuilder.DropColumn(
                name: "workspace_id",
                table: "chat_message_contexts");

            migrationBuilder.AddForeignKey(
                name: "fk_chat_message_contexts_chat_messages_chat_message_id",
                table: "chat_message_contexts",
                column: "chat_message_id",
                principalTable: "chat_messages",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_chat_message_contexts_documents_document_id",
                table: "chat_message_contexts",
                column: "document_id",
                principalTable: "documents",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_chat_message_contexts_folders_folder_id",
                table: "chat_message_contexts",
                column: "folder_id",
                principalTable: "folders",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_chat_messages_chat_sessions_chat_session_id",
                table: "chat_messages",
                column: "chat_session_id",
                principalTable: "chat_sessions",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
