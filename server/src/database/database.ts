import { MongoClient, Db, Collection, ObjectId, IndexSpecification } from 'mongodb';

export interface User {
  _id?: ObjectId;
  slack_workspace_id: string;
  access_token: string;
  refresh_token?: string | null; // Make optional and allow null
  token_expires_at?: number | null; // Make optional and allow null for non-expiring tokens
  created_at: Date;
  updated_at: Date;
}

export interface ScheduledMessage {
  _id?: ObjectId;
  user_id: ObjectId;
  channel: string;
  message: string;
  send_timestamp: number;
  status: 'pending' | 'sent' | 'failed';
  retry_count: number;
  created_at: Date;
  updated_at: Date;
}

class Database {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private users: Collection<User> | null = null;
  private scheduledMessages: Collection<ScheduledMessage> | null = null;

  constructor(
    private connectionString: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/slack-connect'
  ) {}

  async connect(): Promise<void> {
    try {
      this.client = new MongoClient(this.connectionString);
      await this.client.connect();
      
  
      this.db = this.client.db();
      
      this.users = this.db.collection<User>('users');
      this.scheduledMessages = this.db.collection<ScheduledMessage>('scheduled_messages');
      
      console.log('Connected to MongoDB database');
      await this.createIndexes();
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }

  private extractDbName(connectionString: string): string | null {
    const match = connectionString.match(/\/([^?]+)(?:\?|$)/);
    return match && match[1] ? match[1] : null;
  }

  private async createIndexes(): Promise<void> {
    if (!this.users || !this.scheduledMessages) {
      throw new Error('Collections not initialized');
    }

    try {
      // User indexes
      await this.users.createIndex({ slack_workspace_id: 1 }, { unique: true });
      await this.users.createIndex({ token_expires_at: 1 });
      
      // Scheduled messages indexes
      await this.scheduledMessages.createIndex({ user_id: 1 });
      await this.scheduledMessages.createIndex({ status: 1, send_timestamp: 1 });
      await this.scheduledMessages.createIndex({ send_timestamp: 1 });
      
      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Error creating indexes:', error);
      throw error;
    }
  }

  // User operations
  async createUser(user: Omit<User, '_id' | 'created_at' | 'updated_at'>): Promise<ObjectId> {
    if (!this.users) {
      throw new Error('Database not connected');
    }

    const now = new Date();
    const userDoc: Omit<User, '_id'> = {
      ...user,
      created_at: now,
      updated_at: now
    };

    const result = await this.users.insertOne(userDoc);
    return result.insertedId;
  }

  async updateUser(id: ObjectId | string, updates: Partial<Omit<User, '_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    if (!this.users) {
      throw new Error('Database not connected');
    }

    const updateDoc = {
      ...updates,
      updated_at: new Date()
    };

    const result = await this.users.updateOne(
      { _id: typeof id === 'string' ? new ObjectId(id) : id },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }
  }

  async getUserByWorkspaceId(workspaceId: string): Promise<User | null> {
    if (!this.users) {
      throw new Error('Database not connected');
    }

    return await this.users.findOne({ slack_workspace_id: workspaceId });
  }

  async getUserById(id: ObjectId | string): Promise<User | null> {
    if (!this.users) {
      throw new Error('Database not connected');
    }

    return await this.users.findOne({ _id: typeof id === 'string' ? new ObjectId(id) : id });
  }

  // Scheduled message operations
  async createScheduledMessage(message: Omit<ScheduledMessage, '_id' | 'created_at' | 'updated_at'>): Promise<ObjectId> {
    if (!this.scheduledMessages) {
      throw new Error('Database not connected');
    }

    const now = new Date();
    const messageDoc: Omit<ScheduledMessage, '_id'> = {
      ...message,
      created_at: now,
      updated_at: now
    };

    const result = await this.scheduledMessages.insertOne(messageDoc);
    return result.insertedId;
  }

  async getScheduledMessagesByUserId(userId: ObjectId | string): Promise<ScheduledMessage[]> {
    if (!this.scheduledMessages) {
      throw new Error('Database not connected');
    }

    return await this.scheduledMessages
      .find({ user_id: typeof userId === 'string' ? new ObjectId(userId) : userId })
      .sort({ send_timestamp: 1 })
      .toArray();
  }

  async getPendingMessages(): Promise<ScheduledMessage[]> {
    if (!this.scheduledMessages) {
      throw new Error('Database not connected');
    }

    const now = Math.floor(Date.now() / 1000);
    return await this.scheduledMessages
      .find({
        status: 'pending',
        send_timestamp: { $lte: now }
      })
      .toArray();
  }

  async updateScheduledMessage(id: ObjectId | string, updates: Partial<Omit<ScheduledMessage, '_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    if (!this.scheduledMessages) {
      throw new Error('Database not connected');
    }

    const updateDoc = {
      ...updates,
      updated_at: new Date()
    };

    const result = await this.scheduledMessages.updateOne(
      { _id: typeof id === 'string' ? new ObjectId(id) : id },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      throw new Error('Scheduled message not found');
    }
  }

  async deleteScheduledMessage(id: ObjectId | string, userId: ObjectId | string): Promise<void> {
    if (!this.scheduledMessages) {
      throw new Error('Database not connected');
    }

    const result = await this.scheduledMessages.deleteOne({
      _id: typeof id === 'string' ? new ObjectId(id) : id,
      user_id: typeof userId === 'string' ? new ObjectId(userId) : userId
    });

    if (result.deletedCount === 0) {
      throw new Error('Scheduled message not found or unauthorized');
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.users = null;
      this.scheduledMessages = null;
      console.log('Database connection closed');
    }
  }

  // Health check method
  async ping(): Promise<boolean> {
    try {
      if (!this.db) {
        return false;
      }
      await this.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default Database;