import { Router, Response } from 'express';
import Database from '../database/database';
import SlackService from '../services/slackService';
import SchedulerService from '../services/schedulerService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

export const createMessageRoutes = (
  database: Database, 
  slackService: SlackService, 
  schedulerService: SchedulerService
): Router => {
  const router = Router();

  // Apply auth middleware to all routes
  router.use(authMiddleware(database));

  // Get available channels
  router.get('/channels', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const channels = await slackService.getChannels(req.user.access_token);
      res.json({ channels });
    } catch (error) {
      console.error('Error fetching channels:', error);
      res.status(500).json({ error: 'Failed to fetch channels' });
    }
  });

  // Send immediate message
  router.post('/send', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { channel, message } = req.body;

      if (!channel || !message) {
        res.status(400).json({ error: 'Channel and message are required' });
        return;
      }

      if (typeof channel !== 'string' || typeof message !== 'string') {
        res.status(400).json({ error: 'Channel and message must be strings' });
        return;
      }

      if (message.trim().length === 0) {
        res.status(400).json({ error: 'Message cannot be empty' });
        return;
      }

      // Send message immediately
      await slackService.sendMessage(req.user.access_token, channel, message);

      res.json({ 
        success: true, 
        message: 'Message sent successfully' 
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Schedule a message
  router.post('/schedule', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { channel, message, sendTimestamp } = req.body;

      if (!channel || !message || !sendTimestamp) {
        res.status(400).json({ 
          error: 'Channel, message, and sendTimestamp are required' 
        });
        return;
      }

      if (typeof channel !== 'string' || typeof message !== 'string' || typeof sendTimestamp !== 'number') {
        res.status(400).json({ 
          error: 'Invalid data types for required fields' 
        });
        return;
      }

      if (message.trim().length === 0) {
        res.status(400).json({ error: 'Message cannot be empty' });
        return;
      }

      // Check if timestamp is in the future
      const now = Math.floor(Date.now() / 1000);
      if (sendTimestamp <= now) {
        res.status(400).json({ 
          error: 'Send timestamp must be in the future' 
        });
        return;
      }

      // Schedule the message
      const messageId = await schedulerService.scheduleMessage(
        req.user._id!,
        channel,
        message,
        sendTimestamp
      );

      res.json({ 
        success: true, 
        messageId,
        message: 'Message scheduled successfully' 
      });
    } catch (error) {
      console.error('Error scheduling message:', error);
      res.status(500).json({ error: 'Failed to schedule message' });
    }
  });

  // Get scheduled messages
  router.get('/scheduled', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const scheduledMessages = await schedulerService.getScheduledMessages(req.user._id!);
      
      // Format messages for frontend
      const formattedMessages = scheduledMessages.map(msg => ({
        id: msg._id,
        channel: msg.channel,
        message: msg.message,
        sendTimestamp: msg.send_timestamp,
        status: msg.status,
        retryCount: msg.retry_count,
        createdAt: msg.created_at
      }));

      res.json({ messages: formattedMessages });
    } catch (error) {
      console.error('Error fetching scheduled messages:', error);
      res.status(500).json({ error: 'Failed to fetch scheduled messages' });
    }
  });

  // Cancel a scheduled message
  router.delete('/scheduled/:messageId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const messageId = req.params.messageId;
      
      if (!messageId) {
        res.status(400).json({ error: 'Invalid message ID' });
        return;
      }

      await schedulerService.cancelScheduledMessage(messageId, req.user._id!);

      res.json({ 
        success: true, 
        message: 'Scheduled message cancelled successfully' 
      });
    } catch (error) {
      console.error('Error cancelling scheduled message:', error);
      res.status(500).json({ error: 'Failed to cancel scheduled message' });
    }
  });

  return router;
};