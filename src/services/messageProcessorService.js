import sqsService from './sqsService';
import { processIncomingFICCMessage } from './matchingService';
import { FICCMessageParser } from './ficcService';

class MessageProcessorService {
  constructor() {
    this.isProcessing = false;
    this.processInterval = null;
    this.messageCount = 0;
    
    // Ensure cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.stopProcessing());
    }
  }

  async startProcessing() {
    if (this.isProcessing) {
      console.log('Message processor already running');
      return;
    }

    console.log('Starting message processor...');
    
    try {
      // Test SQS connection
      await sqsService.receiveMessages(1);
      console.log('Successfully connected to SQS');
      
      this.isProcessing = true;

      // Start continuous processing
      this.processInterval = setInterval(async () => {
        if (!this.isProcessing) {
          console.log('Processing stopped - clearing interval');
          clearInterval(this.processInterval);
          this.processInterval = null;
          return;
        }

        try {
          await this.processBatch();
        } catch (error) {
          console.error('Error processing message batch:', error);
          // If we get a critical error, stop processing
          if (error.name === 'CredentialsProviderError' || error.name === 'UnauthorizedClientError') {
            this.stopProcessing();
          }
        }
      }, 5000); // Changed from 1000 to 5000ms to reduce load
    } catch (error) {
      console.error('Failed to start message processor:', error);
      this.stopProcessing();
    }
  }

  stopProcessing() {
    console.log('Stopping message processor...');
    this.isProcessing = false;
    
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    
    console.log(`Message processor stopped. Processed ${this.messageCount} messages.`);
  }

  async processBatch() {
    console.log('Processing batch...');
    const messages = await sqsService.receiveMessages();
    console.log(`Received ${messages.length} messages from SQS`);

    for (const message of messages) {
      try {
        // Parse the FICC message from SQS
        const ficcMessage = JSON.parse(message.Body);
        console.log('Processing FICC message:', {
          type: ficcMessage.messageType,
          content: ficcMessage.content
        });
        
        // Process the message using existing service
        const result = await processIncomingFICCMessage(
          ficcMessage.content, 
          ficcMessage.messageType
        );

        console.log('Message processing result:', result);

        if (result.success) {
          await sqsService.deleteMessage(message.ReceiptHandle);
          this.messageCount++;
          console.log(`Successfully processed message. Total count: ${this.messageCount}`);
        }

      } catch (error) {
        console.error('Error processing message:', {
          error: error.message,
          stack: error.stack
        });
      }
    }
  }

  getProcessedCount() {
    return this.messageCount;
  }
}

// Create a single instance
const messageProcessor = new MessageProcessorService();

// Add cleanup handler for development hot reloading
if (module.hot) {
  module.hot.dispose(() => {
    console.log('Hot module replacement - cleaning up message processor');
    messageProcessor.stopProcessing();
  });
}

export default messageProcessor; 