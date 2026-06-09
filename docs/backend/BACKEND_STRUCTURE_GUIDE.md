# Backend Structure Guide

This guide documents the current ASP.NET Core backend structure for InsightVault AI. The backend uses Controller APIs, DTOs, application services, repositories, EF Core, and infrastructure adapters.

## Architecture Summary

The backend is the system-of-record owner. It should handle API validation, authentication, permission checks, workspace/document metadata, MinIO upload orchestration, AI job lifecycle, chat/report persistence, and calls to the Python AI service.

The AI service should focus on AI computation: extraction, chunking, embedding, vector search, prompt logic, Gemini calls, compare, and report generation internals. For the target clean design, AI service returns structured results to backend, and backend writes database state.

## Current Folder Tree

```text
backend/InsightVault.API/
  Controllers/
    HealthController.cs
    MetaController.cs
    AuthController.cs
    WorkspacesController.cs
    FoldersController.cs
    DocumentsController.cs
    AiJobsController.cs
    ChatController.cs
    ReportsController.cs
    AdminController.cs

  DTOs/
    Auth/
    Workspaces/
    Folders/
    Documents/
    AiJobs/
    Chat/
    Reports/
    Admin/

  Application/
    Abstractions/
      Repositories/
      Services/
        Auth/
        Workspaces/
        Folders/
        Documents/
        AiJobs/
        Chat/
        Reports/
        Admin/
    Services/
      Auth/
      Workspaces/
      Folders/
      Documents/
      AiJobs/
      Chat/
      Reports/
      Admin/

  Domain/
    Entities/
    Enums/

  Data/
    InsightVaultDbContext.cs
    InsightVaultDbContextFactory.cs
    Migrations/

  Infrastructure/
    DependencyInjection.cs
    Persistence/
      Repositories/
    Storage/
    Ai/
    Auth/
    BackgroundJobs/

  Common/
    Errors/

  Properties/
  Program.cs
  appsettings.json
  appsettings.Development.example.json
```

`bin/` and `obj/` are build output folders and should not be edited or committed.

`appsettings.Development.json` is local-only and ignored by Git. Copy
`appsettings.Development.example.json` to `appsettings.Development.json` for local
development, then fill local credentials there or use environment variables such as
`ConnectionStrings__Postgres`, `Jwt__SigningKey`, `MinIO__SecretKey`, and
`RabbitMQ__Password`.

Do not use values from the example file in staging or production. Deployment must
provide secrets through environment variables or the platform secret manager.

Deployment/runtime hardening rules are documented in
`docs/backend/BACKEND_DEPLOYMENT_HARDENING.md`.

Backend MVP manual/integration acceptance checks are documented in
`docs/backend/BACKEND_MVP_MANUAL_TEST_CHECKLIST.md`.

## What Goes Where

| Folder | Purpose |
|---|---|
| `Controllers` | ASP.NET Core controllers. Keep controllers thin: receive HTTP input, call services, and return responses. |
| `DTOs` | API request/response models. Do not return EF entities directly from controllers. |
| `Application/Abstractions/Services` | Service interfaces such as `IDocumentService`, `IFolderService`, `IAuthService`. |
| `Application/Services` | Business/use-case services. Services coordinate repositories, storage, AI calls, and `SaveChangesAsync`. |
| `Application/Abstractions/Repositories` | Repository interfaces such as `IDocumentRepository`, `IFolderRepository`, `IAiJobRepository`. |
| `Infrastructure/Persistence/Repositories` | EF Core repository implementations. |
| `Infrastructure/Storage` | MinIO implementation and file/object-key conventions. |
| `Infrastructure/Ai` | HTTP client/adapters for the Python AI service. |
| `Infrastructure/Auth` | JWT, Google OAuth, current-user helpers, and authorization handlers. |
| `Infrastructure/BackgroundJobs` | Workers or queue consumers for document processing/report jobs. |
| `Domain/Entities` | EF Core entities. |
| `Domain/Enums` | Domain enums used by entities and business logic. |
| `Data` | EF Core DbContext, design-time factory, and migrations. |
| `Common/Errors` | Shared error/exception helpers if needed. |
| `Properties` | ASP.NET launch profiles such as `launchSettings.json`. |

## Dependency Direction

Use this direction for new code:

```text
Controllers
  -> Application service interfaces
  -> Application services
  -> Repository interfaces
  -> Repository implementations
  -> DbContext
```

