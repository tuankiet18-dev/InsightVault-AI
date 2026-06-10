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
AIService__BaseUrl
```

`Jwt__SigningKey` must be at least 32 bytes. Use a unique value per environment.

`GoogleAuth__ClientId` is still environment-specific. Keep it outside Git and provide it in deployments that use Google sign-in.

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

Run:

```powershell
Push-Location infra
docker compose --env-file .env up --build
Pop-Location
```

## CI Gate

CI now builds the backend container image after the Release build. This catches Dockerfile or publish-layout regressions before a PR is merged.
