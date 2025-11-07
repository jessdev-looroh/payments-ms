import { RpcError } from '../interfaces';
import { mapStatusToCode } from './map-status-to-code.util';

export const validateListeningError = (exception: any): RpcError | null => {
  let status = 500;
  const success = false;
  const errorCasesMessages = [
    'No connection to NATS',
    'ECONNREFUSED',
    'Empty response. There are no subscribers',
  ];
  status = 503;
  const { context = '', message = '' } = exception.response;
  if (errorCasesMessages.some((msg) => message.includes(msg))) {
    return {
      status,
      message:
        'El microservicio requerido no está disponible o no hay conexión.',
      details: errorCasesMessages,
    };
  }

  if (
    exception?.name === 'TimeoutError' ||
    exception?.message?.includes('TimeoutError') ||
    exception?.toString?.().includes('Timeout')
  ) {
    return {
      status,
      message: 'El microservicio no respondió a tiempo.',
      details: exception.message || exception?.stack,
    };
  }

  return null;
};