Infrastructure implements technical details. Application services should depend on interfaces instead of directly depending on MinIO, HTTP clients, or concrete repository classes.

## Controller Convention

Controllers should not contain EF Core queries, MinIO logic, AI HTTP calls, or large business rules. Put that logic in application services.

Example:

```csharp
using InsightVault.API.Application.Abstractions.Services.Documents;
using InsightVault.API.DTOs.Documents;
using Microsoft.AspNetCore.Mvc;

namespace InsightVault.API.Controllers;

[ApiController]
[Route("api/workspaces/{workspaceId:guid}/documents")]
public sealed class DocumentsController(IDocumentService documentService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<UploadDocumentResponse>> UploadDocument(
        Guid workspaceId,
        [FromForm] UploadDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await documentService.UploadAsync(workspaceId, request, cancellationToken);
        return CreatedAtAction(nameof(GetDocument), new { documentId = result.DocumentId }, result);
    }
}
```

`Program.cs` should keep only startup wiring:

```csharp
builder.Services.AddControllers();
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
app.UseMiddleware<ApiExceptionMiddleware>();
app.MapControllers();
```

Controllers should not wrap every action in `try/catch`. Throw `ApiException` from services for expected business errors and let `ApiExceptionMiddleware` format the API error response.

## DTO Convention

Place DTOs by feature:

```text
DTOs/Documents/UploadDocumentRequest.cs
DTOs/Documents/DocumentResponse.cs
DTOs/Folders/CreateFolderRequest.cs
DTOs/Folders/FolderResponse.cs
DTOs/AiJobs/AiJobResponse.cs
DTOs/Reports/GenerateReportRequest.cs
```

DTOs are the public API contract between frontend and backend. They should not expose navigation properties or EF tracking behavior.

## Service Convention

Use service interfaces for feature behavior:

```text
Application/Abstractions/Services/Documents/IDocumentService.cs
Application/Services/Documents/DocumentService.cs
```

Services should:

- Validate business rules.
- Check permissions through `IWorkspacePermissionService`.
- Coordinate repositories.
- Call MinIO storage services or AI service clients.
- Call `SaveChangesAsync` once after related repository operations.

Recommended flow:

```text
Controller
  -> IDocumentService
    -> ICurrentUserService / IWorkspacePermissionService
    -> IDocumentRepository
    -> IAiJobRepository
    -> storage/AI infrastructure abstractions
    -> DbContext.SaveChangesAsync
```

## Auth And Permission Convention

Feature services should get the current user through `ICurrentUserService` and check workspace access through `IWorkspacePermissionService` before reading or mutating workspace-scoped data.

```text
List/read APIs:
  IWorkspacePermissionService.EnsureCanViewWorkspaceAsync(...)

Create/update/delete APIs:
  IWorkspacePermissionService.EnsureCanManageFoldersAsync(...)
```

Until JWT authentication is implemented, development requests can pass `X-User-Id: <user-guid>` so backend APIs can still test permission checks against `workspaces.owner_id` and `workspace_members`.

## Folder Rules

Deleting a folder is a soft delete. When a parent folder is deleted, all active child folders under that parent are soft-deleted in the same operation.

Folder names are unique among active sibling folders with the same parent in the same workspace. The database uses filtered unique indexes with `deleted_at IS NULL`, so a user can create a new folder with the same name after the old folder is soft-deleted.

Workspace member email/user uniqueness is also scoped to active membership rows with `removed_at IS NULL`, so removed members can be invited again later.

## Document Upload Rules

Document upload uses a presigned-upload flow:

```text
FE -> BE: request presigned upload
BE -> DB: create document with pending_upload
FE -> object storage: upload file
FE -> BE: confirm upload
BE -> DB: mark uploaded and create process_document ai_job
```

Backend owns workspace permission checks, object key generation, document metadata, and AI job creation. Frontend must not choose the bucket or object key.

Storage code is behind `IObjectStorageService`. The MinIO SDK implementation lives in `Infrastructure/Storage`, so `DocumentsController` and `DocumentService` stay independent from MinIO-specific APIs.

Document processing uses RabbitMQ plus `ai_jobs`:

```text
DocumentService
  -> create ai_job queued
  -> IMessagePublisher publishes { jobId } to RabbitMQ
  -> DocumentProcessingWorker consumes { jobId }
  -> IAiServiceClient calls Python AI service /process-document
  -> worker updates ai_jobs and documents status
```

