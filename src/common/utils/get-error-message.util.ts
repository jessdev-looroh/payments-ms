import { HttpStatus } from '@nestjs/common';

export const getErrorMessage = (response: any) => {
  const { statusCode, message } = response;
  const isTokenExpired = message === 'Unauthorized';
  switch (statusCode) {
    case HttpStatus.UNAUTHORIZED:
      return {
        message: isTokenExpired
          ? 'Access denied. Authentication is required to access this resource.'
          : message,
        details: [
          isTokenExpired
            ? 'The provided token is missing, invalid, or has expired.'
            : message,
        ],
      };

    case HttpStatus.FORBIDDEN:
      return {
        message:
          'Access forbidden. You do not have permission to perform this action.',
        details: ['Your current role does not grant access to this resource.'],
      };
    default:
      return null;
  }
};
