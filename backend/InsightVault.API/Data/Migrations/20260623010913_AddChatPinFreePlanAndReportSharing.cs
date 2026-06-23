using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsightVault.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddChatPinFreePlanAndReportSharing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_public",
                table: "reports",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "public_token",
                table: "reports",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "shared_expires_at",
                table: "reports",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_pinned",
                table: "chat_sessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "subscription_plans",
                keyColumn: "id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000001"),
                column: "max_members",
                value: 2);

            migrationBuilder.CreateIndex(
                name: "ix_reports_public_token",
                table: "reports",
                column: "public_token",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_reports_public_token",
                table: "reports");

            migrationBuilder.DropColumn(
                name: "is_public",
                table: "reports");

            migrationBuilder.DropColumn(
                name: "public_token",
                table: "reports");

            migrationBuilder.DropColumn(
                name: "shared_expires_at",
                table: "reports");

            migrationBuilder.DropColumn(
                name: "is_pinned",
                table: "chat_sessions");

            migrationBuilder.UpdateData(
                table: "subscription_plans",
                keyColumn: "id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000001"),
                column: "max_members",
                value: 1);
        }
    }
}
