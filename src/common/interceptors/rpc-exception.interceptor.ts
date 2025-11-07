import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { catchError, Observable, throwError } from 'rxjs';
import { formatError } from '../utils';

@Injectable()
export class RpcExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        console.log('[Orders-MS-RpcExceptionInterceptor]');
        console.log({ err });
        if (err instanceof RpcException) return throwError(() => err);
        const rpcError = formatError(err);
        throw new RpcException(rpcError);
      }),
    );
  }
}
