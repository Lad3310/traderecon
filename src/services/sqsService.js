import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { AWS_CONFIG } from '../config/aws';

class SQSService {
  constructor() {
    this.sqs = null;
    this.queueUrl = null;
    this.initializeSQS();
  }

  initializeSQS() {
    try {
      if (!AWS_CONFIG.region || !AWS_CONFIG.credentials.accessKeyId || 
          !AWS_CONFIG.credentials.secretAccessKey || !AWS_CONFIG.sqs.queueUrl) {
        console.warn('AWS configuration incomplete - SQS features will be disabled');
        return;
      }

      this.sqs = new SQSClient({
        region: AWS_CONFIG.region,
        credentials: AWS_CONFIG.credentials
      });
      
      this.queueUrl = AWS_CONFIG.sqs.queueUrl;
      
      console.log('✅ SQS Service initialized');
    } catch (error) {
      console.warn('Failed to initialize SQS:', error);
    }
  }

  async receiveMessages(maxMessages = 10) {
    if (!this.sqs || !this.queueUrl) {
      console.warn('SQS not initialized - skipping message receive');
      return [];
    }

    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 5,
      AttributeNames: ['All'],
      MessageAttributeNames: ['All']
    });

    try {
      const response = await this.sqs.send(command);
      return response.Messages || [];
    } catch (error) {
      console.error('Error receiving messages:', error);
      return [];
    }
  }

  async deleteMessage(receiptHandle) {
    if (!this.sqs || !this.queueUrl) {
      console.warn('SQS not initialized - skipping message delete');
      return;
    }

    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle
    });

    try {
      await this.sqs.send(command);
      console.log('Message deleted:', receiptHandle);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }
}

// Create and export a single instance
const sqsService = new SQSService();
export default sqsService; 