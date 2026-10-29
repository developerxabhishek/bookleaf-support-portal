/**
 * An error that maps directly to an HTTP response; anything else becomes a 500.
 *
 * Error codes used across the API:
 * VALIDATION_ERROR, INVALID_JSON, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, CONFLICT,
 * PAYLOAD_TOO_LARGE, UNSUPPORTED_FILE, RATE_LIMITED, AI_UNAVAILABLE, UPLOADS_UNAVAILABLE, INTERNAL_ERROR
 */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthenticated(message = 'Please log in to continue.') {
    return new ApiError(401, 'UNAUTHENTICATED', message);
  }

  static forbidden(message = 'You do not have access to this resource.') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found.') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message) {
    return new ApiError(409, 'CONFLICT', message);
  }
}
