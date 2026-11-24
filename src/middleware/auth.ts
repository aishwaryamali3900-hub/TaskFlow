import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/users.ts';
import type { UserRecord } from '../db/schema.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: UserRecord;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Authentication token is missing.' });
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const email = decodedToken.email ?? `${decodedToken.uid}@taskflow.local`;
    const name =
      typeof decodedToken.name === 'string' ? decodedToken.name : undefined;

    const dbUser = await getOrCreateUser(decodedToken.uid, email, name);
    req.user = decodedToken;
    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Authentication verification error:', error);
    res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }
};
