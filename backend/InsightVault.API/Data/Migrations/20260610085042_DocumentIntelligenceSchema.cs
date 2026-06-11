using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsightVault.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class DocumentIntelligenceSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "audience_fit",
                table: "documents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "document_type",
                table: "documents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "document_type_confidence",
                table: "documents",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "insights",
                table: "documents",
                type: "jsonb",
                nullable: false,
                defaultValueSql: "'{}'::jsonb");

            migrationBuilder.CreateIndex(
                name: "ix_documents_document_type",
                table: "documents",
                column: "document_type");

            migrationBuilder.CreateIndex(
                name: "ix_documents_insights",
                table: "documents",
                column: "insights")
                .Annotation("Npgsql:IndexMethod", "gin");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_documents_document_type",
                table: "documents");

            migrationBuilder.DropIndex(
                name: "ix_documents_insights",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "audience_fit",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "document_type",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "document_type_confidence",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "insights",
                table: "documents");
        }
    }
}
