import { ERROR_CODES, type ErrorCode } from "../constants/error-codes.js";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized", cause?: unknown) {
    super(message, ERROR_CODES.AUTH_ERROR, 401, cause);
  }
}

export class TierLimitError extends AppError {
  constructor(limit: string, cause?: unknown) {
    super(`Tier limit exceeded: ${limit}`, ERROR_CODES.TIER_LIMIT, 402, cause);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, cause?: unknown) {
    super(`Not found: ${resource}`, ERROR_CODES.NOT_FOUND, 404, cause);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 400, cause);
  }
}

export class RetrievalError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, ERROR_CODES.RETRIEVAL_ERROR, 502, cause);
  }
}

export class IngestionError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, ERROR_CODES.INGESTION_ERROR, 500, cause);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests", cause?: unknown) {
    super(message, ERROR_CODES.RATE_LIMITED, 429, cause);
  }
}

export class InternalError extends AppError {
  constructor(message = "Internal server error", cause?: unknown) {
    super(message, ERROR_CODES.INTERNAL_ERROR, 500, cause);
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
