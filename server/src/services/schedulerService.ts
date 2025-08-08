import * as cron from 'node-cron';
import { ObjectId } from 'mongodb';
import Database, { ScheduledMessage, User } from '../database/database';
import SlackService from './slackService';

class SchedulerService {
  private database: Database;
  private slackService: SlackService;
  private cronJob: cron.ScheduledTask | null = null;
  private tokenRefreshJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  constructor(database: Database, slackService: SlackService) {
    this.database = database;
    this.slackService = slackService;
  }

  start(): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    // Process scheduled messages every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.processScheduledMessages();
    });

    // Check for token refresh every hour
    this.tokenRefreshJob = cron.schedule('0 * * * *', async () => {
      await this.refreshExpiredTokens();
    });

    this.isRunning = true;
    console.log('Scheduler service started');
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }

    if (this.tokenRefreshJob) {
      this.tokenRefreshJob.stop();
      this.tokenRefreshJob = null;
    }

    this.isRunning = false;
    console.log('Scheduler service stopped');
  }

  private async processScheduledMessages(): Promise<void> {
    try {
      const pendingMessages = await this.database.getPendingMessages();
      
      if (pendingMessages.length === 0) {
        return;
      }

      console.log(`Processing ${pendingMessages.length} scheduled messages`);

      for (const message of pendingMessages) {
        await this.processMessage(message);
      }
    } catch (error) {
      console.error('Error processing scheduled messages:', error);
    }
  }

  private async processMessage(message: ScheduledMessage): Promise<void> {
    try {
      // Get user and refresh token if needed
      const user = await this.database.getUserById(message.user_id);
      if (!user) {
        console.error(`User not found for message ${message._id}`);
        await this.database.updateScheduledMessage(message._id!, { 
          status: 'failed' 
        });
        return;
      }

      // Check if token needs refresh (only for tokens that have expiration)
      const now = Math.floor(Date.now() / 1000);
      let accessToken = user.access_token;

      if (user.token_expires_at && user.token_expires_at <= now) {
        console.log(`Refreshing token for user ${user._id}`);
        try {
          if (!user.refresh_token) {
            console.error(`No refresh token available for user ${user._id}`);
            await this.database.updateScheduledMessage(message._id!, { 
              status: 'failed',
              retry_count: message.retry_count + 1
            });
            return;
          }
          
          const refreshResult = await this.slackService.refreshAccessToken(user.refresh_token);
          accessToken = refreshResult.access_token;
          
          await this.database.updateUser(user._id!, {
            access_token: refreshResult.access_token,
            token_expires_at: now + refreshResult.expires_in
          });
        } catch (error) {
          console.error(`Failed to refresh token for user ${user._id}:`, error);
          await this.database.updateScheduledMessage(message._id!, { 
            status: 'failed',
            retry_count: message.retry_count + 1
          });
          return;
        }
      }

      // Send the message
      await this.slackService.sendMessage(accessToken, message.channel, message.message);
      
      // Mark as sent
      await this.database.updateScheduledMessage(message._id!, { 
        status: 'sent' 
      });

      console.log(`Successfully sent scheduled message ${message._id}`);
    } catch (error) {
      console.error(`Error processing message ${message._id}:`, error);
      
      const newRetryCount = message.retry_count + 1;
      const maxRetries = 3;

      if (newRetryCount >= maxRetries) {
        // Mark as failed after max retries
        await this.database.updateScheduledMessage(message._id!, { 
          status: 'failed',
          retry_count: newRetryCount
        });
        console.log(`Message ${message._id} failed permanently after ${maxRetries} retries`);
      } else {
        // Increment retry count and try again later
        await this.database.updateScheduledMessage(message._id!, { 
          retry_count: newRetryCount,
          // Delay retry by 5 minutes
          send_timestamp: Math.floor(Date.now() / 1000) + 300
        });
        console.log(`Message ${message._id} will be retried. Attempt ${newRetryCount}/${maxRetries}`);
      }
    }
  }

  private async refreshExpiredTokens(): Promise<void> {
    try {
      // This is a preventive measure to refresh tokens before they expire
      // We'll implement a more comprehensive token management system
      console.log('Checking for tokens that need refresh...');
      // For now, we handle token refresh on-demand in processMessage
    } catch (error) {
      console.error('Error in token refresh job:', error);
    }
  }

  async scheduleMessage(userId: ObjectId | string, channel: string, message: string, sendTimestamp: number): Promise<ObjectId> {
    try {
      const messageId = await this.database.createScheduledMessage({
        user_id: typeof userId === 'string' ? new ObjectId(userId) : userId,
        channel,
        message,
        send_timestamp: sendTimestamp,
        status: 'pending',
        retry_count: 0
      });

      console.log(`Scheduled message ${messageId} for user ${userId} at ${new Date(sendTimestamp * 1000).toISOString()}`);
      return messageId;
    } catch (error) {
      console.error('Error scheduling message:', error);
      throw new Error('Failed to schedule message');
    }
  }

  async cancelScheduledMessage(messageId: ObjectId | string, userId: ObjectId | string): Promise<void> {
    try {
      await this.database.deleteScheduledMessage(messageId, userId);
      console.log(`Cancelled scheduled message ${messageId} for user ${userId}`);
    } catch (error) {
      console.error('Error cancelling scheduled message:', error);
      throw new Error('Failed to cancel scheduled message');
    }
  }

  async getScheduledMessages(userId: ObjectId | string): Promise<ScheduledMessage[]> {
    try {
      return await this.database.getScheduledMessagesByUserId(userId);
    } catch (error) {
      console.error('Error getting scheduled messages:', error);
      throw new Error('Failed to get scheduled messages');
    }
  }
}

export default SchedulerService;