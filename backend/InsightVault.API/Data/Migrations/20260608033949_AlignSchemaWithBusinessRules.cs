using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsightVault.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AlignSchemaWithBusinessRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE document_chunks
                ADD COLUMN IF NOT EXISTS normalized_content text NOT NULL DEFAULT '';

                UPDATE document_chunks
                SET normalized_content = lower(content)
                WHERE normalized_content = '';

                ALTER TABLE chat_message_sources
                ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

                CREATE INDEX IF NOT EXISTS ix_document_chunks_content_fts
                ON document_chunks USING gin (to_tsvector('simple', content));

                CREATE INDEX IF NOT EXISTS ix_document_chunks_normalized_content_fts
                ON document_chunks USING gin (to_tsvector('simple', normalized_content));

                CREATE INDEX IF NOT EXISTS ix_chat_message_sources_metadata
                ON chat_message_sources USING gin (metadata);
                """);

            migrationBuilder.DropForeignKey(
                name: "fk_chat_message_contexts_documents_document_id_workspace_id",
                table: "chat_message_contexts");

            migrationBuilder.DropForeignKey(
                name: "fk_chat_message_contexts_folders_folder_id_workspace_id",
                table: "chat_message_contexts");

            migrationBuilder.DropIndex(
                name: "ix_chat_message_contexts_document_id_workspace_id",
                table: "chat_message_contexts");

            migrationBuilder.DropIndex(
                name: "ix_chat_message_contexts_folder_id_workspace_id",
                table: "chat_message_contexts");

            migrationBuilder.DropCheckConstraint(
                name: "ck_chat_message_contexts_context_shape",
                table: "chat_message_contexts");

            migrationBuilder.AddColumn<Guid>(
                name: "report_group_id",
                table: "reports",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<int>(
                name: "version_number",
                table: "reports",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM documents
                        WHERE deleted_at IS NULL
                        GROUP BY workspace_id, folder_id, file_name
                        HAVING COUNT(*) > 1
                    ) THEN
                        RAISE EXCEPTION 'Cannot create active document filename unique indexes while duplicate active file names exist in the same folder.';
                    END IF;
                END $$;
                """);

            migrationBuilder.CreateIndex(
                name: "ix_reports_report_group_id",
                table: "reports",
                column: "report_group_id");

            migrationBuilder.CreateIndex(
                name: "ix_reports_workspace_id_report_group_id_version_number",
                table: "reports",
                columns: new[] { "workspace_id", "report_group_id", "version_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_documents_workspace_id_file_name",
                table: "documents",
                columns: new[] { "workspace_id", "file_name" },
                unique: true,
                filter: "folder_id IS NULL AND deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_documents_workspace_id_folder_id_file_name",
                table: "documents",
                columns: new[] { "workspace_id", "folder_id", "file_name" },
                unique: true,
                filter: "folder_id IS NOT NULL AND deleted_at IS NULL");

            migrationBuilder.AddCheckConstraint(
                name: "ck_chat_message_contexts_context_shape",
                table: "chat_message_contexts",
                sql: "(context_type = 'Folder' AND document_id IS NULL) OR (context_type = 'Document' AND folder_id IS NULL)");

            migrationBuilder.AddForeignKey(
                name: "fk_chat_message_contexts_documents_document_id",
                table: "chat_message_contexts",
                column: "document_id",
                principalTable: "documents",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_chat_message_contexts_folders_folder_id",
                table: "chat_message_contexts",
                column: "folder_id",
                principalTable: "folders",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_chat_message_contexts_documents_document_id",
                table: "chat_message_contexts");

            migrationBuilder.DropForeignKey(
                name: "fk_chat_message_contexts_folders_folder_id",
                table: "chat_message_contexts");

            migrationBuilder.DropIndex(
                name: "ix_reports_report_group_id",
                table: "reports");

            migrationBuilder.DropIndex(
                name: "ix_reports_workspace_id_report_group_id_version_number",
                table: "reports");

            migrationBuilder.DropIndex(
                name: "ix_documents_workspace_id_file_name",
                table: "documents");

            migrationBuilder.DropIndex(
                name: "ix_documents_workspace_id_folder_id_file_name",
                table: "documents");

            migrationBuilder.DropCheckConstraint(
                name: "ck_chat_message_contexts_context_shape",
                table: "chat_message_contexts");

            migrationBuilder.DropColumn(
                name: "report_group_id",
                table: "reports");

            migrationBuilder.DropColumn(
                name: "version_number",
                table: "reports");

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_contexts_document_id_workspace_id",
                table: "chat_message_contexts",
                columns: new[] { "document_id", "workspace_id" });

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_contexts_folder_id_workspace_id",
                table: "chat_message_contexts",
                columns: new[] { "folder_id", "workspace_id" });

            migrationBuilder.AddCheckConstraint(
                name: "ck_chat_message_contexts_context_shape",
                table: "chat_message_contexts",
                sql: "(context_type = 'Folder' AND folder_id IS NOT NULL AND document_id IS NULL) OR (context_type = 'Document' AND document_id IS NOT NULL AND folder_id IS NULL)");

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
        }
    }
}
