import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { catchError, Observable, throwError } from 'rxjs';
import { AppError } from './';

@Injectable()
export class RpcExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        // Si ya es RpcException, la dejamos pasar
        if (err instanceof RpcException) return throwError(() => err);
        const appError: AppError = this.formatError(err, context);
        // Devolvemos un RpcException con formato uniforme
        return throwError(() => new RpcException(appError));
      }),
    );
  }
  private formatError(exception: any, context: ExecutionContext): AppError {
    const timestamp = new Date().toISOString();

    // Si es una excepción HTTP (Nest estándar)
    if (exception instanceof HttpException) {
      const response = exception.getResponse?.();
      let details: Record<string, any> | string[] | undefined;

      if (typeof response === 'object' && response !== null) {
        // Extrae los "message" de class-validator si existen
        details = (response as any).message || response;
      }

      return {
        statusCode: exception.getStatus(),
        code: this.mapStatusToCode(exception),
        message:
          (response as any)?.message || exception.message || 'Error inesperado',
        details,
        context: context.getClass().name,
        timestamp,
      };
    }

    // Cualquier otro tipo de error (por ejemplo, error del sistema)
    return {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: exception?.message || 'Error interno del servidor',
      details: exception?.stack,
      context: context.getClass().name,
      timestamp,
    };
  }

  private mapStatusToCode(exception: HttpException): string {
    const status = exception.getStatus();
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
