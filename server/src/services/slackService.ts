import { WebClient } from '@slack/web-api';
import axios from 'axios';

export interface SlackOAuthTokenResponse {
  access_token: string;
  refresh_token?: string; // Make optional since it's only present with token rotation
  expires_in?: number; // Also optional as it's only present with token rotation
  team: {
    id: string;
    name: string;
  };
}

export interface SlackChannel {
  id: string;
  name: string;
}

class SlackService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.SLACK_CLIENT_ID!;
    this.clientSecret = process.env.SLACK_CLIENT_SECRET!;
    this.redirectUri = process.env.SLACK_REDIRECT_URI!;

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Missing required Slack OAuth environment variables');
    }
  }

  getAuthorizationUrl(state?: string): string {
    const scopes = [
      'channels:read',
      'chat:write',
      'groups:read',
      'im:read',
      'mpim:read'
    ].join(',');

    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      ...(state && { state })
    });

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<SlackOAuthTokenResponse> {
    try {
      const response = await axios.post('https://slack.com/api/oauth.v2.access', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.data.ok) {
        throw new Error(`Slack OAuth error: ${response.data.error}`);
      }

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || null, // Handle undefined/null case
        expires_in: response.data.expires_in || null, // Handle case where token doesn't expire
        team: {
          id: response.data.team.id,
          name: response.data.team.name
        }
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  async refreshAccessToken(refreshToken: string | null): Promise<{ access_token: string; expires_in: number }> {
    if (!refreshToken) {
      throw new Error('No refresh token available - token rotation may not be enabled for this app');
    }
    
    try {
      const response = await axios.post('https://slack.com/api/oauth.v2.access', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.data.ok) {
        throw new Error(`Slack token refresh error: ${response.data.error}`);
      }

      return {
        access_token: response.data.access_token,
        expires_in: response.data.expires_in || 43200
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  async getChannels(accessToken: string): Promise<SlackChannel[]> {
    const client = new WebClient(accessToken);
    
    try {
      const [publicChannels, privateChannels, directMessages] = await Promise.all([
        client.conversations.list({ types: 'public_channel' }),
        client.conversations.list({ types: 'private_channel' }),
        client.conversations.list({ types: 'im,mpim' })
      ]);

      const channels: SlackChannel[] = [];

      // Add public channels
      if (publicChannels.channels) {
        publicChannels.channels.forEach(channel => {
          if (channel.id && channel.name) {
            channels.push({
              id: channel.id,
              name: `#${channel.name}`
            });
          }
        });
      }

      // Add private channels
      if (privateChannels.channels) {
        privateChannels.channels.forEach(channel => {
          if (channel.id && channel.name) {
            channels.push({
              id: channel.id,
              name: `#${channel.name} (private)`
            });
          }
        });
      }

      // Add direct messages
      if (directMessages.channels) {
        directMessages.channels.forEach(channel => {
          if (channel.id) {
            channels.push({
              id: channel.id,
              name: 'Direct Message'
            });
          }
        });
      }

      return channels.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw new Error('Failed to fetch channels');
    }
  }

  async sendMessage(accessToken: string, channel: string, message: string): Promise<void> {
    const client = new WebClient(accessToken);
    
    try {
      const result = await client.chat.postMessage({
        channel,
        text: message
      });

      if (!result.ok) {
        throw new Error(`Slack API error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message to Slack');
    }
  }

  async testToken(accessToken: string): Promise<boolean> {
    const client = new WebClient(accessToken);
    
    try {
      const result = await client.auth.test();
      return result.ok === true;
    } catch (error) {
      console.error('Token test failed:', error);
      return false;
    }
  }
}

export default SlackService;