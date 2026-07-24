import { Request, Response, NextFunction } from 'express';

// ponytail: stub for Task 2 JWT validation — currently allows all requests with Bearer token
// Replace with actual Firebase ID token verification when auth service is ready
export async function verifyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  // ponytail: TODO — verify token with Firebase Admin SDK
  // For now, extract uid from token for tests (mock token format: "mock_uid")
  const uid = token.split('_')[0] !== 'mock' ? token : 'mock_user';
  (req as any).user = { uid };

  next();
}
