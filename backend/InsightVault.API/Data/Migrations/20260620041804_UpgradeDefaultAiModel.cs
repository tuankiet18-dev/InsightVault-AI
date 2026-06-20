using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsightVault.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpgradeDefaultAiModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE system_settings
                SET value = 'gemini-2.5-flash', updated_at = now()
                WHERE key = 'ai.default_model'
                  AND value = 'gemini-1.5-flash';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE system_settings
                SET value = 'gemini-1.5-flash', updated_at = now()
                WHERE key = 'ai.default_model'
                  AND value = 'gemini-2.5-flash';
                """);
        }
    }
}
