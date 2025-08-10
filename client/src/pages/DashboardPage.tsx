import React, { useState } from 'react';
import MessageComposer from '../components/MessageComposer';
import ScheduledMessages from '../components/ScheduledMessages';
import NewMessageModal from '../components/NewMessageModal';
import { useAppContext } from '../contexts/AppContext';
import { MessageSquare, Calendar, BarChart3, Plus, Clock, CheckCircle2, Bug } from 'lucide-react';

type TabType = 'compose' | 'scheduled' | 'analytics';

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('compose');
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const { debugAuthState } = useAppContext();

  const tabs = [
    {
      id: 'compose' as TabType,
      label: 'Compose',
      fullLabel: 'Compose Message',
      icon: MessageSquare,
      description: 'Create and send messages instantly or schedule for later',
      color: 'bg-primary-100 text-primary-600 border-primary-200',
      activeColor: 'bg-primary-600 text-white border-primary-600'
    },
    {
      id: 'scheduled' as TabType,
      label: 'Scheduled',
      fullLabel: 'Scheduled Messages',
      icon: Calendar,
      description: 'Manage and monitor your scheduled messages',
      color: 'bg-secondary-100 text-secondary-600 border-secondary-200',
      activeColor: 'bg-secondary-600 text-white border-secondary-600'
    },
    {
      id: 'analytics' as TabType,
      label: 'Analytics',
      fullLabel: 'Message Analytics',
      icon: BarChart3,
      description: 'View insights and performance metrics',
      color: 'bg-warning-100 text-warning-600 border-warning-200',
      activeColor: 'bg-warning-600 text-white border-warning-600'
    }
  ];

  const stats = [
    {
      label: 'Messages Sent Today',
      value: '24',
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
      trend: '+12%'
    },
    {
      label: 'Scheduled Messages',
      value: '8',
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20',
      trend: '+3'
    },
    {
      label: 'Active Channels',
      value: '12',
      icon: MessageSquare,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
      trend: 'All connected'
    }
  ];

  const handleNewMessageSuccess = () => {
    // Optionally refresh data or switch to scheduled tab if message was scheduled
    // For now, we'll just show a success state
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'compose':
        return <MessageComposer />;
      case 'scheduled':
        return <ScheduledMessages />;
      case 'analytics':
        return (
          <div className="card p-12 text-center animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 dark:from-yellow-900/20 to-yellow-200 dark:to-yellow-800/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Analytics Dashboard
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto leading-relaxed">
              Comprehensive message analytics and insights are coming soon. 
              Track engagement, delivery rates, and performance metrics.
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-xl font-medium border border-yellow-200 dark:border-yellow-800">
              <Clock className="w-5 h-5 mr-2" />
              Coming in the next update
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                Dashboard
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                Manage your Slack messages and scheduling workflows
              </p>
            </div>
            
            {/* Quick Action Button */}
            <div className="flex gap-3 lg:w-auto w-full justify-center">
              <button 
                onClick={() => setIsNewMessageModalOpen(true)}
                className="btn-primary flex items-center space-x-2 group"
              >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span>New Message</span>
              </button>
              
              {/* Debug Button - Remove in production */}
              <button 
                onClick={debugAuthState}
                className="btn-secondary flex items-center space-x-2 group"
                title="Debug Authentication State"
              >
                <Bug className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="hidden sm:inline">Debug</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="card-hover p-6 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">{stat.trend}</span>
              </div>
              <div className="text-3xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 p-2 bg-white dark:bg-dark-800 rounded-2xl shadow-soft dark:shadow-soft-dark border border-neutral-200/50 dark:border-dark-600/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center sm:justify-start space-x-3 px-6 py-4 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? `${tab.activeColor} shadow-colored`
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-dark-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">
                      <span className="sm:hidden">{tab.label}</span>
                      <span className="hidden sm:inline">{tab.fullLabel}</span>
                    </div>
                    <div className="text-xs opacity-75 hidden lg:block">
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300 ease-in-out animate-fade-in">
          {renderTabContent()}
        </div>
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        isOpen={isNewMessageModalOpen}
        onClose={() => setIsNewMessageModalOpen(false)}
        onSuccess={handleNewMessageSuccess}
      />
    </div>
  );
};

export default DashboardPage;
