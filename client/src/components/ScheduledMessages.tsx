import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Calendar, Trash2, RefreshCw, Clock, CheckCircle, AlertCircle, Hash, MoreVertical, Eye } from 'lucide-react';
import { ScheduledMessage } from '../types';
import apiService from '../services/api';

const ScheduledMessages: React.FC = () => {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);

  useEffect(() => {
    loadScheduledMessages();
    
    // Refresh messages every 30 seconds
    const interval = setInterval(loadScheduledMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadScheduledMessages = async () => {
    try {
      const scheduledMessages = await apiService.getScheduledMessages();
      setMessages(scheduledMessages);
    } catch (error) {
      showNotification('error', 'Failed to load scheduled messages');
      console.error('Error loading scheduled messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCancelMessage = async (messageId: number) => {
    setCancellingId(messageId);
    
    try {
      await apiService.cancelScheduledMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      showNotification('success', 'Scheduled message cancelled successfully');
    } catch (error) {
      const errorMessage = apiService.getErrorMessage(error);
      showNotification('error', errorMessage);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          badge: 'status-pending',
          iconColor: 'text-warning-600',
          bgColor: 'bg-warning-50',
          borderColor: 'border-warning-200'
        };
      case 'sent':
        return {
          icon: CheckCircle,
          badge: 'status-success',
          iconColor: 'text-success-600',
          bgColor: 'bg-success-50',
          borderColor: 'border-success-200'
        };
      case 'failed':
        return {
          icon: AlertCircle,
          badge: 'status-error',
          iconColor: 'text-error-600',
          bgColor: 'bg-error-50',
          borderColor: 'border-error-200'
        };
      default:
        return {
          icon: Clock,
          badge: 'status-pending',
          iconColor: 'text-neutral-400',
          bgColor: 'bg-neutral-50',
          borderColor: 'border-neutral-200'
        };
    }
  };

  const formatChannelName = (channel: string) => {
    if (channel.startsWith('C') || channel.startsWith('G')) {
      return `#${channel}`;
    }
    return channel;
  };

  const pendingMessages = messages.filter(msg => msg.status === 'pending');
  const sentMessages = messages.filter(msg => msg.status === 'sent');
  const failedMessages = messages.filter(msg => msg.status === 'failed');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-8">
          <div className="animate-pulse space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-8 bg-neutral-200 rounded-lg w-1/3"></div>
              <div className="h-10 bg-neutral-200 rounded-lg w-24"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-neutral-200 rounded-xl"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-neutral-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="card">
        <div className="p-6 border-b border-neutral-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-secondary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-neutral-900">
                  Scheduled Messages
                </h2>
                <p className="text-neutral-600">
                  Monitor and manage your message queue
                </p>
              </div>
            </div>
            
            <button
              onClick={loadScheduledMessages}
              className="btn-outline flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-6 bg-neutral-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-warning-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-warning-600" />
              </div>
              <div className="text-3xl font-display font-bold text-warning-600 mb-1">
                {pendingMessages.length}
              </div>
              <div className="text-sm font-medium text-neutral-600">Pending</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-success-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <div className="text-3xl font-display font-bold text-success-600 mb-1">
                {sentMessages.length}
              </div>
              <div className="text-sm font-medium text-neutral-600">Sent</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-error-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-error-600" />
              </div>
              <div className="text-3xl font-display font-bold text-error-600 mb-1">
                {failedMessages.length}
              </div>
              <div className="text-sm font-medium text-neutral-600">Failed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`${
          notification.type === 'success' ? 'notification-success' : 'notification-error'
        } animate-slide-down`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium">
              {notification.type === 'success' ? 'Success!' : 'Error'}
            </p>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="card">
        {messages.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className="text-xl font-display font-bold text-neutral-900 mb-3">
              No scheduled messages yet
            </h3>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              Start by composing your first scheduled message. Perfect for reminders, 
              announcements, and time-sensitive communications.
            </p>
            <button className="btn-primary">
              Create First Message
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {messages.map((message) => {
              const statusConfig = getStatusConfig(message.status);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedMessage === message.id;
              
              return (
                <div key={message.id} className={`p-6 transition-all duration-200 hover:bg-neutral-50/50`}>
                  <div className="flex items-start gap-4">
                    
                    {/* Status Icon */}
                    <div className={`w-12 h-12 rounded-2xl ${statusConfig.bgColor} ${statusConfig.borderColor} border flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon className={`w-6 h-6 ${statusConfig.iconColor}`} />
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={statusConfig.badge}>
                          {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                        </span>
                        <div className="flex items-center text-sm text-neutral-500">
                          <Hash className="w-3 h-3 mr-1" />
                          {formatChannelName(message.channel)}
                        </div>
                        {message.retryCount > 0 && (
                          <div className="inline-flex items-center px-2 py-1 bg-warning-100 text-warning-700 text-xs font-medium rounded-full">
                            Retries: {message.retryCount}
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <p className={`text-neutral-900 leading-relaxed ${
                          isExpanded ? '' : 'line-clamp-2'
                        }`}>
                          {message.message}
                        </p>
                        {message.message.length > 150 && (
                          <button
                            onClick={() => setExpandedMessage(isExpanded ? null : message.id)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="font-medium">
                            {message.status === 'pending' ? 'Scheduled for' : 'Was scheduled for'}:
                          </span>
                          <span className="ml-1 font-mono">
                            {format(new Date(message.sendTimestamp * 1000), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        
                        {message.status === 'pending' && (
                          <div className="flex items-center text-secondary-600">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDistanceToNow(new Date(message.sendTimestamp * 1000), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {message.status === 'pending' && (
                        <button
                          onClick={() => handleCancelMessage(message.id)}
                          disabled={cancellingId === message.id}
                          className="inline-flex items-center px-4 py-2 bg-error-100 hover:bg-error-200 text-error-700 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancellingId === message.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-error-700 mr-2"></div>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Cancel
                            </>
                          )}
                        </button>
                      )}
                      
                      <button className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all duration-200">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduledMessages;