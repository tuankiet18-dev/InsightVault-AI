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

IPN processing locks the matching payment order before checking its
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

VNPay IPN:

```text
GET /api/billing/vnpay/ipn
```

Only a signed VNPay callback verified by the backend may activate a plan or
grant top-up credits. The frontend never updates billing state by itself.

For local sandbox development, the frontend route `/billing/return` forwards
the complete signed VNPay query to:

```text
GET /api/billing/vnpay/return
```

This backend endpoint runs the same signature, merchant, order, amount, and
status validation as IPN before updating billing. The frontend never marks an
order paid by itself. Keeping IPN enabled in deployed environments is still
recommended because users can close the browser before the return redirect.

All persisted application timestamps use `DateTimeOffset.UtcNow`. VNPay requires
`vnp_CreateDate` and `vnp_ExpireDate` in GMT+7, so checkout generation converts
UTC values to the fixed Vietnam offset before formatting `yyyyMMddHHmmss`. A
successful HMAC-SHA512 verified IPN is matched by `vnp_TxnRef`, amount, response
code, and transaction status.

## VNPay Sandbox configuration

Register at the VNPay Sandbox developer portal and copy the sandbox TmnCode and
Hash Secret into local environment variables:

```env
VNPAY_ENABLED=true
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...
VNPAY_RETURN_URL=https://your-frontend.example/billing/success
```

Register the public backend IPN URL:

```text
https://your-api.example/api/billing/vnpay/ipn
```

For local IPN testing, expose the backend through an HTTPS tunnel. VNPay must be
able to reach the IPN URL from its servers. Do not commit sandbox credentials or
tunnel secrets.

## VNPay flow

- Backend creates sorted `vnp_*` query parameters.
- The amount is sent as VND multiplied by 100.
- Checkout data is signed with HMAC-SHA512 using the sandbox Hash Secret.
- The user is redirected to the VNPay Sandbox payment page.
- The browser returns through `vnp_ReturnUrl` for display only.
- VNPay calls the backend IPN with signed query parameters.
- Backend validates signature, TmnCode, transaction reference, amount,
  `vnp_ResponseCode`, and `vnp_TransactionStatus`.
- The payment order row and workspace row are locked before granting credits.
- Replayed IPNs return `RspCode=02` without granting credits again.

The provider remains behind `IPaymentGateway`; subscription plans, payment
orders, credit ledger, and quota enforcement stay provider-neutral.
