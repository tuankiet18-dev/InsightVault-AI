# Backend Deployment Hardening

This note documents the backend deployment baseline. It is intentionally small and operational: every environment should fail early when required configuration is missing, expose health endpoints, and avoid committing real secrets.

## Required Runtime Configuration

Set these values through environment variables or the hosting platform secret manager:

```text
ConnectionStrings__Postgres
Jwt__Issuer
Jwt__Audience
Jwt__SigningKey
MinIO__Endpoint
MinIO__AccessKey
MinIO__SecretKey
MinIO__BucketName
RabbitMQ__Host
RabbitMQ__Port
RabbitMQ__Username
RabbitMQ__Password
RabbitMQ__DocumentProcessingQueue
RabbitMQ__AiJobsQueue
RabbitMQ__EmailQueue
AIService__BaseUrl
Smtp__Enabled
Smtp__Host
Smtp__Port
Smtp__Username
Smtp__Password
Smtp__SenderName
Smtp__SenderEmail
Smtp__UseSsl
Billing__EnforceCredits
Billing__DocumentCreditsPerFiveMb
Billing__GenerateReportBaseCredits
Billing__CompareBaseCredits
Billing__CompareAdditionalDocumentCredits
PayOS__Enabled
PayOS__ClientId
PayOS__ApiKey
PayOS__ChecksumKey
PayOS__ReturnUrl
PayOS__CancelUrl
PayOS__CheckoutExpiryMinutes
```

`Jwt__SigningKey` must be at least 32 bytes. Use a unique value per environment.

`GoogleAuth__ClientId` is still environment-specific. Keep it outside Git and provide it in deployments that use Google sign-in.

`Smtp__Enabled=false` and `PayOS__Enabled=false` are valid local/demo defaults.
When either integration is enabled, the corresponding credentials and URLs must
be provided by the deployment environment. Do not commit SMTP passwords, PayOS
keys, tunnel URLs, or production callback URLs.

Persist ASP.NET DataProtection keys in production. Local containers may warn
that keys live only inside the container; that is acceptable for development but
not for multi-instance or long-lived production deployments.

## Health Endpoints

The API exposes deployment-friendly health endpoints:

```text
GET /health/live
GET /health/ready
```

`/health/live` only checks that the ASP.NET process can respond.

`/health/ready` checks PostgreSQL connectivity and should be used for readiness gates where supported.

The existing API endpoints remain available:

```text
GET /api/health
GET /api/health/db
```

## Docker Baseline

The backend image:

- uses a multi-stage .NET publish build,
- listens on port `8080`,
- runs as the built-in non-root `app` user,
- defines a container healthcheck against `/health/live`.

The full compose stack currently includes frontend, backend, AI service,
PostgreSQL with pgvector, RabbitMQ, and MinIO. RabbitMQ is no longer just an
optional design note; it is used by document processing, AI jobs, and email
queueing.

Build locally:

```powershell
docker build backend/InsightVault.API --tag insightvault-api:local
```

## Local Compose

Copy the example file before running the full stack:

```powershell
Copy-Item infra/.env.example infra/.env
```

Then replace the `change-me-*` values in `infra/.env`. The compose file intentionally requires secret values instead of silently falling back to weak default passwords.

Run through the repository Docker script:

```powershell
.\scripts\start-docker.ps1
```

## CI Gate

CI now builds the backend container image after the Release build. This catches Dockerfile or publish-layout regressions before a PR is merged.
