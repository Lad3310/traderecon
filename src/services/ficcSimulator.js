import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { supabase } from '../lib/supabaseClient';

// Add this debug check
console.log('AWS SDK imports check:', {
  hasSQSClient: !!SQSClient,
  hasCommand: !!SendMessageCommand
});

class FICCSimulator {
  constructor() {
    const region = process.env.REACT_APP_AWS_REGION;
    const accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
    
    // Debug log (remove in production)
    console.log('AWS Configuration:', {
      region,
      accessKeyId: accessKeyId ? `${accessKeyId.slice(0, 4)}...` : 'missing',
      secretKeyExists: !!secretAccessKey,
      queueUrl: process.env.REACT_APP_SQS_QUEUE_URL
    });

    if (!region || !accessKeyId || !secretAccessKey) {
      console.error('Missing required AWS configuration:', {
        hasRegion: !!region,
        hasAccessKey: !!accessKeyId,
        hasSecretKey: !!secretAccessKey
      });
    }

    this.sqs = new SQSClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    
    this.queueUrl = process.env.REACT_APP_SQS_QUEUE_URL;
    
    console.log('FICC Simulator initialized with region:', region);
  }

  // Generate sample FICC MT518 message
  async generateMT518Message() {
    try {
      console.log('Fetching unmatched trades...');
      // Get unmatched trades from trades table
      const { data: unmatchedTrades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('comparison_status', 'UNMATCHED')
        .is('ficc_status', null)
        .limit(1);

      if (tradesError) {
        console.error('Error fetching unmatched trades:', tradesError);
        throw tradesError;
      }
      
      console.log('Unmatched trades found:', unmatchedTrades?.length || 0);

      if (!unmatchedTrades?.length) {
        console.log('No unmatched trades to simulate messages for');
        return null;
      }

      const trade = unmatchedTrades[0];

      // Generate a matching contra-side message
      const contraMessage = {
        messageType: 'MT518',
        content: {
          header: {
            sender: trade.contra_executing_firm || 'FICCUS33',
            receiver: trade.executing_firm || 'TESTUS33',
            messageType: '518'
          },
          tradeDet: {
            tradeDate: trade.tradedate,
            settlementDate: trade.settlementdate,
            cusip: trade.cusip,
            quantity: trade.quantity,
            price: trade.price,
            transactionType: trade.transaction_type === 'BUY' ? 'SELL' : 'BUY'
          },
          firmInfo: {
            submittingMemberExecutingFirmCustomerId: trade.submitting_member_executing_firm_customer_id || 'RAJA',
            memberFirmId: trade.member_firm_id || '9553',
            contraFirmExecutingFirmCustomerId: trade.contra_firm_executing_firm_customer_id,
            contraFirmId: trade.contra_firm_id
          }
        }
      };

      // Store the message with all required fields
      const messageRecord = {
        message_type: 'MT518',
        sender: contraMessage.content.header.sender,
        receiver: contraMessage.content.header.receiver,
        message_content: contraMessage,
        trade_reference: trade.id.toString(),
        cusip: trade.cusip,
        quantity: trade.quantity,
        price: trade.price,
        tradedate: trade.tradedate,
        settlementdate: trade.settlementdate,
        executing_firm: trade.executing_firm,
        contra_executing_firm: trade.contra_executing_firm,
        transaction_type: contraMessage.content.tradeDet.transactionType,
        comparison_status: 'PENDING',
        is_processed: false,
        submitting_member_executing_firm_customer_id: contraMessage.content.firmInfo.submittingMemberExecutingFirmCustomerId,
        member_firm_id: contraMessage.content.firmInfo.memberFirmId,
        contra_firm_executing_firm_customer_id: contraMessage.content.firmInfo.contraFirmExecutingFirmCustomerId,
        contra_firm_id: contraMessage.content.firmInfo.contraFirmId
      };

      console.log('Inserting message into ficc_messages:', messageRecord);

      const { error: insertError } = await supabase
        .from('ficc_messages')
        .insert([messageRecord]);

      if (insertError) {
        console.error('Error inserting message:', insertError);
        throw insertError;
      }

      return contraMessage;
    } catch (error) {
      console.error('Error generating MT518 message:', error);
      return null;
    }
  }

  // Generate sample FICC MT509 status message
  async generateMT509Message(status = 'MACH') {
    try {
      console.log('Generating MT509 status message...');
      
      // Get a random pending trade with all needed fields
      const { data: trades, error: tradeError } = await supabase
        .from('trades')
        .select(`
          id,
          executing_firm,
          comparison_status,
          tradedate,
          settlementdate,
          submitting_member_executing_firm_customer_id,
          member_firm_id
        `)
        .eq('comparison_status', 'PENDING')
        .limit(1);

      if (tradeError) {
        console.error('Error fetching trade for MT509:', tradeError);
        throw tradeError;
      }

      if (!trades?.length) {
        console.log('No pending trades found for status update');
        return null;
      }

      const trade = trades[0];
      console.log('Found trade for status update:', trade);

      const statusMessage = {
        messageType: 'MT509',
        content: {
          header: {
            sender: 'FICCUS33',
            receiver: trade.executing_firm || 'TESTUS33',
            messageType: '509'
          },
          status: {
            type: status,
            reason: null
          },
          reference: {
            tradeId: trade.id.toString(),
            submittingFirm: trade.submitting_member_executing_firm_customer_id,
            memberFirm: trade.member_firm_id
          }
        }
      };

      // Store the message with all required fields
      const messageRecord = {
        message_type: 'MT509',
        sender: statusMessage.content.header.sender,
        receiver: statusMessage.content.header.receiver,
        message_content: statusMessage,
        trade_reference: trade.id.toString(),
        status_type: status,
        comparison_status: status,
        is_processed: false,
        tradedate: trade.tradedate,
        settlementdate: trade.settlementdate,
        submitting_member_executing_firm_customer_id: trade.submitting_member_executing_firm_customer_id,
        member_firm_id: trade.member_firm_id
      };

      console.log('Inserting MT509 message:', messageRecord);

      const { error: insertError } = await supabase
        .from('ficc_messages')
        .insert([messageRecord]);

      if (insertError) {
        console.error('Error storing MT509 message:', insertError);
        throw insertError;
      }

      return statusMessage;
    } catch (error) {
      console.error('Error generating MT509 message:', error);
      return null;
    }
  }

  generateRandomDate(daysOffset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  }

  // Send a simulated message to SQS
  async sendSimulatedMessage(shouldFail = false) {
    try {
      // Generate message and handle null case
      const message = await (Math.random() > 0.7 
        ? this.generateMT509Message() 
        : this.generateMT518Message());

      // If no message was generated (e.g., no unmatched trades)
      if (!message) {
        console.log('No message generated - no unmatched trades found');
        return { 
          success: false, 
          messageType: null,
          matched: false,
          reason: 'No unmatched trades found'
        };
      }

      console.log('🔄 Generated FICC message:', message);

      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          "MessageType": {
            DataType: "String",
            StringValue: message.messageType
          }
        }
      });

