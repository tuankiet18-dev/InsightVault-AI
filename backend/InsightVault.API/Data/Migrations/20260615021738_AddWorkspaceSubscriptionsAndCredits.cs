using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace InsightVault.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkspaceSubscriptionsAndCredits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "credit_packages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    price_vnd = table.Column<long>(type: "bigint", nullable: false),
                    credits = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_credit_packages", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "subscription_plans",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    price_vnd = table.Column<long>(type: "bigint", nullable: false),
                    billing_period_months = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    included_credits = table.Column<int>(type: "integer", nullable: false),
                    max_members = table.Column<int>(type: "integer", nullable: false),
                    storage_limit_bytes = table.Column<long>(type: "bigint", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_subscription_plans", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "payment_orders",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_by_id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: true),
                    credit_package_id = table.Column<Guid>(type: "uuid", nullable: true),
                    purchase_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    provider_order_code = table.Column<long>(type: "bigint", nullable: false),
                    provider_payment_link_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    provider_reference = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    amount_vnd = table.Column<long>(type: "bigint", nullable: false),
                    checkout_url = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    paid_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_payment_orders", x => x.id);
                    table.CheckConstraint("ck_payment_orders_product_shape", "(purchase_type = 'Subscription' AND plan_id IS NOT NULL AND credit_package_id IS NULL) OR (purchase_type = 'CreditTopUp' AND plan_id IS NULL AND credit_package_id IS NOT NULL)");
                    table.ForeignKey(
                        name: "fk_payment_orders_credit_packages_credit_package_id",
                        column: x => x.credit_package_id,
                        principalTable: "credit_packages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_payment_orders_subscription_plans_plan_id",
                        column: x => x.plan_id,
                        principalTable: "subscription_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_payment_orders_users_created_by_id",
                        column: x => x.created_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_payment_orders_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "workspace_subscriptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false),
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

            migrationBuilder.CreateTable(
                name: "credit_ledger_entries",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    workspace_subscription_id = table.Column<Guid>(type: "uuid", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ai_job_id = table.Column<Guid>(type: "uuid", nullable: true),
                    payment_order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    entry_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    bucket = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    credits = table.Column<int>(type: "integer", nullable: false),
                    usage_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    idempotency_key = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_credit_ledger_entries", x => x.id);
                    table.ForeignKey(
                        name: "fk_credit_ledger_entries_ai_jobs_ai_job_id",
                        column: x => x.ai_job_id,
                        principalTable: "ai_jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_credit_ledger_entries_payment_orders_payment_order_id",
                        column: x => x.payment_order_id,
                        principalTable: "payment_orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_credit_ledger_entries_workspace_subscriptions_workspace_sub",
                        column: x => x.workspace_subscription_id,
                        principalTable: "workspace_subscriptions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_credit_ledger_entries_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "credit_packages",
                columns: new[] { "id", "code", "created_at", "credits", "display_order", "is_active", "name", "price_vnd", "updated_at" },
                values: new object[,]
                {
                    { new Guid("20000000-0000-0000-0000-000000000001"), "topup_500", new DateTimeOffset(new DateTime(2026, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), 500, 1, true, "500 AI Credits", 39000L, new DateTimeOffset(new DateTime(2026, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("20000000-0000-0000-0000-000000000002"), "topup_2000", new DateTimeOffset(new DateTime(2026, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), 2000, 2, true, "2,000 AI Credits", 129000L, new DateTimeOffset(new DateTime(2026, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("20000000-0000-0000-0000-000000000003"), "topup_5000", new DateTimeOffset(new DateTime(2026, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), 5000, 3, true, "5,000 AI Credits", 279000L, new DateTimeOffset(new DateTime(2026, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) }
                });

            migrationBuilder.InsertData(
                table: "subscription_plans",
                columns: new[] { "id", "billing_period_months", "code", "created_at", "description", "display_order", "included_credits", "is_active", "max_members", "name", "price_vnd", "storage_limit_bytes", "updated_at" },
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0000-000000000001"), 1, "free", new DateTimeOffset(new DateTime(2026, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "For trying the core document intelligence workflow.", 1, 100, true, 1, "Free", 0L, 524288000L, new DateTimeOffset(new DateTime(2026, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("10000000-0000-0000-0000-000000000002"), 1, "pro", new DateTimeOffset(new DateTime(2026, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "For students and small teams using AI regularly.", 2, 1500, true, 5, "Pro", 99000L, 5368709120L, new DateTimeOffset(new DateTime(2026, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("10000000-0000-0000-0000-000000000003"), 1, "team", new DateTimeOffset(new DateTime(2026, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "For larger collaborative workspaces with heavier AI usage.", 3, 5000, true, 15, "Team", 249000L, 21474836480L, new DateTimeOffset(new DateTime(2026, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) }
                });

            migrationBuilder.CreateIndex(
                name: "ix_credit_ledger_entries_ai_job_id",
                table: "credit_ledger_entries",
                column: "ai_job_id");

            migrationBuilder.CreateIndex(
                name: "ix_credit_ledger_entries_idempotency_key",
                table: "credit_ledger_entries",
                column: "idempotency_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_credit_ledger_entries_payment_order_id",
                table: "credit_ledger_entries",
                column: "payment_order_id");

            migrationBuilder.CreateIndex(
                name: "ix_credit_ledger_entries_workspace_id_created_at",
                table: "credit_ledger_entries",
                columns: new[] { "workspace_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_credit_ledger_entries_workspace_subscription_id",
                table: "credit_ledger_entries",
                column: "workspace_subscription_id");

            migrationBuilder.CreateIndex(
                name: "ix_credit_packages_code",
                table: "credit_packages",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_credit_packages_is_active_display_order",
                table: "credit_packages",
                columns: new[] { "is_active", "display_order" });

            migrationBuilder.CreateIndex(
                name: "ix_payment_orders_created_by_id",
                table: "payment_orders",
                column: "created_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_payment_orders_credit_package_id",
                table: "payment_orders",
                column: "credit_package_id");

            migrationBuilder.CreateIndex(
                name: "ix_payment_orders_plan_id",
                table: "payment_orders",
                column: "plan_id");

            migrationBuilder.CreateIndex(
                name: "ix_payment_orders_provider_order_code",
                table: "payment_orders",
                column: "provider_order_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_payment_orders_provider_payment_link_id",
                table: "payment_orders",
                column: "provider_payment_link_id",
                unique: true,
                filter: "provider_payment_link_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_payment_orders_provider_reference",
                table: "payment_orders",
                column: "provider_reference",
                unique: true,
                filter: "provider_reference IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_payment_orders_status",
                table: "payment_orders",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_payment_orders_workspace_id_created_at",
                table: "payment_orders",
                columns: new[] { "workspace_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_subscription_plans_code",
                table: "subscription_plans",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_subscription_plans_is_active_display_order",
                table: "subscription_plans",
                columns: new[] { "is_active", "display_order" });

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "credit_ledger_entries");

            migrationBuilder.DropTable(
                name: "payment_orders");

            migrationBuilder.DropTable(
                name: "workspace_subscriptions");

            migrationBuilder.DropTable(
                name: "credit_packages");

            migrationBuilder.DropTable(
                name: "subscription_plans");
        }
    }
}
