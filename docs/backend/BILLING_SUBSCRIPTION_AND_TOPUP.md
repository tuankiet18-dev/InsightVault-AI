# Workspace Billing, Subscription, and AI Credits

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

Webhook processing locks the matching payment order before checking its
status. A replay of an already paid order returns without granting credits
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

The webhook is the authority for activating a plan or granting top-up credits.
The browser return URL must never grant credits.

All application timestamps use `DateTimeOffset.UtcNow`. payOS checkout expiry
is sent as a Unix timestamp, which is timezone-independent. A successful,
signature-verified webhook is matched by provider order code and amount; local
wall-clock timezone differences are not used to decide whether payment
succeeded.

## payOS configuration

Create a payment channel in the payOS dashboard and copy its Client ID, API Key,
and Checksum Key into local or deployment environment variables:

```env
PAYOS_ENABLED=true
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
PAYOS_RETURN_URL=https://your-frontend.example/billing/success
PAYOS_CANCEL_URL=https://your-frontend.example/billing/cancel
```

Register the public backend webhook URL:

```text
https://your-api.example/api/billing/payos/webhook
```

For local webhook testing, expose the backend through an HTTPS tunnel. Do not
commit payOS credentials or tunnel secrets.

## payOS and VNPay

Both providers should remain behind the backend payment gateway abstraction.

payOS is simpler for an MVP:

- Creates a hosted checkout/payment link.
- Focuses on VietQR and bank transfers.
- Sends signed JSON webhooks.
- Uses Client ID, API Key, and Checksum Key.
- The official .NET SDK verifies webhook signatures.

VNPay commonly uses a redirect query string:

- Backend builds sorted `vnp_*` parameters and an HMAC signature.
- User is redirected to the VNPay payment page.
- Browser returns through `vnp_ReturnUrl`.
- Backend confirms the payment through the signed IPN endpoint.
- Merchant setup commonly includes TMN code, hash secret, and provider-specific
  transaction/status codes.

The important rule is the same for both: provision the purchase from a verified
server-to-server webhook/IPN, never from the browser redirect alone.

To add VNPay later, implement another `IPaymentGateway`; billing tables, plans,
credit ledger, and quota guards do not need to change.
