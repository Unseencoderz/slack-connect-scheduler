import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AuthState, AppContextType } from '../types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

interface AppContextProviderProps {
  children: ReactNode;
}

// Auth storage keys
const AUTH_STORAGE_KEYS = {
  WORKSPACE_ID: 'slack_workspace_id',
  TEAM_NAME: 'slack_team_name',
  AUTH_TIMESTAMP: 'slack_auth_timestamp',
  USER_DATA: 'slack_user_data'
} as const;

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const [auth, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    workspaceId: null,
    teamName: null,
    user: null
  });

  // Enhanced setAuth with better persistence
  const setAuth = useCallback((newAuth: AuthState) => {
    setAuthState(newAuth);
    
    if (newAuth.isAuthenticated && newAuth.workspaceId && newAuth.teamName) {
      // Store authentication data with timestamp
      localStorage.setItem(AUTH_STORAGE_KEYS.WORKSPACE_ID, newAuth.workspaceId);
      localStorage.setItem(AUTH_STORAGE_KEYS.TEAM_NAME, newAuth.teamName);
      localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_TIMESTAMP, Date.now().toString());
      
      // Store user data if available
      if (newAuth.user) {
        localStorage.setItem(AUTH_STORAGE_KEYS.USER_DATA, JSON.stringify(newAuth.user));
      }
    } else {
      clearAuthStorage();
    }
  }, []);

  // Clear all authentication storage
  const clearAuthStorage = useCallback(() => {
    Object.values(AUTH_STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, []);

  // Get stored authentication data
  const getStoredAuth = useCallback((): Partial<AuthState> | null => {
    try {
      const workspaceId = localStorage.getItem(AUTH_STORAGE_KEYS.WORKSPACE_ID);
      const teamName = localStorage.getItem(AUTH_STORAGE_KEYS.TEAM_NAME);
      const timestamp = localStorage.getItem(AUTH_STORAGE_KEYS.AUTH_TIMESTAMP);
      const userData = localStorage.getItem(AUTH_STORAGE_KEYS.USER_DATA);

      if (!workspaceId || !teamName) {
        return null;
      }

      // Check if auth data is too old (older than 30 days)
      if (timestamp) {
        const authAge = Date.now() - parseInt(timestamp);
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        if (authAge > maxAge) {
          clearAuthStorage();
          return null;
        }
      }

      let user = null;
      if (userData) {
        try {
          user = JSON.parse(userData);
        } catch (error) {
          console.warn('Failed to parse stored user data:', error);
        }
      }

      return {
        isAuthenticated: true,
        workspaceId,
        teamName,
        user,
        timestamp // Include timestamp for fallback logic
      };
    } catch (error) {
      console.error('Error retrieving stored auth data:', error);
      clearAuthStorage();
      return null;
    }
  }, [clearAuthStorage]);

  // Verify authentication with server with retry logic
  const verifyAuth = useCallback(async (workspaceId: string, maxRetries: number = 3): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch('/auth/me', {
          headers: {
            'x-workspace-id': workspaceId
          }
        });

        if (response.ok) {
          await response.json(); // Validate response but don't need the user data here
          return true; // Auth is valid
        } else if (response.status === 401) {
          // Token expired or invalid - don't retry
          return false;
        } else {
          // Server error - retry
          if (attempt === maxRetries) {
            console.error(`Failed to verify auth after ${maxRetries} attempts`);
            return false;
          }
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } catch (error) {
        console.error(`Auth verification attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          return false;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    return false;
  }, []);

  // Check if stored auth data is recent enough to trust without server verification
  const isStoredAuthRecent = useCallback((timestamp: string | null): boolean => {
    if (!timestamp) return false;
    
    const authAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    return authAge < maxAge;
  }, []);

  // Restore authentication from storage
  const restoreAuth = useCallback(async (): Promise<AuthState> => {
    try {
      const storedAuth = getStoredAuth();
      
      if (!storedAuth || !storedAuth.workspaceId) {
        console.log('No stored authentication data found');
        return {
          isAuthenticated: false,
          workspaceId: null,
          teamName: null,
          user: null
        };
      }

      console.log('Found stored auth data, verifying with server...');

      // Verify stored auth with server
      const isValid = await verifyAuth(storedAuth.workspaceId);
      
      if (isValid) {
        console.log('Server verification successful, fetching fresh user data...');
        
        // Fetch fresh user data
        try {
          const response = await fetch('/auth/me', {
            headers: {
              'x-workspace-id': storedAuth.workspaceId
            }
          });
          
          if (response.ok) {
            const user = await response.json();
            const restoredAuth: AuthState = {
              isAuthenticated: true,
              workspaceId: storedAuth.workspaceId,
              teamName: storedAuth.teamName || '',
              user
            };
            
            console.log('Successfully restored authentication with fresh user data');
            // Update storage with fresh data
            setAuth(restoredAuth);
            return restoredAuth;
          } else {
            console.warn('Failed to fetch fresh user data, using stored data');
            // Return stored auth even if we couldn't fetch fresh user data
            return storedAuth as AuthState;
          }
        } catch (error) {
          console.warn('Error fetching fresh user data, using stored data:', error);
          // Return stored auth even if we couldn't fetch fresh user data
          return storedAuth as AuthState;
        }
      } else {
        // Server verification failed, check if we can use stored data as fallback
        const timestamp = localStorage.getItem(AUTH_STORAGE_KEYS.AUTH_TIMESTAMP);
        if (isStoredAuthRecent(timestamp)) {
          console.log('Server verification failed but stored data is recent, using fallback authentication');
          return storedAuth as AuthState;
        } else {
          console.log('Server verification failed and stored data is too old, clearing invalid auth');
          // Clear invalid auth
          clearAuthStorage();
          return {
            isAuthenticated: false,
            workspaceId: null,
            teamName: null,
            user: null
          };
        }
      }
    } catch (error) {
      console.error('Error in restoreAuth:', error);
      // In case of any error, clear auth and return unauthenticated state
      clearAuthStorage();
      return {
        isAuthenticated: false,
        workspaceId: null,
        teamName: null,
        user: null
      };
    }
  }, [getStoredAuth, verifyAuth, clearAuthStorage, setAuth]);

  // Enhanced logout with complete cleanup
  const logout = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      workspaceId: null,
      teamName: null,
      user: null
    });
    clearAuthStorage();
  }, [clearAuthStorage]);

  // Debug utility to check authentication state
  const debugAuthState = useCallback(() => {
    const storedAuth = getStoredAuth();
    console.log('=== Authentication Debug Info ===');
    console.log('Current auth state:', auth);
    console.log('Stored auth data:', storedAuth);
    console.log('LocalStorage keys:');
    Object.values(AUTH_STORAGE_KEYS).forEach(key => {
      console.log(`  ${key}:`, localStorage.getItem(key));
    });
    console.log('===============================');
  }, [auth, getStoredAuth]);

  const value: AppContextType = {
    auth,
    setAuth,
    logout,
    restoreAuth,
    verifyAuth: (workspaceId: string) => verifyAuth(workspaceId),
    getStoredAuth,
    debugAuthState
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};