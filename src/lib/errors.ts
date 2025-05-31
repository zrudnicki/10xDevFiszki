/**
 * Custom Error Classes for AI Generation API
 * Provides structured error handling with proper HTTP status codes
 */

export class APIError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, statusCode: number, details?: Record<string, unknown>) {
    super(message);
    this.name = "APIError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, 422, details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = "Authentication required") {
    super("UNAUTHORIZED", message, 401);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends APIError {
  constructor(retryAfter: number) {
    super(
      "RATE_LIMIT_EXCEEDED",
      "Too many generation requests. Please wait before trying again.",
      429,
      {
        limit: 10,
        window: "1 minute",
        retry_after: retryAfter,
      }
    );
    this.name = "RateLimitError";
  }
}

export class CollectionNotFoundError extends APIError {
  constructor(message: string = "Collection not found or access denied") {
    super("COLLECTION_NOT_FOUND", message, 422);
    this.name = "CollectionNotFoundError";
  }
}

export class AIGenerationError extends APIError {
  constructor(message: string = "Failed to generate flashcards. Please try again.") {
    super("AI_GENERATION_FAILED", message, 500);
    this.name = "AIGenerationError";
  }
}

export class InvalidJSONError extends APIError {
  constructor(message: string = "Invalid JSON in request body") {
    super("INVALID_JSON", message, 400);
    this.name = "InvalidJSONError";
  }
}

export class InternalServerError extends APIError {
  constructor(message: string = "An unexpected error occurred") {
    super("INTERNAL_SERVER_ERROR", message, 500);
    this.name = "InternalServerError";
  }
}

// Categories API Errors
export class CategoryNotFoundError extends Error {
  public readonly code = 'CATEGORY_NOT_FOUND';
  public readonly statusCode = 404;

  constructor(message: string = 'Category not found or access denied') {
    super(message);
    this.name = 'CategoryNotFoundError';
  }
}

export class CategoryNameExistsError extends Error {
  public readonly code = 'CATEGORY_NAME_EXISTS';
  public readonly statusCode = 409;
  public readonly details: Record<string, unknown>;

  constructor(message: string = 'A category with this name already exists') {
    super(message);
    this.name = 'CategoryNameExistsError';
    this.details = { field: 'name' };
  }
}

export class CategoryValidationError extends ValidationError {
  constructor(message: string, details: Record<string, unknown>) {
    super(message, details);
    this.name = 'CategoryValidationError';
  }
}

export class UnauthorizedCategoryAccessError extends AuthenticationError {
  public readonly code = 'UNAUTHORIZED_CATEGORY_ACCESS';

  constructor(message: string = 'Access denied to category resource') {
    super(message);
    this.name = 'UnauthorizedCategoryAccessError';
  }
}

/**
 * Error response helper function
 * Creates standardized HTTP error response
 */
export function createErrorResponse(error: APIError): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add Retry-After header for rate limit errors
  if (error instanceof RateLimitError && error.details?.retry_after) {
    headers["Retry-After"] = error.details.retry_after.toString();
  }

  return new Response(JSON.stringify(error.toJSON()), {
    status: error.statusCode,
    headers,
  });
}

/**
 * Generic error handler for API routes
 * Converts unknown errors to structured APIError instances
 */
export function handleAPIError(error: unknown): APIError {
  if (error instanceof APIError) {
    return error;
  }

  if (error instanceof Error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected API error:", error);
    return new InternalServerError();
  }

  // eslint-disable-next-line no-console
  console.error("Unknown error type:", error);
  return new InternalServerError();
}
