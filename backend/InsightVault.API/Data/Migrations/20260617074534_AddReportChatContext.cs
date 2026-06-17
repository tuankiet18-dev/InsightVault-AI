using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsightVault.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddReportChatContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_chat_message_contexts_context_shape",
                table: "chat_message_contexts");

            migrationBuilder.AddColumn<Guid>(
                name: "report_id",
                table: "chat_message_contexts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_contexts_chat_message_id_context_type_report_id",
                table: "chat_message_contexts",
                columns: new[] { "chat_message_id", "context_type", "report_id" },
                unique: true,
                filter: "report_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_contexts_report_id",
                table: "chat_message_contexts",
                column: "report_id");

            migrationBuilder.AddCheckConstraint(
                name: "ck_chat_message_contexts_context_shape",
                table: "chat_message_contexts",
                sql: "(context_type = 'Folder' AND document_id IS NULL AND report_id IS NULL) OR (context_type = 'Document' AND folder_id IS NULL AND report_id IS NULL) OR (context_type = 'Report' AND folder_id IS NULL AND document_id IS NULL)");

            migrationBuilder.AddForeignKey(
                name: "fk_chat_message_contexts_reports_report_id",
                table: "chat_message_contexts",
                column: "report_id",
                principalTable: "reports",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_chat_message_contexts_reports_report_id",
                table: "chat_message_contexts");

            migrationBuilder.DropIndex(
                name: "ix_chat_message_contexts_chat_message_id_context_type_report_id",
                table: "chat_message_contexts");

            migrationBuilder.DropIndex(
                name: "ix_chat_message_contexts_report_id",
                table: "chat_message_contexts");

            migrationBuilder.DropCheckConstraint(
                name: "ck_chat_message_contexts_context_shape",
                table: "chat_message_contexts");

            migrationBuilder.DropColumn(
                name: "report_id",
                table: "chat_message_contexts");

            migrationBuilder.AddCheckConstraint(
                name: "ck_chat_message_contexts_context_shape",
                table: "chat_message_contexts",
                sql: "(context_type = 'Folder' AND document_id IS NULL) OR (context_type = 'Document' AND folder_id IS NULL)");
        }
    }
}
