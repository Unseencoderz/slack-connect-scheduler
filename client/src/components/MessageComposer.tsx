import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format, isValid } from 'date-fns';
import { Send, Clock, Hash, AlertCircle, CheckCircle, Zap, Calendar, Sparkles } from 'lucide-react';
import { SlackChannel } from '../types';
import apiService from '../services/api';
import 'react-datepicker/dist/react-datepicker.css';

const MessageComposer: React.FC = () => {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [channelsLoading, setChannelsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadChannels();
  }, []);

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
    setTimeout(() => setNotification(null), 5000);
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

      // Clear form after successful submission
      setMessage('');
      setScheduleDate(null);
      setIsScheduled(false);
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



  return (
    <div className="grid lg:grid-cols-3 gap-8">
      
      {/* Main Composer */}
      <div className="lg:col-span-2">
        <div className="card">
          <div className="p-6 border-b border-neutral-100 dark:border-dark-700">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/40 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100">
                  Compose Message
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Send instantly or schedule for the perfect moment
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
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
                  {message.length} / 4000 characters
                </span>
              </label>
              
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here... Use @mentions, #channels, and :emojis: to make it engaging!"
                  rows={6}
                  maxLength={4000}
                  className="input-primary resize-none"
                  required
                />
                <div className="absolute bottom-3 right-3">
                  <Sparkles className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
                </div>
              </div>
            </div>

            {/* Schedule Toggle */}
            <div className="bg-neutral-50 dark:bg-dark-900/50 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isScheduled ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400' : 'bg-neutral-200 dark:bg-dark-700 text-neutral-500 dark:text-neutral-400'
                  }`}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Schedule for Later</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Send your message at the perfect time</p>
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

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={loading || channelsLoading}
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
                        Send Instantly
                      </>
                    )}
                  </>
                )}
              </button>
              
              {message && (
                <button
                  type="button"
                  onClick={() => {
                    setMessage('');
                    setScheduleDate(null);
                    setIsScheduled(false);
                  }}
                  className="btn-ghost btn-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        
        {/* Preview Card */}
        {selectedChannel && message && (
          <div className="card p-6 animate-slide-up">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              Preview
            </h3>
            <div className="bg-neutral-50 dark:bg-dark-900/50 border border-neutral-200 dark:border-dark-600 rounded-xl p-4">
              <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 mb-3 space-x-2">
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

        {/* Tips Card */}
        <div className="card p-6">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
            <Sparkles className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            Pro Tips
          </h3>
          <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-primary-600 dark:bg-primary-400 rounded-full mt-2 flex-shrink-0"></div>
              <span>Use @username to mention specific team members</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-secondary-600 dark:bg-secondary-400 rounded-full mt-2 flex-shrink-0"></div>
              <span>Add :emoji: to make your messages more engaging</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-yellow-600 dark:bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <span>Schedule messages to respect time zones</span>
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
      </div>
    </div>
  );
};

export default MessageComposer;