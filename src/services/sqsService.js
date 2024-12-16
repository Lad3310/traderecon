import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

class SQSService {
  constructor() {
    this.initializeSQS();
  }

  initializeSQS() {
    try {
      const region = process.env.REACT_APP_AWS_REGION;
      const accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
      const queueUrl = process.env.REACT_APP_SQS_QUEUE_URL;
      
      // Debug configuration
      console.log('AWS Configuration Check:', {
        region: region || 'MISSING',
        accessKeyId: accessKeyId ? `${accessKeyId.substring(0, 5)}...` : 'MISSING',
        secretKeyExists: !!secretAccessKey,
        queueUrl: queueUrl || 'MISSING'
      });

      if (!region || !accessKeyId || !secretAccessKey || !queueUrl) {
        const missing = [];
        if (!region) missing.push('AWS_REGION');
        if (!accessKeyId) missing.push('AWS_ACCESS_KEY_ID');
        if (!secretAccessKey) missing.push('AWS_SECRET_ACCESS_KEY');
        if (!queueUrl) missing.push('SQS_QUEUE_URL');
        
        throw new Error(`Missing required AWS configuration: ${missing.join(', ')}`);
      }

      this.sqs = new SQSClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey
        }
      });
      
      this.queueUrl = queueUrl;
      
      console.log('✅ SQS Service successfully initialized:', {
        region,
        queueUrl,
        clientConfigured: !!this.sqs
      });

      // Test the connection
      this.testConnection();

    } catch (error) {
      console.error('❌ Failed to initialize SQS:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async testConnection() {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 1
      });

      const response = await this.sqs.send(command);
      console.log('✅ SQS Connection test successful:', {
        queueAccessible: true,
        responseReceived: !!response
      });
    } catch (error) {
      console.error('❌ SQS Connection test failed:', {
        error: error.message,
        code: error.Code,
        type: error.$metadata?.httpStatusCode
      });
      throw error;
    }
  }

  async receiveMessages(maxMessages = 10) {
    if (!this.sqs || !this.queueUrl) {
      console.error('SQS not properly initialized');
      return [];
    }

    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 5, // Reduced from 20 to 5 seconds
      AttributeNames: ['All'],
      MessageAttributeNames: ['All']
    });

    try {
      console.log('Receiving messages from queue:', this.queueUrl);
      const response = await this.sqs.send(command);
      console.log('Received response:', response);
      return response.Messages || [];
    } catch (error) {
      console.error('Error receiving messages:', {
        error,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      });
      return [];
    }
  }

  async deleteMessage(receiptHandle) {
    if (!this.sqs || !this.queueUrl) {
      console.error('SQS not properly initialized');
      return;
    }

    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle
    });

    try {
      await this.sqs.send(command);
      console.log('Successfully deleted message:', receiptHandle);
    } catch (error) {
      console.error('Error deleting message:', {
        error,
        receiptHandle
      });
      throw error;
    }
  }
}

const sqsService = new SQSService();
export default sqsService; 