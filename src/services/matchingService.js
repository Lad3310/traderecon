import { supabase } from '../lib/supabaseClient';
import { FICCMessageParser } from './ficcService';
import { FIRM_IDENTIFIERS } from '../constants/firmIdentifiers';

const MATCH_THRESHOLD = 20; // Require most fields to match (about 70% of max score)

export const processIncomingFICCMessage = async (messageContent, messageType) => {
  try {
    console.log('Processing incoming FICC message:', { messageContent, messageType });

    // If it's a status message (MT509), handle status update
    if (messageType === 'MT509') {
      const statusUpdate = {
        type: messageContent.status.type,
        reason: messageContent.status.reason,
        sender: messageContent.header.sender,
        receiver: messageContent.header.receiver,
        submittingFirm: messageContent.reference?.submittingFirm,
        memberFirm: messageContent.reference?.memberFirm
      };

      if (messageContent.reference?.tradeId) {
        const tradeId = messageContent.reference.tradeId;
        await updateTradeWithFICCInfo(tradeId, messageContent);
      }

      return {
        success: true,
        type: 'status_update',
        message: statusUpdate
      };
    }

    // If it's a trade message (MT518), process trade details
    if (messageType === 'MT518') {
      const tradeDetails = {
        tradeDate: messageContent.tradeDet.tradeDate,
        settlementDate: messageContent.tradeDet.settlementDate,
        cusip: messageContent.tradeDet.cusip,
        quantity: messageContent.tradeDet.quantity,
        price: messageContent.tradeDet.price,
        transactionType: messageContent.tradeDet.transactionType,
        buyerFirm: messageContent.header.receiver,
        sellerFirm: messageContent.header.sender
      };

      const matchingTrade = await findMatchingTrade(tradeDetails);
      if (matchingTrade) {
        await updateTradeWithFICCInfo(matchingTrade.id, messageContent);
        return {
          success: true,
          type: 'trade_matched',
          tradeId: matchingTrade.id
        };
      }

      return {
        success: true,
        type: 'trade_received',
        message: tradeDetails
      };
    }

    return {
      success: true,
      type: 'message_processed',
      message: messageContent
    };

  } catch (error) {
    console.error('Error processing FICC message:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const findMatchingTrade = async (ficcMessage) => {
  console.log('Finding match with new firm identifiers:', {
    submittingFirm: ficcMessage.submitting_member_executing_firm_customer_id,
    memberFirm: ficcMessage.member_firm_id,
    contraFirm: ficcMessage.contra_firm_executing_firm_customer_id,
    contraFirmId: ficcMessage.contra_firm_id
  });

  const { data: potentialMatches } = await supabase
    .from('trades')
    .select('*')
    .eq('cusip', ficcMessage.cusip)
    .eq('trade_date', ficcMessage.trade_date)
    .eq('settlement_date', ficcMessage.settlement_date);

  if (!potentialMatches?.length) return null;

  // Score and sort potential matches with new criteria
  const scoredMatches = potentialMatches.map(trade => ({
    trade,
    score: calculateMatchScore(trade, ficcMessage)
  }));

  scoredMatches.sort((a, b) => b.score - a.score);
  
  return scoredMatches[0].score >= MATCH_THRESHOLD ? scoredMatches[0].trade : null;
};

const calculateMatchScore = (trade, ficcMessage) => {
  const parsedFICC = parseFICCMessage(ficcMessage);
  
  // Enhanced logging with both database and display names
  console.log('Calculating match score:', {
    trade: {
      cusip: trade.cusip,
      quantity: trade.quantity,
      price: trade.price,
      firms: {
        [FIRM_IDENTIFIERS.submitting_member_executing_firm_customer_id.displayName]: 
          trade.submitting_member_executing_firm_customer_id,
        [FIRM_IDENTIFIERS.member_firm_id.displayName]: 
          trade.member_firm_id,
        [FIRM_IDENTIFIERS.contra_firm_executing_firm_customer_id.displayName]: 
          trade.contra_firm_executing_firm_customer_id,
        [FIRM_IDENTIFIERS.contra_firm_id.displayName]: 
          trade.contra_firm_id
      }
    },
    ficc: {
      cusip: parsedFICC.cusip,
      quantity: parsedFICC.quantity,
      price: parsedFICC.price,
      firms: parsedFICC.firms
    }
  });

  let score = 0;

  // Core trade details
  if (trade.cusip === parsedFICC.cusip) score += 5;
  if (trade.quantity === parsedFICC.quantity) score += 5;
  if (Math.abs(trade.price - parsedFICC.price) < 0.0001) score += 3;

  // Firm identifiers based on transaction type
  const isTradeSubmitter = trade.transaction_type === 'SELL';
  if (isTradeSubmitter) {
    if (trade.submitting_member_executing_firm_customer_id === parsedFICC.submittingFirm) score += 4;
    if (trade.member_firm_id === parsedFICC.submittingFirmId) score += 4;
    if (trade.contra_firm_executing_firm_customer_id === parsedFICC.contraFirm) score += 4;
    if (trade.contra_firm_id === parsedFICC.contraFirmId) score += 4;
  } else {
    if (trade.contra_firm_executing_firm_customer_id === parsedFICC.submittingFirm) score += 4;
    if (trade.contra_firm_id === parsedFICC.submittingFirmId) score += 4;
    if (trade.submitting_member_executing_firm_customer_id === parsedFICC.contraFirm) score += 4;
    if (trade.member_firm_id === parsedFICC.contraFirmId) score += 4;
  }

  return score;
};

const findBestMatch = (potentialMatches, tradeDetails) => {
  const scoredMatches = potentialMatches.map(trade => {
    let score = 0;

    // Net money exact match gets highest score
    if (Math.abs(trade.net_money - tradeDetails.netMoney) < 0.01) {
      score += 5;
    }

    // Price match within tolerance
    if (Math.abs(trade.price - tradeDetails.price) <= 0.0001) {
      score += 3;
    }

    // Reference number matches
    if (trade.external_reference === tradeDetails.externalRef) {
      score += 4;
    }
    if (trade.broker_reference === tradeDetails.brokerRef) {
      score += 2;
    }

    return { trade, score };
  });

  // Return the match only if it scores high enough
  scoredMatches.sort((a, b) => b.score - a.score);
  return scoredMatches[0]?.score >= 7 ? scoredMatches[0].trade : null;
};

const updateTradeWithFICCInfo = async (tradeId, ficcMessage) => {
  try {
    // First get existing message history
    const { data: existingTrade, error: fetchError } = await supabase
      .from('trades')
      .select('message_history')
      .eq('id', tradeId)
      .single();

    if (fetchError) {
      console.error('Error fetching existing trade:', fetchError);
      throw fetchError;
    }

    // Combine existing messages with new message
    const existingMessages = existingTrade.message_history || [];
    const newMessageHistory = [...existingMessages, ficcMessage];

    // Create the update data
    const updateData = {
      ficc_status: getFICCStatus(ficcMessage),
      external_reference: getFICCReference(ficcMessage),
      message_history: JSON.stringify(newMessageHistory)
    };

    const { data, error } = await supabase
      .from('trades')
      .update(updateData)
      .eq('id', tradeId)
      .select();

    if (error) {
      console.error('Error updating trade with FICC info:', error);
      throw error;
    }

    console.log('✅ Successfully updated trade:', tradeId);
    return data;
  } catch (error) {
    console.error('❌ Error updating trade:', error);
    throw error;
  }
};

const getComparisonStatus = (message) => {
  if (message.messageType === '509') {
    if (message.status?.type?.includes('MACH')) return 'Matched';
    if (message.status?.type?.includes('REJT')) return 'Rejected';
    if (message.status?.type?.includes('PACK')) return 'Accepted';
  }
  return 'Pending';
};

export const getTradeWithAge = async (tradeId) => {
  const { data, error } = await supabase
    .from('trades')
    .select(`
      *,
      age:get_trade_age(trades)
    `)
    .eq('id', tradeId)
    .single();

  if (error) {
    console.error('Error fetching trade:', error);
    return null;
  }

  return data;
};

export const getTradeComparison = async (tradeId) => {
  const { data: trade, error } = await supabase
    .from('trade_comparison_view')
    .select('*')
    .eq('trade_id', tradeId)
    .single();

  if (error) {
    console.error('Error fetching trade comparison:', error);
    return null;
  }

  console.log('Trade data from view:', trade);

  const internal = {
    trade_date: trade.trade_date,
    settlement_date: trade.settlement_date,
    cusip: trade.cusip,
    price: trade.price,
    quantity: trade.quantity,
    amount: trade.amount,
    transaction_type: trade.transaction_type,
    executing_firm: trade.executing_firm,
    contra_executing_firm: trade.contra_executing_firm,
    dtc_number: trade.dtc_number
  };

  // Parse FICC message content if available
  const ficcMessage = trade.message_content;
  const ficc = {
    trade_date: ficcMessage?.CONFDET?.['98A']?.['TRAD'] 
      ? formatDate(ficcMessage.CONFDET['98A']['TRAD']) 
      : trade.ficc_trade_date,
    settlement_date: ficcMessage?.CONFDET?.['98A']?.['SETT']
      ? formatDate(ficcMessage.CONFDET['98A']['SETT'])
      : trade.ficc_settlement_date,
    cusip: ficcMessage?.CONFDET?.['35B']?.['CUSIP'] || trade.ficc_cusip,
    price: parseFloat(ficcMessage?.CONFDET?.['90A']?.['DEAL']?.replace(',', '.')) || trade.ficc_price,
    quantity: parseInt(ficcMessage?.CONFDET?.['36B']?.['SETT']?.split('/')[1]) || trade.ficc_quantity,
    amount: trade.ficc_amount,
    transaction_type: trade.ficc_transaction_type,
    executing_firm: ficcMessage?.CONFDET?.['95P']?.['SELL'] || trade.ficc_executing_firm,
    contra_executing_firm: ficcMessage?.CONFDET?.['95P']?.['BUYR'] || trade.ficc_contra_executing_firm,
    dtc_number: ficcMessage?.CONFDET?.['95R']?.['SELL'] || trade.ficc_dtc_number
  };

  return {
    internal,
    ficc,
    differences: findDifferences(internal, ficc)
  };
};

// Helper function to format date from YYYYMMDD to YYYY-MM-DD
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
};

export const findDifferences = (internal, ficc) => {
  const differences = [];
  
  if (!ficc) return ['No FICC message found'];

  // Compare fields
  if (internal.quantity !== ficc.quantity) {
    differences.push({
      field: 'quantity',
      internal: internal.quantity,
      ficc: ficc.quantity
    });
  }

  if (Math.abs(internal.price - ficc.price) > 0.0001) {
    differences.push({
      field: 'price',
      internal: internal.price,
      ficc: ficc.price
    });
  }

  // Add more field comparisons...

  return differences;
};

const getFICCStatus = (message) => {
  // Map FICC message status to internal status
  switch (message.status?.type) {
    case 'MACH':
      return 'MATCHED';
    case 'REJT':
      return 'REJECTED';
    case 'PACK':
      return 'ACCEPTED';
    default:
      return 'PENDING';
  }
};

const getFICCReference = (message) => {
  // Extract FICC reference from message
  return message.transactionId || message.external_reference || null;
};

const getCounterpartyRef = (message) => {
  // Extract counterparty reference from message
  return message.counterpartyRef || message.broker_reference || null;
};

const parseFICCMessage = (messageContent) => {
  // Handle both new and old message formats
  if (messageContent.CONFDET) {
    // Parse traditional FICC format
    return {
      cusip: messageContent.CONFDET['35B']?.CUSIP,
      quantity: parseQuantity(messageContent.CONFDET['36B']?.SETT),
      price: parsePrice(messageContent.CONFDET['90A']?.DEAL),
      tradedate: parseDate(messageContent.CONFDET['98A']?.TRAD),
      settlementdate: parseDate(messageContent.CONFDET['98A']?.SETT),
      submittingFirm: messageContent.CONFDET['95P']?.BUYR || messageContent.CONFDET['95P']?.SELL,
      submittingFirmId: messageContent.CONFDET['95R']?.BUYR || messageContent.CONFDET['95R']?.SELL,
      contraFirm: messageContent.CONFDET['95P']?.SELL || messageContent.CONFDET['95P']?.BUYR,
      contraFirmId: messageContent.CONFDET['95R']?.SELL || messageContent.CONFDET['95R']?.BUYR,
      netMoney: calculateNetMoney(parseQuantity(messageContent.CONFDET['36B']?.SETT), parsePrice(messageContent.CONFDET['90A']?.DEAL))
    };
  }

  // Handle our simulator format
  const tradeDet = messageContent.content?.tradeDet;
  if (tradeDet) {
    const quantity = tradeDet.quantity;
    const price = tradeDet.price;
    
    // Use exact field names from database
    return {
      cusip: tradeDet.cusip,
      quantity: quantity,
      price: price,
      tradedate: messageContent.tradedate || tradeDet.tradeDate,
      settlementdate: messageContent.settlementdate || tradeDet.settlementDate,
      transactionType: tradeDet.transactionType,
      submittingFirm: messageContent.content?.header?.sender,
      submittingFirmId: messageContent.submitting_member_executing_firm_customer_id,
      contraFirm: messageContent.content?.header?.receiver,
      contraFirmId: messageContent.contra_firm_id,
      netMoney: calculateNetMoney(quantity, price)
    };
  }

  return null;
};

// Helper function to calculate net money
const calculateNetMoney = (quantity, price) => {
  if (!quantity || !price) return null;
  return (quantity * price) / 100; // Price is in percentage terms
};

// Update the comparison logic to use exact field names
const compareTrades = (internalTrade, ficcMessage) => {
  const parsedFICC = parseFICCMessage(ficcMessage);
  
  console.log('Comparing trades:', {
    internal: {
      tradedate: internalTrade.tradedate,
      settlementdate: internalTrade.settlementdate,
      netMoney: internalTrade.net_money
    },
    ficc: {
      tradedate: parsedFICC.tradedate,
      settlementdate: parsedFICC.settlementdate,
      netMoney: parsedFICC.netMoney
    }
  });

  // ... rest of comparison logic
};

// Helper functions for parsing FICC format
const parseQuantity = (settString) => {
  if (!settString) return null;
  const match = settString.match(/UNIT\/(\d+)/);
  return match ? parseInt(match[1]) : null;
};

const parsePrice = (priceString) => {
  if (!priceString) return null;
  return parseFloat(priceString.replace(',', '.'));
};

const parseDate = (dateString) => {
  if (!dateString) return null;
  return `${dateString.slice(0,4)}-${dateString.slice(4,6)}-${dateString.slice(6,8)}`;
}; 