      const response = await this.sqs.send(command);
      
      console.log('✅ Message sent successfully:', {
        messageId: response.MessageId,
        messageType: message.messageType,
        metadata: response.$metadata
      });
      
      return { 
        success: true, 
        messageId: response.MessageId,
        messageType: message.messageType,
        matched: message.messageType === 'MT518' && Math.random() > 0.5
      };
    } catch (error) {
      console.error('❌ Failed to send message:', {
        name: error.name,
        message: error.message,
        code: error.Code,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId
      });
      return { 
        success: false, 
        messageType: null,
        matched: false,
        reason: error.message
      };
    }
  }

  // Start simulation with random intervals
  startSimulation(failureRate = 0) {
    if (this.simulationInterval) {
      console.log('Simulation already running');
      return;
    }

    const sendMessage = async () => {
      try {
        const shouldFail = Math.random() < (failureRate / 100);
        await this.sendSimulatedMessage(shouldFail);
      } catch (error) {
        console.error('Simulation error:', error);
      }
    };

    // Send first message immediately
    sendMessage();

    // Set up interval for subsequent messages
    this.simulationInterval = setInterval(sendMessage, 
      Math.random() * (15000 - 5000) + 5000); // Random interval between 5-15 seconds
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
      console.log('Simulation stopped');
    }
  }
}

export default new FICCSimulator(); 