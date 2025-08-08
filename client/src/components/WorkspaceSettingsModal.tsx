import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { X, Settings, LogOut, Sun, Moon, Palette, Slack, Shield, Bell, CheckCircle } from 'lucide-react';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({ isOpen, onClose }) => {
  const { auth, logout } = useAppContext();
  const { theme, toggleTheme } = useTheme();
  const [notificationSettings, setNotificationSettings] = useState({
    messageUpdates: true,
    scheduleReminders: true,
    systemUpdates: false,
    emailNotifications: false
  });

  const handleLogout = () => {
    onClose();
    logout();
  };

  const handleNotificationChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-dark-800 rounded-3xl shadow-large dark:shadow-large-dark border border-neutral-200/50 dark:border-dark-600/50 w-full max-w-2xl animate-scale-in">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-dark-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100">
                  Workspace Settings
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Manage your workspace preferences and configuration
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-700 rounded-xl transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            
            {/* Workspace Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                <Slack className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-2" />
                Workspace Information
              </h3>
              
              <div className="bg-neutral-50 dark:bg-dark-900/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Team Name</span>
                  <span className="text-sm text-neutral-900 dark:text-neutral-100 font-semibold">{auth.teamName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Workspace ID</span>
                  <span className="text-sm text-neutral-900 dark:text-neutral-100 font-mono">{auth.workspaceId?.substring(0, 16)}...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Connection Status</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Connected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Appearance Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                Appearance
              </h3>
              
              <div className="bg-neutral-50 dark:bg-dark-900/50 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      theme === 'dark' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    }`}>
                      {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Theme Mode</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Currently using {theme} mode
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      theme === 'light' 
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30' 
                        : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/30'
                    }`}
                  >
                    Switch to {theme === 'light' ? 'Dark' : 'Light'}
                  </button>
                </div>
                
                <div className="pt-3 border-t border-neutral-200 dark:border-dark-600">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Theme preference is automatically saved and will be applied across all sessions.
                  </p>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
                Notifications
              </h3>
              
              <div className="bg-neutral-50 dark:bg-dark-900/50 rounded-xl p-4 space-y-4">
                {Object.entries(notificationSettings).map(([key, value]) => {
                  const labels = {
                    messageUpdates: { title: 'Message Updates', desc: 'Get notified when messages are sent successfully' },
                    scheduleReminders: { title: 'Schedule Reminders', desc: 'Notifications for upcoming scheduled messages' },
                    systemUpdates: { title: 'System Updates', desc: 'Important system announcements and updates' },
                    emailNotifications: { title: 'Email Notifications', desc: 'Receive notifications via email' }
                  };
                  
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                          {labels[key as keyof typeof labels].title}
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {labels[key as keyof typeof labels].desc}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() => handleNotificationChange(key as keyof typeof notificationSettings)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-200 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Security & Privacy */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                Security & Privacy
              </h3>
              
              <div className="bg-neutral-50 dark:bg-dark-900/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-neutral-700 dark:text-neutral-300">OAuth 2.0 secure authentication</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-neutral-700 dark:text-neutral-300">No message data stored on our servers</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-neutral-700 dark:text-neutral-300">Automatic token refresh and encryption</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-neutral-700 dark:text-neutral-300">Easy workspace disconnection available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-neutral-100 dark:border-dark-700 bg-neutral-50/50 dark:bg-dark-900/50 rounded-b-3xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="btn-primary flex-1"
              >
                Save Settings
              </button>
              
              <button
                onClick={handleLogout}
                className="btn-outline flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect Workspace</span>
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Settings are automatically saved to your browser's local storage
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettingsModal;