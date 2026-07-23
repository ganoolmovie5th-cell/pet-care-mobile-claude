import axios, { AxiosError } from 'axios';

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  FIREBASE = 'FIREBASE',
  TIMEOUT = 'TIMEOUT',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  originalError: any;
  shouldRetry: boolean;
  statusCode?: number;
}

const userMessageMap: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'Koneksi internet terputus. Periksa jaringan Anda.',
  [ErrorType.AUTH]: 'Sesi Anda telah berakhir. Silakan login kembali.',
  [ErrorType.FIREBASE]: 'Gagal mengakses data. Coba lagi nanti.',
  [ErrorType.TIMEOUT]: 'Permintaan timeout. Coba lagi dengan koneksi lebih stabil.',
  [ErrorType.VALIDATION]: 'Data tidak valid. Periksa input Anda.',
  [ErrorType.SERVER]: 'Terjadi kesalahan server. Tim kami sedang menangani ini.',
  [ErrorType.UNKNOWN]: 'Terjadi kesalahan tidak terduga. Coba lagi nanti.',
};

export function handleError(error: any): AppError {
  if (axios.isAxiosError(error)) {
    return handleAxiosError(error);
  }

  if (error?.code === 'auth/invalid-api-key' || error?.code === 'auth/user-disabled') {
    return {
      type: ErrorType.AUTH,
      message: error.message,
      userMessage: userMessageMap[ErrorType.AUTH],
      originalError: error,
      shouldRetry: false,
      statusCode: 401,
    };
  }

  if (error?.code?.startsWith('auth/')) {
    return {
      type: ErrorType.AUTH,
      message: error.message,
      userMessage: userMessageMap[ErrorType.AUTH],
      originalError: error,
      shouldRetry: false,
    };
  }

  if (error?.code?.startsWith('firestore/') || error?.code === 'permission-denied') {
    return {
      type: ErrorType.FIREBASE,
      message: error.message,
      userMessage: userMessageMap[ErrorType.FIREBASE],
      originalError: error,
      shouldRetry: true,
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: error?.message || 'Unknown error',
    userMessage: userMessageMap[ErrorType.UNKNOWN],
    originalError: error,
    shouldRetry: true,
  };
}

function handleAxiosError(error: AxiosError): AppError {
  const status = error.response?.status;

  if (!error.response) {
    return {
      type: ErrorType.NETWORK,
      message: 'Network request failed',
      userMessage: userMessageMap[ErrorType.NETWORK],
      originalError: error,
      shouldRetry: true,
    };
  }

  if (error.code === 'ECONNABORTED') {
    return {
      type: ErrorType.TIMEOUT,
      message: 'Request timeout',
      userMessage: userMessageMap[ErrorType.TIMEOUT],
      originalError: error,
      shouldRetry: true,
      statusCode: status,
    };
  }

  if (status === 401 || status === 403) {
    return {
      type: ErrorType.AUTH,
      message: 'Unauthorized',
      userMessage: userMessageMap[ErrorType.AUTH],
      originalError: error,
      shouldRetry: false,
      statusCode: status,
    };
  }

  if (status === 400) {
    return {
      type: ErrorType.VALIDATION,
      message: (error.response.data as any)?.error || 'Validation error',
      userMessage: userMessageMap[ErrorType.VALIDATION],
      originalError: error,
      shouldRetry: false,
      statusCode: status,
    };
  }

  if (status && status >= 500) {
    return {
      type: ErrorType.SERVER,
      message: `Server error: ${status}`,
      userMessage: userMessageMap[ErrorType.SERVER],
      originalError: error,
      shouldRetry: true,
      statusCode: status,
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: error.message,
    userMessage: userMessageMap[ErrorType.UNKNOWN],
    originalError: error,
    shouldRetry: true,
    statusCode: status,
  };
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const appError = handleError(error);

      if (!appError.shouldRetry || attempt === maxRetries) {
        throw appError;
      }

      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }

  throw lastError;
}
