using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsightVault.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddChatSessionIsPinned : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_pinned",
                table: "chat_sessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_pinned",
                table: "chat_sessions");
        }
    }
}
