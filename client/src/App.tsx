import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppContextProvider, useAppContext } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import Navbar from './components/Navbar';
import { Loader, Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { auth, setAuth, restoreAuth } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Handle OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const workspaceId = urlParams.get('workspace_id');
    const teamName = urlParams.get('team_name');
    const error = urlParams.get('error');

    const handleAuthFlow = async () => {
      try {
        if (error) {
          console.error('OAuth error:', error);
          setAuthError(`Authentication failed: ${error}`);
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          setLoading(false);
          return;
        }

        if (workspaceId && teamName) {
          console.log('OAuth callback detected, processing authentication...');
          // OAuth success - handle new authentication
          try {
            // Try to fetch user info to verify the authentication
            const response = await fetch('/auth/me', {
              headers: {
                'x-workspace-id': workspaceId
              }
            });
            
            if (response.ok) {
              const user = await response.json();
              const newAuth = {
                isAuthenticated: true,
                workspaceId,
                teamName: decodeURIComponent(teamName),
                user
              };
              setAuth(newAuth);
              console.log('OAuth authentication successful with user data');
            } else {
              console.warn('OAuth successful but failed to fetch user info, proceeding with basic auth');
              // If user info fetch fails, still set basic auth state
              const newAuth = {
                isAuthenticated: true,
                workspaceId,
                teamName: decodeURIComponent(teamName),
                user: null
              };
              setAuth(newAuth);
            }
          } catch (error) {
            console.error('Failed to complete OAuth authentication:', error);
            // Still set auth state with basic info to allow user to proceed
            const newAuth = {
              isAuthenticated: true,
              workspaceId,
              teamName: decodeURIComponent(teamName),
              user: null
            };
            setAuth(newAuth);
          }
          
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          // No OAuth parameters, try to restore existing authentication
          console.log('No OAuth parameters, attempting to restore authentication from storage...');
          const restoredAuth = await restoreAuth();
          
          if (restoredAuth.isAuthenticated) {
            console.log('Authentication restored successfully from storage');
            setAuth(restoredAuth);
          } else {
            console.log('No valid authentication found in storage');
          }
        }
      } catch (error) {
        console.error('Auth flow error:', error);
        setAuthError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    handleAuthFlow();
  }, [setAuth, restoreAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="w-16 h-16 bg-white dark:bg-dark-800 rounded-2xl shadow-colored flex items-center justify-center mx-auto">
              <Loader className="w-8 h-8 animate-spin text-primary-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Initializing Slack Connect
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Setting up your workspace connection...
          </p>
          {authError && (
            <div className="notification-error max-w-md mx-auto">
              <div className="text-error-600">⚠️</div>
              <div>
                <p className="font-medium">Connection Error</p>
                <p className="text-sm opacity-90">{authError}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen">
        {auth.isAuthenticated && <Navbar />}
        <Routes>
          <Route 
            path="/" 
            element={
              auth.isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <LoginPage />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              auth.isAuthenticated ? 
                <DashboardPage /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContextProvider>
        <AppContent />
      </AppContextProvider>
    </ThemeProvider>
  );
};

export default App;