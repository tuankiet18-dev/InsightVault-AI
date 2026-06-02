using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsightVault.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class HybridRagRetrievalDebug : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "normalized_content",
                table: "document_chunks",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "metadata",
                table: "chat_message_sources",
                type: "jsonb",
                nullable: false,
                defaultValueSql: "'{}'::jsonb");

            migrationBuilder.Sql(
                "UPDATE document_chunks SET normalized_content = lower(content) WHERE normalized_content = ''");

            migrationBuilder.Sql(
                "CREATE INDEX ix_document_chunks_content_fts ON document_chunks USING gin (to_tsvector('simple', content))");

            migrationBuilder.Sql(
                "CREATE INDEX ix_document_chunks_normalized_content_fts ON document_chunks USING gin (to_tsvector('simple', normalized_content))");

            migrationBuilder.CreateIndex(
                name: "ix_chat_message_sources_metadata",
                table: "chat_message_sources",
                column: "metadata")
                .Annotation("Npgsql:IndexMethod", "gin");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_chat_message_sources_metadata",
                table: "chat_message_sources");

            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_document_chunks_normalized_content_fts");
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_document_chunks_content_fts");

            migrationBuilder.DropColumn(
                name: "metadata",
                table: "chat_message_sources");

            migrationBuilder.DropColumn(
                name: "normalized_content",
                table: "document_chunks");
        }
    }
}
