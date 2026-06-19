# Workspace Billing, Subscription, and AI Credits

Current status, 2026-06-15: backend billing APIs, EF migration, PayOS gateway,
credit ledger, and debit/refund guards are implemented. Dedicated frontend
billing screens and real PayOS webhook verification in a public environment are
still pending.

## Ownership model

Billing belongs to a workspace, not an individual user.

- The workspace owner purchases plans and credit top-ups.
- Active workspace members consume the same workspace credit balance.
- Read-only operations remain available when credits are exhausted.
- Operations that create external AI cost are rejected with HTTP `402` when
  the workspace has insufficient credits.

## Products

Seeded monthly plans:

| Code | Price | Credits | Members | Storage |
|---|---:|---:|---:|---:|
| `free` | 0 VND | 100 | 1 | 500 MB |
| `pro` | 99,000 VND | 1,500 | 5 | 5 GB |
| `team` | 249,000 VND | 5,000 | 15 | 20 GB |

Seeded top-ups:

| Code | Price | Credits |
|---|---:|---:|
| `topup_500` | 39,000 VND | 500 |
| `topup_2000` | 129,000 VND | 2,000 |
| `topup_5000` | 279,000 VND | 5,000 |

Recurring plan credits reset when a new paid period starts. Top-up credits are
kept separately so they are not erased by the monthly reset.

## Credit charging

Default costs are configuration-driven:

- Process document: 1 credit per started 5 MB.
- Generate report: 5 credits.
- Compare two documents: 5 credits.
- Each additional compared document: 2 credits.

Recurring credits are consumed before top-up credits. Every grant, debit,
refund, and adjustment is appended to `credit_ledger_entries` with a unique
idempotency key.

Retries do not create another debit. If an operation cannot be published to
RabbitMQ, its debit is refunded.

### Concurrency and atomicity

Credit mutations run inside a database transaction and acquire a PostgreSQL
`FOR UPDATE` lock on the workspace row. This serializes debit, refund, and
payment grants for the same workspace while allowing unrelated workspaces to
continue concurrently.

The balance update and its ledger entries are saved in the same transaction.
If the ledger insert fails, the balance update is rolled back. Unique
idempotency keys remain a second line of defense against duplicate debit,
refund, or grant entries.

Payment callback processing locks the matching payment order before checking
its status. A replay of an already paid order returns without granting credits
again. Different paid orders for the same workspace are additionally
serialized by the workspace lock.

The AI job is added to the EF Core unit of work before credit consumption, so
the job row and its debit ledger entries are inserted atomically before the
message is published to RabbitMQ.

## API

Public catalog:

```text
GET /api/billing/plans
GET /api/billing/credit-packages
```

Authenticated workspace endpoints:

```text
GET  /api/workspaces/{workspaceId}/billing
POST /api/workspaces/{workspaceId}/billing/checkout
```

Only the workspace owner may create checkout sessions.

Request:

```json
{
  "productCode": "pro"
}
```

payOS webhook:

```text
POST /api/billing/payos/webhook
```

Only a payOS webhook verified by the backend may activate a plan or grant
top-up credits automatically. The frontend never updates billing state by
itself.

For local development without a public backend URL, the frontend route
`/billing/return` forwards the payOS return query to:

```text
GET /api/billing/payos/return
```

This return endpoint does not trust browser query status. It extracts the
`orderCode`, calls payOS to retrieve the authoritative payment-link status, and
only then updates billing. Keeping the webhook enabled in deployed environments
is still recommended because users can close the browser before the return
redirect.

All persisted application timestamps use `DateTimeOffset.UtcNow`.

## payOS configuration

Copy payOS credentials into local environment variables:

```env
PAYOS_ENABLED=true
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
PAYOS_RETURN_URL=http://localhost:5173/billing/return
PAYOS_CANCEL_URL=http://localhost:5173/billing/return
PAYOS_CHECKOUT_EXPIRY_MINUTES=15
```

For deployed environments, use the deployed frontend route for return/cancel:

```env
PAYOS_RETURN_URL=https://your-frontend.example/billing/return
PAYOS_CANCEL_URL=https://your-frontend.example/billing/return
```

Register the public backend webhook URL in payOS when the backend has a public
domain:

```text
https://your-api.example/api/billing/payos/webhook
```

For local webhook testing, expose the backend through an HTTPS tunnel. payOS
must be able to reach the webhook URL from its servers. Do not commit payOS
credentials or tunnel secrets.

## payOS flow

- Backend creates a payOS payment link for the pending payment order.
- The user is redirected to the payOS checkout page.
- In production, payOS calls the backend webhook. Backend verifies the webhook
  signature through the payOS SDK before applying the order.
- In local/dev, the browser returns to `/billing/return`; the frontend calls
  `/api/billing/payos/return`, and backend retrieves the payment link from
  payOS by `orderCode` before applying the order.
- The payment order row and workspace row are locked before granting credits.
- Replayed callbacks return without granting credits again.

The provider remains behind `IPaymentGateway`; subscription plans, payment
orders, credit ledger, and quota enforcement stay provider-neutral.