`ai_jobs` is the source of truth for FE/admin status. RabbitMQ is only the delivery mechanism that wakes the worker quickly.

## Error Handling Convention

Use `ApiException` for expected application errors:

```csharp
throw new ApiException(
    StatusCodes.Status409Conflict,
    "folder.name_conflict",
    "A folder with the same name already exists in this location.");
```

`ApiExceptionMiddleware` converts these exceptions into the shared `ApiErrorDto` response. This keeps controllers focused on HTTP routing and services focused on business rules.

## Repository Convention

The project uses repositories with EF Core:

- `GenericRepository<T>` is for shared operations such as `GetById`, `Add`, `Update`, and `Delete`.
- Specific repositories are for business queries, filters, includes, pagination, soft-delete rules, and ownership checks.
- Repositories should not call `SaveChangesAsync`.
- Services should call `SaveChangesAsync` so one use case can commit multiple changes together.

Current repository layout:

```text
Application/Abstractions/Repositories/IRepository.cs
Application/Abstractions/Repositories/IDocumentRepository.cs
Application/Abstractions/Repositories/IFolderRepository.cs
Application/Abstractions/Repositories/IAiJobRepository.cs
Application/Abstractions/Repositories/IReportRepository.cs
Application/Abstractions/Repositories/IWorkspaceRepository.cs

Infrastructure/Persistence/Repositories/GenericRepository.cs
Infrastructure/Persistence/Repositories/DocumentRepository.cs
Infrastructure/Persistence/Repositories/FolderRepository.cs
Infrastructure/Persistence/Repositories/AiJobRepository.cs
Infrastructure/Persistence/Repositories/ReportRepository.cs
Infrastructure/Persistence/Repositories/WorkspaceRepository.cs
```

Do not force every query through `GenericRepository.GetAll()`. Put real business queries in specific repositories:

```text
IDocumentRepository.ListByWorkspaceAsync(...)
IFolderRepository.HasSiblingWithNameAsync(...)
IAiJobRepository.ListByStatusAsync(...)
```

## Backend To AI Service Boundary

Target clean boundary:

```text
Frontend
  -> Backend
    -> auth/permission checks
    -> create/update documents, ai_jobs, chat, reports
    -> call AI service internally
      -> extract/chunk/embed/retrieve/Gemini
    <- structured AI result
  -> Backend writes database state
```

AI service should not be called directly by frontend.

Current AI endpoints from the Python service:

| Endpoint | Backend responsibility |
|---|---|
| `POST /process-document` | Send document id, workspace id, folder id, MinIO bucket/object key, file type, and file name after upload. |
| `POST /rag/query` | Validate workspace permission, resolve `@file` / `@folder` mentions to document ids, save chat messages/sources, call AI service with question/history. |
| `POST /compare` | Create AI job/report request, pass document ids/names, and persist final job/report state. |
| `POST /generate-report` | Create AI job/report request, pass document ids/report type/custom prompt, and persist final report. |

## Team Ownership

| Owner | Main folders |
|---|---|
| Thinh | `Controllers/AuthController.cs`, `Controllers/WorkspacesController.cs`, `DTOs/Auth`, `DTOs/Workspaces`, `Application/Services/Auth`, `Application/Services/Workspaces`, `Infrastructure/Auth`. |
| Anh | `Controllers/FoldersController.cs`, `Controllers/DocumentsController.cs`, `Controllers/AiJobsController.cs`, `Controllers/ReportsController.cs`, matching DTOs/services, `Infrastructure/Storage`, `Infrastructure/BackgroundJobs`, `Infrastructure/Ai`. |
| Kiet | `ai-service/` primarily. Backend changes should be limited to agreed AI DTOs/contracts and AI client methods. |

## First Implementation Order For Anh

1. Add MinIO config and storage abstraction.
2. Add folder CRUD controller, DTOs, service, and repository calls.
3. Add document upload controller, DTOs, service, and MinIO implementation.
4. Save document metadata and create `ai_jobs` with `document_processing`.
5. Add backend AI service client for `/process-document`.
6. Add basic background worker or manual trigger for queued processing.
7. Add job status endpoints for frontend polling.

## Conflict Avoidance Rules

- One feature owner edits its own controller, DTO, service, and repository files.
- Shared files such as `Program.cs`, `InsightVaultDbContext.cs`, and migrations should be edited carefully and pulled before pushing.
- New database fields require an EF migration and a short note in docs.
- AI service request/response changes must be coordinated between Anh and Kiet before merge.
