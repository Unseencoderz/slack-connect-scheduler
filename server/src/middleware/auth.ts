import { Request, Response, NextFunction } from 'express';
import Database, { User } from '../database/database';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authMiddleware = (database: Database) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workspaceId = req.headers['x-workspace-id'] as string;
      
      if (!workspaceId) {
        res.status(401).json({ 
          error: 'Missing workspace ID',
          code: 'MISSING_WORKSPACE_ID'
        });
        return;
      }

      const user = await database.getUserByWorkspaceId(workspaceId);
      if (!user) {
        res.status(401).json({ 
          error: 'Invalid workspace ID',
          code: 'INVALID_WORKSPACE_ID'
        });
        return;
      }

      // Check if token is expired (only if expiration is set)
      const now = Math.floor(Date.now() / 1000);
      if (user.token_expires_at && user.token_expires_at <= now) {
        // Check if refresh token is available
        if (user.refresh_token) {
          res.status(401).json({ 
            error: 'Token expired', 
            code: 'TOKEN_EXPIRED',
            needsRefresh: true 
          });
        } else {
          res.status(401).json({ 
            error: 'Token expired and no refresh token available', 
            code: 'TOKEN_EXPIRED_NO_REFRESH',
            needsReauth: true 
          });
        }
        return;
      }

      // Check if access token exists
      if (!user.access_token) {
        res.status(401).json({ 
          error: 'No access token found',
          code: 'NO_ACCESS_TOKEN',
          needsReauth: true
        });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ 
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  };
};