using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsightVault.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class MigrateToAccountBasedBilling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_subscriptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    recurring_credits_remaining = table.Column<int>(type: "integer", nullable: false),
                    top_up_credits_remaining = table.Column<int>(type: "integer", nullable: false),
                    current_period_start = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    current_period_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    cancel_at_period_end = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_subscriptions", x => x.id);
                    table.ForeignKey(
                        name: "fk_user_subscriptions_subscription_plans_plan_id",
                        column: x => x.plan_id,
                        principalTable: "subscription_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_user_subscriptions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(@"
                INSERT INTO user_subscriptions (id, user_id, plan_id, status, recurring_credits_remaining, top_up_credits_remaining, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at)
                SELECT DISTINCT ON (w.owner_id) ws.id, w.owner_id, ws.plan_id, ws.status, ws.recurring_credits_remaining, ws.top_up_credits_remaining, ws.current_period_start, ws.current_period_end, ws.cancel_at_period_end, ws.created_at, ws.updated_at
                FROM workspace_subscriptions ws
                JOIN workspaces w ON ws.workspace_id = w.id
                ORDER BY w.owner_id, ws.created_at DESC;
            ");

            migrationBuilder.AddColumn<Guid>(
                name: "user_id",
                table: "credit_ledger_entries",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            // DATA MIGRATION: set user_id for credit ledger entries
            migrationBuilder.Sql(@"
                UPDATE credit_ledger_entries cle
                SET user_id = w.owner_id
                FROM workspaces w
                WHERE cle.workspace_id = w.id;
            ");

            // DATA MIGRATION: update orphaned credit_ledger_entries to point to the kept user_subscription
            // (Since we used DISTINCT ON to keep only 1 subscription per user, other ledger entries would have invalid subscription IDs)
            migrationBuilder.Sql(@"
                UPDATE credit_ledger_entries cle
                SET workspace_subscription_id = us.id
                FROM user_subscriptions us
                WHERE cle.user_id = us.user_id;
            ");

            migrationBuilder.DropForeignKey(
                name: "fk_credit_ledger_entries_workspace_subscriptions_workspace_sub",
                table: "credit_ledger_entries");

            migrationBuilder.DropForeignKey(
                name: "fk_credit_ledger_entries_workspaces_workspace_id",
                table: "credit_ledger_entries");

            migrationBuilder.DropForeignKey(
                name: "fk_payment_orders_users_created_by_id",
                table: "payment_orders");

            migrationBuilder.DropForeignKey(
                name: "fk_payment_orders_workspaces_workspace_id",
                table: "payment_orders");

            migrationBuilder.DropTable(
                name: "workspace_subscriptions");

            migrationBuilder.DropIndex(
                name: "ix_payment_orders_created_by_id",
                table: "payment_orders");

            migrationBuilder.DropIndex(
                name: "ix_payment_orders_workspace_id_created_at",
                table: "payment_orders");

            migrationBuilder.DropColumn(
                name: "workspace_id",
                table: "payment_orders");

            migrationBuilder.RenameColumn(
                name: "workspace_subscription_id",
                table: "credit_ledger_entries",
                newName: "user_subscription_id");

            migrationBuilder.RenameIndex(
                name: "ix_credit_ledger_entries_workspace_subscription_id",
                table: "credit_ledger_entries",
                newName: "ix_credit_ledger_entries_user_subscription_id");

            migrationBuilder.AlterColumn<Guid>(
                name: "workspace_id",
                table: "credit_ledger_entries",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.CreateIndex(
                name: "ix_payment_orders_created_by_id_created_at",
                table: "payment_orders",
                columns: new[] { "created_by_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_credit_ledger_entries_user_id",
                table: "credit_ledger_entries",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_subscriptions_current_period_end",
                table: "user_subscriptions",
                column: "current_period_end");

            migrationBuilder.CreateIndex(
                name: "ix_user_subscriptions_plan_id",
                table: "user_subscriptions",
                column: "plan_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_subscriptions_status",
                table: "user_subscriptions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_user_subscriptions_user_id",
                table: "user_subscriptions",
                column: "user_id",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_credit_ledger_entries_user_subscriptions_user_subscription_",
                table: "credit_ledger_entries",
                column: "user_subscription_id",
                principalTable: "user_subscriptions",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_credit_ledger_entries_users_user_id",
                table: "credit_ledger_entries",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_credit_ledger_entries_workspaces_workspace_id",
                table: "credit_ledger_entries",
                column: "workspace_id",
                principalTable: "workspaces",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_payment_orders_users_created_by_id",
                table: "payment_orders",
                column: "created_by_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_credit_ledger_entries_user_subscriptions_user_subscription_",
                table: "credit_ledger_entries");

            migrationBuilder.DropForeignKey(
                name: "fk_credit_ledger_entries_users_user_id",
                table: "credit_ledger_entries");

            migrationBuilder.DropForeignKey(
                name: "fk_credit_ledger_entries_workspaces_workspace_id",
                table: "credit_ledger_entries");

            migrationBuilder.DropForeignKey(
                name: "fk_payment_orders_users_created_by_id",
                table: "payment_orders");

            migrationBuilder.DropTable(
                name: "user_subscriptions");

            migrationBuilder.DropIndex(
                name: "ix_payment_orders_created_by_id_created_at",
                table: "payment_orders");

            migrationBuilder.DropIndex(
                name: "ix_credit_ledger_entries_user_id",
                table: "credit_ledger_entries");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "credit_ledger_entries");

            migrationBuilder.RenameColumn(
                name: "user_subscription_id",
                table: "credit_ledger_entries",
                newName: "workspace_subscription_id");

            migrationBuilder.RenameIndex(
                name: "ix_credit_ledger_entries_user_subscription_id",
                table: "credit_ledger_entries",
                newName: "ix_credit_ledger_entries_workspace_subscription_id");

            migrationBuilder.AddColumn<Guid>(
                name: "workspace_id",
                table: "payment_orders",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<Guid>(
                name: "workspace_id",
                table: "credit_ledger_entries",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "workspace_subscriptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false),
                    cancel_at_period_end = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    current_period_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    current_period_start = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    recurring_credits_remaining = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    top_up_credits_remaining = table.Column<int>(type: "integer", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_workspace_subscriptions", x => x.id);
                    table.ForeignKey(
                        name: "fk_workspace_subscriptions_subscription_plans_plan_id",
                        column: x => x.plan_id,
                        principalTable: "subscription_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_workspace_subscriptions_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_payment_orders_created_by_id",
                table: "payment_orders",
                column: "created_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_payment_orders_workspace_id_created_at",
                table: "payment_orders",
                columns: new[] { "workspace_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_workspace_subscriptions_current_period_end",
                table: "workspace_subscriptions",
                column: "current_period_end");

            migrationBuilder.CreateIndex(
                name: "ix_workspace_subscriptions_plan_id",
                table: "workspace_subscriptions",
                column: "plan_id");

            migrationBuilder.CreateIndex(
                name: "ix_workspace_subscriptions_status",
                table: "workspace_subscriptions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_workspace_subscriptions_workspace_id",
                table: "workspace_subscriptions",
                column: "workspace_id",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_credit_ledger_entries_workspace_subscriptions_workspace_sub",
                table: "credit_ledger_entries",
                column: "workspace_subscription_id",
                principalTable: "workspace_subscriptions",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_credit_ledger_entries_workspaces_workspace_id",
                table: "credit_ledger_entries",
                column: "workspace_id",
                principalTable: "workspaces",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_payment_orders_users_created_by_id",
                table: "payment_orders",
                column: "created_by_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_payment_orders_workspaces_workspace_id",
                table: "payment_orders",
                column: "workspace_id",
                principalTable: "workspaces",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
