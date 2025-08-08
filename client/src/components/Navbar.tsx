import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { LogOut, Slack, ChevronDown, User, Settings, Bell } from 'lucide-react';
import WorkspaceSettingsModal from './WorkspaceSettingsModal';

interface Notification {
  id: number;
  type: 'success' | 'scheduled' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const Navbar: React.FC = () => {
  const { auth, logout } = useAppContext();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'success',
      title: 'Message Sent',
      message: 'Your message to #general was delivered successfully',
      time: '2 minutes ago',
      read: false
    },
    {
      id: 2,
      type: 'scheduled',
      title: 'Scheduled Message',
      message: 'Your message will be sent to #marketing in 1 hour',
      time: '15 minutes ago',
      read: false
    },
    {
      id: 3,
      type: 'info',
      title: 'System Update',
      message: 'Enhanced dark mode support is now available',
      time: '1 hour ago',
      read: true
    }
  ]);

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
  };

  const handleSettingsClick = () => {
    setIsProfileOpen(false);
    setIsSettingsModalOpen(true);
  };

  const handleNotificationClick = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    
    // Mark all notifications as read when opening the dropdown
    if (!isNotificationsOpen) {
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    if (isProfileOpen || isNotificationsOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isProfileOpen, isNotificationsOpen]);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg border-b border-neutral-200/50 dark:border-dark-600/50 shadow-soft dark:shadow-soft-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo and brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-colored">
                  <Slack className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100">
                    Slack Connect
                  </h1>
                  {auth.teamName && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 -mt-0.5">
                      {auth.teamName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation items */}
            <div className="flex items-center space-x-4">
              
              {/* Connection status */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Connected</span>
              </div>

              {/* Notifications */}
              <div className="relative dropdown-container">
                <button 
                  onClick={handleNotificationClick}
                  className="relative p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-dark-700 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-800 rounded-2xl shadow-large dark:shadow-large-dark border border-neutral-200/50 dark:border-dark-600/50 backdrop-blur-lg animate-slide-down">
                    <div className="p-4 border-b border-neutral-100 dark:border-dark-700">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                          <p className="text-neutral-500 dark:text-neutral-400">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-4 border-b border-neutral-100 dark:border-dark-700 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-dark-700/50 transition-colors duration-200 cursor-pointer ${
                              !notification.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                !notification.read ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                              }`}></div>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-3 border-t border-neutral-100 dark:border-dark-700">
                      <button className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 p-2 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-dark-700 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Workspace User
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {auth.workspaceId?.substring(0, 8)}...
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 dark:text-neutral-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-800 rounded-2xl shadow-large dark:shadow-large-dark border border-neutral-200/50 dark:border-dark-600/50 backdrop-blur-lg animate-slide-down">
                    <div className="p-4 border-b border-neutral-100 dark:border-dark-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100">Workspace User</div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">{auth.teamName}</div>
                          <div className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                            ID: {auth.workspaceId?.substring(0, 12)}...
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button 
                        onClick={handleSettingsClick}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-dark-700 rounded-xl transition-all duration-200"
                      >
                        <Settings className="w-5 h-5" />
                        <div className="flex-1 text-left">
                          <span className="font-medium">Workspace Settings</span>
                          <div className="text-xs opacity-75">
                            Theme, notifications & privacy
                          </div>
                        </div>
                      </button>
                      
                      <div className="border-t border-neutral-100 dark:border-dark-700 my-2"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 font-medium"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Disconnect Workspace</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Workspace Settings Modal */}
      <WorkspaceSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
};

export default Navbar;