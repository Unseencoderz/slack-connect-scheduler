// MongoDB initialization script for development
// This script runs when the MongoDB container starts for the first time

print('Initializing Slack Connect MongoDB database...');

// Switch to the slack-connect database
db = db.getSiblingDB('slack-connect');

// Create collections with initial indexes
print('Creating users collection...');
db.createCollection('users');
db.users.createIndex({ slack_workspace_id: 1 }, { unique: true });
db.users.createIndex({ token_expires_at: 1 });

print('Creating scheduled_messages collection...');
db.createCollection('scheduled_messages');
db.scheduled_messages.createIndex({ user_id: 1 });
db.scheduled_messages.createIndex({ status: 1, send_timestamp: 1 });
db.scheduled_messages.createIndex({ send_timestamp: 1 });

print('Slack Connect MongoDB initialization completed!');
print('Collections created:');
print('- users (with indexes on slack_workspace_id and token_expires_at)');
print('- scheduled_messages (with indexes on user_id, status+send_timestamp, and send_timestamp)');