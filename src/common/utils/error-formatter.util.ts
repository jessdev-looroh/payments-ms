import { HttpException } from '@nestjs/common';
import { getErrorMessage } from './get-error-message.util';
import { RpcError } from '../interfaces';
import { validateListeningError } from './validate-listening-error';

export const formatError = (exception: any): RpcError => {
  if (exception instanceof HttpException) {
    const listeningError = validateListeningError(exception);

    if (listeningError) return listeningError;
    const response = exception.getResponse?.();
    const errorMessage = getErrorMessage(response);
    return {
      status: exception.getStatus(),
      message: errorMessage?.message || exception.message || 'Error inesperado',
      details:
        (response as any).message ||
        errorMessage?.details ||
        response ||
        'Error inesperado',
    };
  }

  return {
    status: 500,
    message: exception?.message || 'Error interno del servidor',
    details: exception?.stack || ['Error interno del servidor'],
  };
};
