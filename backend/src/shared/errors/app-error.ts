export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Solicitud incorrecta', code = 'BAD_REQUEST', details?: unknown) {
    super(message, 400, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado', code = 'UNAUTHORIZED', details?: unknown) {
    super(message, 401, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado', code = 'FORBIDDEN', details?: unknown) {
    super(message, 403, code, details);
  }
}

export class LimitReachedError extends AppError {
  constructor(message = 'Has alcanzado el límite de mensajes para usuarios anónimos. Registrate para continuar.', details?: unknown) {
    super(message, 403, 'LIMIT_REACHED', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado', code = 'NOT_FOUND', details?: unknown) {
    super(message, 404, code, details);
  }
}
