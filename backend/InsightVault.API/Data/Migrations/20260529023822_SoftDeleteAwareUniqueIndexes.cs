using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsightVault.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class SoftDeleteAwareUniqueIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_workspace_members_workspace_id_email",
                table: "workspace_members");

            migrationBuilder.DropIndex(
                name: "ix_workspace_members_workspace_id_user_id",
                table: "workspace_members");

            migrationBuilder.DropIndex(
                name: "ix_folders_workspace_id_name",
                table: "folders");

            migrationBuilder.DropIndex(
                name: "ix_folders_workspace_id_parent_folder_id_name",
                table: "folders");

            migrationBuilder.CreateIndex(
                name: "ix_workspace_members_removed_at",
                table: "workspace_members",
                column: "removed_at");

            migrationBuilder.CreateIndex(
                name: "ix_workspace_members_workspace_id_email",
                table: "workspace_members",
                columns: new[] { "workspace_id", "email" },
                unique: true,
                filter: "removed_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_workspace_members_workspace_id_user_id",
                table: "workspace_members",
                columns: new[] { "workspace_id", "user_id" },
                unique: true,
                filter: "removed_at IS NULL AND user_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_folders_workspace_id_name",
                table: "folders",
                columns: new[] { "workspace_id", "name" },
                unique: true,
                filter: "parent_folder_id IS NULL AND deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_folders_workspace_id_parent_folder_id_name",
                table: "folders",
                columns: new[] { "workspace_id", "parent_folder_id", "name" },
                unique: true,
                filter: "parent_folder_id IS NOT NULL AND deleted_at IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_workspace_members_removed_at",
                table: "workspace_members");

            migrationBuilder.DropIndex(
                name: "ix_workspace_members_workspace_id_email",
                table: "workspace_members");

            migrationBuilder.DropIndex(
                name: "ix_workspace_members_workspace_id_user_id",
                table: "workspace_members");

            migrationBuilder.DropIndex(
                name: "ix_folders_workspace_id_name",
                table: "folders");

            migrationBuilder.DropIndex(
                name: "ix_folders_workspace_id_parent_folder_id_name",
                table: "folders");

            migrationBuilder.CreateIndex(
                name: "ix_workspace_members_workspace_id_email",
                table: "workspace_members",
                columns: new[] { "workspace_id", "email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_workspace_members_workspace_id_user_id",
                table: "workspace_members",
                columns: new[] { "workspace_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_folders_workspace_id_name",
                table: "folders",
                columns: new[] { "workspace_id", "name" },
                unique: true,
                filter: "parent_folder_id IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_folders_workspace_id_parent_folder_id_name",
                table: "folders",
                columns: new[] { "workspace_id", "parent_folder_id", "name" },
                unique: true,
                filter: "parent_folder_id IS NOT NULL");
        }
    }
}
