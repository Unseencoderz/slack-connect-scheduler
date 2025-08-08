import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format, isValid } from 'date-fns';
import { X, Send, Clock, Hash, Zap, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { SlackChannel } from '../types';
import apiService from '../services/api';
import 'react-datepicker/dist/react-datepicker.css';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const NewMessageModal: React.FC<NewMessageModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [channelsLoading, setChannelsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadChannels();
      // Reset form when modal opens
      setMessage('');
      setScheduleDate(null);
      setIsScheduled(false);
      setNotification(null);
    }
  }, [isOpen]);

  const loadChannels = async () => {
    try {
      setChannelsLoading(true);
      const channelList = await apiService.getChannels();
      setChannels(channelList);
      if (channelList.length > 0) {
        setSelectedChannel(channelList[0].id);
      }
    } catch (error) {
      showNotification('error', 'Failed to load channels');
      console.error('Error loading channels:', error);
    } finally {
      setChannelsLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChannel || !message.trim()) {
      showNotification('error', 'Please select a channel and enter a message');
      return;
    }

    if (isScheduled && (!scheduleDate || !isValid(scheduleDate))) {
      showNotification('error', 'Please select a valid date and time for scheduling');
      return;
    }

    if (isScheduled && scheduleDate && scheduleDate <= new Date()) {
      showNotification('error', 'Scheduled time must be in the future');
      return;
    }

    setLoading(true);

    try {
      if (isScheduled && scheduleDate) {
        const timestamp = Math.floor(scheduleDate.getTime() / 1000);
        await apiService.scheduleMessage(selectedChannel, message.trim(), timestamp);
        showNotification('success', `Message scheduled for ${format(scheduleDate, 'PPpp')}`);
      } else {
        await apiService.sendMessage(selectedChannel, message.trim());
        showNotification('success', 'Message sent successfully');
      }

      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (error) {
      const errorMessage = apiService.getErrorMessage(error);
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedChannelName = () => {
    const channel = channels.find(c => c.id === selectedChannel);
    return channel ? channel.name : '';
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
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100">
                  New Message
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Send instantly or schedule for later
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
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

            {/* Channel Selection */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                <Hash className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span>Select Channel</span>
              </label>
              
              {channelsLoading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-neutral-200 dark:bg-dark-700 rounded-xl"></div>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="input-primary appearance-none pr-10 cursor-pointer"
                    required
                  >
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </select>
                  <Hash className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Message Content</span>
                <span className={`text-xs ${message.length > 1000 ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                  {message.length} / 2000 characters
                </span>
              </label>
              
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here... Use @mentions and :emojis: to make it engaging!"
                rows={4}
                maxLength={2000}
                className="input-primary resize-none"
                required
              />
            </div>

            {/* Schedule Toggle */}
            <div className="bg-neutral-50 dark:bg-dark-900/50 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isScheduled ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400' : 'bg-neutral-200 dark:bg-dark-700 text-neutral-500 dark:text-neutral-400'
                  }`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Schedule for Later</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Send at the perfect time</p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
                </label>
              </div>

              {/* Date/Time Picker */}
              {isScheduled && (
                <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-neutral-200 dark:border-dark-600 animate-slide-down">
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    <Calendar className="inline w-4 h-4 mr-2" />
                    Select Date & Time
                  </label>
                  <DatePicker
                    selected={scheduleDate}
                    onChange={(date: Date | null) => setScheduleDate(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    minDate={new Date()}
                    placeholderText="Choose when to send..."
                    className="w-full px-4 py-3 border border-neutral-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-700 text-neutral-900 dark:text-neutral-100"
                  />
                  {scheduleDate && (
                    <div className="mt-3 p-3 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg border border-secondary-200 dark:border-secondary-800">
                      <p className="text-sm text-secondary-700 dark:text-secondary-300 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Message will be sent on <strong className="ml-1">{format(scheduleDate, 'PPpp')}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview */}
            {selectedChannel && message && (
              <div className="bg-neutral-50 dark:bg-dark-900/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  Preview
                </h4>
                <div className="bg-white dark:bg-dark-800 border border-neutral-200 dark:border-dark-600 rounded-xl p-4">
                  <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 mb-2 space-x-2">
                    <Hash className="w-3 h-3" />
                    <span>{getSelectedChannelName()}</span>
                    {isScheduled && scheduleDate && (
                      <>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{format(scheduleDate, 'MMM d, h:mm a')}</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap leading-relaxed">
                    {message}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || channelsLoading || !message.trim()}
                className={`flex-1 ${
                  isScheduled ? 'btn-secondary' : 'btn-primary'
                } relative overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></div>
                    {isScheduled ? 'Scheduling...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    {isScheduled ? (
                      <>
                        <Clock className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                        Schedule Message
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                        Send Now
                      </>
                    )}
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost sm:w-auto"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewMessageModal;