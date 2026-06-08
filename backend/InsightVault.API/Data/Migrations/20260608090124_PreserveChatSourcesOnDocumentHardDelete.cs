using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsightVault.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class PreserveChatSourcesOnDocumentHardDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_chat_message_sources_documents_document_id",
                table: "chat_message_sources");

            migrationBuilder.Sql("DELETE FROM chat_message_sources WHERE document_id IS NULL;");

            migrationBuilder.AlterColumn<Guid>(
                name: "document_id",
                table: "chat_message_sources",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddForeignKey(
                name: "fk_chat_message_sources_documents_document_id",
                table: "chat_message_sources",
                column: "document_id",
                principalTable: "documents",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_chat_message_sources_documents_document_id",
                table: "chat_message_sources");

            migrationBuilder.AlterColumn<Guid>(
                name: "document_id",
                table: "chat_message_sources",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "fk_chat_message_sources_documents_document_id",
                table: "chat_message_sources",
                column: "document_id",
                principalTable: "documents",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
