using InsightVault.API.DTOs.Common;

namespace InsightVault.API.Common.Errors;

public sealed class ApiExceptionMiddleware(
    RequestDelegate next,
    ILogger<ApiExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ApiException exception)
        {
            await WriteErrorAsync(
                context,
                exception.StatusCode,
                exception.ErrorCode,
                exception.Message,
                exception.Details);
        }
        catch (ArgumentException exception)
        {
            await WriteErrorAsync(
                context,
                StatusCodes.Status400BadRequest,
                "request.invalid",
                exception.Message);
        }
        catch (KeyNotFoundException exception)
        {
            await WriteErrorAsync(
                context,
                StatusCodes.Status404NotFound,
                "resource.not_found",
                exception.Message);
        }
        catch (InvalidOperationException exception)
        {
            await WriteErrorAsync(
                context,
                StatusCodes.Status409Conflict,
                "request.conflict",
                exception.Message);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled API exception");

            await WriteErrorAsync(
                context,
                StatusCodes.Status500InternalServerError,
                "server.error",
                "An unexpected server error occurred.");
        }
    }

    private static async Task WriteErrorAsync(
        HttpContext context,
        int statusCode,
        string errorCode,
        string message,
        object? details = null)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        await context.Response.WriteAsJsonAsync(new ApiErrorDto(errorCode, message, details));
    }
}
