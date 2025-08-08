import { Router, Request, Response } from 'express';
import Database from '../database/database';
import SlackService from '../services/slackService';

export const createAuthRoutes = (database: Database, slackService: SlackService): Router => {
  const router = Router();

  // Initiate OAuth flow
  router.get('/slack', (req: Request, res: Response) => {
    try {
      const state = Math.random().toString(36).substring(2, 15);
      const authUrl = slackService.getAuthorizationUrl(state);
      
      // Store state in session/cookie for CSRF protection in production
      res.redirect(authUrl);
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      res.status(500).json({ error: 'Failed to initiate OAuth flow' });
    }
  });

  // Handle OAuth callback
  router.get('/slack/callback', async (req: Request, res: Response) => {
    try {
      const { code, error: oauthError } = req.query;

      if (oauthError) {
        console.error('OAuth error:', oauthError);
        return res.redirect(`${process.env.CLIENT_URL}?error=oauth_denied`);
      }

      if (!code || typeof code !== 'string') {
        return res.redirect(`${process.env.CLIENT_URL}?error=invalid_code`);
      }

      // Exchange code for token
      const tokenResponse = await slackService.exchangeCodeForToken(code);
      
      // Calculate token expiration - only if expires_in is provided
      const expiresAt = tokenResponse.expires_in ? 
        Math.floor(Date.now() / 1000) + tokenResponse.expires_in : 
        null; // Long-lived token, no expiration

      // Check if user already exists
      const existingUser = await database.getUserByWorkspaceId(tokenResponse.team.id);
      
      if (existingUser) {
        // Update existing user's tokens
        await database.updateUser(existingUser._id!, {
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token || null,
          token_expires_at: expiresAt
        });
      } else {
        // Create new user
        await database.createUser({
          slack_workspace_id: tokenResponse.team.id,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token || null,
          token_expires_at: expiresAt
        });
      }

      // Redirect to frontend with success
      res.redirect(`${process.env.CLIENT_URL}?workspace_id=${tokenResponse.team.id}&team_name=${encodeURIComponent(tokenResponse.team.name)}`);
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      res.redirect(`${process.env.CLIENT_URL}?error=oauth_failed`);
    }
  });

  // Get current user info
  router.get('/me', async (req: Request, res: Response): Promise<void> => {
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
        res.status(404).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
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

      // Check if token is expired (only if expiration is set)
      const now = Math.floor(Date.now() / 1000);
      if (user.token_expires_at && user.token_expires_at <= now) {
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

      // Return user info without sensitive data
      res.json({
        id: user._id,
        workspace_id: user.slack_workspace_id,
        token_expires_at: user.token_expires_at,
        has_refresh_token: !!user.refresh_token
      });
    } catch (error) {
      console.error('Error getting user info:', error);
      res.status(500).json({ 
        error: 'Failed to get user info',
        code: 'SERVER_ERROR'
      });
    }
  });

  // Refresh token endpoint
  router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.headers['x-workspace-id'] as string;
      
      if (!workspaceId) {
        res.status(401).json({ error: 'Missing workspace ID' });
        return;
      }

      const user = await database.getUserByWorkspaceId(workspaceId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (!user.refresh_token) {
        res.status(400).json({ 
          error: 'No refresh token available - token rotation may not be enabled for this app' 
        });
        return;
      }

      // Refresh the token
      const refreshResult = await slackService.refreshAccessToken(user.refresh_token);
      const expiresAt = Math.floor(Date.now() / 1000) + refreshResult.expires_in;

      // Update user with new token
      await database.updateUser(user._id!, {
        access_token: refreshResult.access_token,
        token_expires_at: expiresAt
      });

      res.json({
        success: true,
        expires_at: expiresAt
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(500).json({ error: 'Failed to refresh token' });
    }
  });

  return router;
};