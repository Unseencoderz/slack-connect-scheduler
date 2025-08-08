import React, { useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Slack, MessageSquare, Calendar, Shield, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import apiService from '../services/api';

const LoginPage: React.FC = () => {
  const { setAuth } = useAppContext();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Handle OAuth callback
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const workspaceId = urlParams.get('workspace_id');
      const teamName = urlParams.get('team_name');
      const error = urlParams.get('error');

      if (error) {
        setError(getErrorMessage(error));
        setIsConnecting(false);
        return;
      }

      if (workspaceId && teamName) {
        try {
          const user = await apiService.getCurrentUser();
          setAuth({
            isAuthenticated: true,
            workspaceId,
            teamName: decodeURIComponent(teamName),
            user
          });
        } catch (err) {
          console.error('Failed to authenticate user:', err);
          setError('Failed to complete authentication. Please try again.');
          setIsConnecting(false);
        }
      }
    };

    handleOAuthCallback();
  }, [setAuth]);

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'oauth_denied':
        return 'Slack authorization was denied. Please try again.';
      case 'invalid_code':
        return 'Invalid authorization code. Please try again.';
      case 'oauth_failed':
        return 'OAuth process failed. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleConnectSlack = () => {
    setIsConnecting(true);
    setError('');
    // Redirect to OAuth endpoint
    window.location.href = '/auth/slack';
  };

  const features = [
    {
      icon: MessageSquare,
      title: 'Instant Messaging',
      description: 'Send messages to any channel instantly with one click',
      color: 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Schedule messages for perfect timing across time zones',
      color: 'bg-secondary-100 dark:bg-secondary-900/20 text-secondary-600 dark:text-secondary-400'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade security with OAuth 2.0 and token encryption',
      color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
    }
  ];

  const benefits = [
    'No data stored on our servers',
    'Automatic token refresh',
    'Easy workspace disconnection',
    'Full message history access'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200 to-primary-300 dark:from-primary-800 dark:to-primary-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-secondary-200 to-secondary-300 dark:from-secondary-800 dark:to-secondary-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-75"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-yellow-200 to-yellow-300 dark:from-yellow-800 dark:to-yellow-900 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse delay-150"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="max-w-7xl w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Left side - Hero content */}
            <div className="text-center lg:text-left animate-fade-in">
              <div className="inline-flex items-center px-4 py-2 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-full shadow-soft dark:shadow-soft-dark border border-neutral-200/50 dark:border-dark-600/50 mb-8">
                <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2" />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Trusted by 10,000+ teams worldwide</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-6 leading-tight">
                Connect your
                <span className="text-gradient block">Slack workspace</span>
                <span className="block">effortlessly</span>
              </h1>

              <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Send and schedule Slack messages with precision timing. Perfect for teams, 
                marketing campaigns, and automated workflows.
              </p>

              {/* Features grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                {features.map((feature, index) => (
                  <div key={index} className="card-hover p-6 text-center animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className={`w-12 h-12 rounded-2xl ${feature.color} flex items-center justify-center mx-auto mb-4`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{feature.title}</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>

              {/* Benefits list */}
              <div className="bg-white/60 dark:bg-dark-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-soft dark:shadow-soft-dark border border-neutral-200/50 dark:border-dark-600/50">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                  Why teams choose us
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center text-sm text-neutral-700 dark:text-neutral-300">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side - Login form */}
            <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="card-glass p-8 lg:p-12 max-w-md mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-colored">
                    <Slack className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    Connect Workspace
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Securely connect your Slack workspace to get started
                  </p>
                </div>
                
                {error && (
                  <div className="notification-error mb-6 animate-slide-down">
                    <div className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0">⚠️</div>
                    <div>
                      <p className="font-medium">Connection failed</p>
                      <p className="text-sm opacity-90">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleConnectSlack}
                  disabled={isConnecting}
                  className="btn-primary btn-lg w-full group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-slack-green to-slack-blue opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Connecting workspace...
                    </>
                  ) : (
                    <>
                      <Slack className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                      Connect with Slack
                      <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </button>

                <div className="mt-6 p-4 bg-neutral-50/80 dark:bg-dark-900/50 rounded-xl border border-neutral-200/50 dark:border-dark-600/50">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center leading-relaxed">
                    By connecting, you agree to our secure OAuth 2.0 integration. 
                    We never store your messages or sensitive data. 
                    <span className="text-primary-600 dark:text-primary-400 font-medium"> Your privacy is guaranteed.</span>
                  </p>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-center">
                    <Shield className="w-3 h-3 mr-1" />
                    Protected by enterprise-grade encryption
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section - Social proof */}
          <div className="mt-20 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">Trusted by teams at</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              {/* Placeholder for company logos */}
              <div className="w-20 h-8 bg-neutral-200 dark:bg-dark-700 rounded-lg"></div>
              <div className="w-24 h-8 bg-neutral-200 dark:bg-dark-700 rounded-lg"></div>
              <div className="w-18 h-8 bg-neutral-200 dark:bg-dark-700 rounded-lg"></div>
              <div className="w-22 h-8 bg-neutral-200 dark:bg-dark-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;