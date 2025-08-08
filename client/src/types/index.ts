export interface User {
  id: number;
  workspace_id: string;
  token_expires_at: number;
}

export interface SlackChannel {
  id: string;
  name: string;
}

export interface ScheduledMessage {
  id: number;
  channel: string;
  message: string;
  sendTimestamp: number;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  createdAt: number;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface AuthState {
  isAuthenticated: boolean;
  workspaceId: string | null;
  teamName: string | null;
  user: User | null;
}

export interface AppContextType {
  auth: AuthState;
  setAuth: (auth: AuthState) => void;
  logout: () => void;
  restoreAuth: () => Promise<AuthState>;
  verifyAuth: (workspaceId: string) => Promise<boolean>;
  getStoredAuth: () => Partial<AuthState> | null;
}