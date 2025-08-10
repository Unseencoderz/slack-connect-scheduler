import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { SlackChannel, ScheduledMessage, User } from '../types';

// Auth storage keys - keep in sync with AppContext
const AUTH_STORAGE_KEYS = {
  WORKSPACE_ID: 'slack_workspace_id',
  TEAM_NAME: 'slack_team_name',
  AUTH_TIMESTAMP: 'slack_auth_timestamp',
  USER_DATA: 'slack_user_data'
} as const;

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: 'https://slack-connect-scheduler.onrender.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor to include workspace ID
    this.api.interceptors.request.use((config) => {
      const workspaceId = localStorage.getItem(AUTH_STORAGE_KEYS.WORKSPACE_ID);
      if (workspaceId) {
        config.headers['x-workspace-id'] = workspaceId;
      }
      return config;
    });

    // Enhanced response interceptor with token refresh and retry logic
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle token expiration with refresh attempt
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.api(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const workspaceId = localStorage.getItem(AUTH_STORAGE_KEYS.WORKSPACE_ID);
            if (!workspaceId) {
              throw new Error('No workspace ID found');
            }

            // Attempt to refresh token
            const response = await this.api.post('/auth/refresh', {}, {
              headers: { 'x-workspace-id': workspaceId }
            });

            if (response.status === 200) {
              // Token refreshed successfully, retry the original request
              this.processQueue(null);
              return this.api(originalRequest);
            } else {
              throw new Error('Token refresh failed');
            }
          } catch (refreshError) {
            // Token refresh failed, clear auth and redirect
            console.error('Token refresh failed:', refreshError);
            this.processQueue(refreshError);
            this.clearAuthAndRedirect();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle network errors with retry logic
        if (this.isNetworkError(error) && !originalRequest._networkRetry) {
          originalRequest._networkRetry = true;

          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));

          try {
            return await this.api(originalRequest);
          } catch (retryError) {
            console.error('Network retry failed:', retryError);
            return Promise.reject(retryError);
          }
        }

        // For any other 401 errors or auth failures, clear auth
        if (error.response?.status === 401) {
          this.clearAuthAndRedirect();
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(null);
      }
    });

    this.failedQueue = [];
  }

  private isNetworkError(error: AxiosError): boolean {
    return !error.response && (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNABORTED' ||
      error.message.includes('Network Error') ||
      error.message.includes('timeout')
    );
  }

  private clearAuthAndRedirect(): void {
    // Clear authentication storage
    const authKeys = [
      AUTH_STORAGE_KEYS.WORKSPACE_ID,
      AUTH_STORAGE_KEYS.TEAM_NAME,
      AUTH_STORAGE_KEYS.AUTH_TIMESTAMP,
      AUTH_STORAGE_KEYS.USER_DATA
    ];
    authKeys.forEach(key => localStorage.removeItem(key));

    // Redirect to login if not already there
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  }

  // Auth endpoints with enhanced error handling
  async getCurrentUser(): Promise<User> {
    try {
      const response: AxiosResponse<User> = await this.api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  async refreshToken(): Promise<void> {
    try {
      await this.api.post('/auth/refresh');
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  }

  // Message endpoints with improved error handling
  async getChannels(): Promise<SlackChannel[]> {
    try {
      const response: AxiosResponse<{ channels: SlackChannel[] }> = await this.api.get('/messages/channels');
      return response.data.channels;
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      throw error;
    }
  }

  async sendMessage(channel: string, message: string): Promise<void> {
    try {
      await this.api.post('/messages/send', { channel, message });
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async scheduleMessage(channel: string, message: string, sendTimestamp: number): Promise<number> {
    try {
      const response: AxiosResponse<{ messageId: number }> = await this.api.post('/messages/schedule', {
        channel,
        message,
        sendTimestamp
      });
      return response.data.messageId;
    } catch (error) {
      console.error('Failed to schedule message:', error);
      throw error;
    }
  }

  async getScheduledMessages(): Promise<ScheduledMessage[]> {
    try {
      const response: AxiosResponse<{ messages: ScheduledMessage[] }> = await this.api.get('/messages/scheduled');
      return response.data.messages;
    } catch (error) {
      console.error('Failed to fetch scheduled messages:', error);
      throw error;
    }
  }

  async cancelScheduledMessage(messageId: number): Promise<void> {
    try {
      await this.api.delete(`/messages/scheduled/${messageId}`);
    } catch (error) {
      console.error('Failed to cancel scheduled message:', error);
      throw error;
    }
  }

  // Utility method for handling API errors
  getErrorMessage(error: any): string {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }

  // Test connection method for authentication verification
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get('/auth/me');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default new ApiService();
