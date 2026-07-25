import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || '';

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured, skipping init');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV || 'development',
    attachStacktrace: true,
    maxBreadcrumbs: 50,
  });
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    contexts: { custom: context || {} },
  });
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

export const setUser = (userId: string, email?: string, phone?: string) => {
  Sentry.setUser({
    id: userId,
    email,
    phone,
  });
};

export const clearUser = () => {
  Sentry.setUser(null);
};

export const addBreadcrumb = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.addBreadcrumb({
    message,
    level,
    timestamp: Date.now() / 1000,
  });
};
