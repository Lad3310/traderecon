import { supabase } from '../lib/supabaseClient';
import { FICCMessageParser } from './ficcService';

export const processIncomingFICCMessage = async (rawMessage, messageType) => {
  try {
    // Parse the message
    const parsedMessage = FICCMessageParser.parseMessage(rawMessage);
    
    // Validate required tags
    const validation = FICCMessageParser.validateMessage(parsedMessage, messageType);
    if (!validation.isValid) {
      throw new Error(`Invalid message: Missing required tags: ${validation.missingTags.join(', ')}`);
    }

    // Extract trade details
    const tradeDetails = FICCMessageParser.extractTradeDetails(parsedMessage);

    // Store the FICC message
    const { error: storeError } = await supabase
      .from('ficc_messages')
      .insert({
        message_type: messageType,
        external_reference: tradeDetails.transactionId,
        trade_date: tradeDetails.tradeDate,
        settlement_date: tradeDetails.settlementDate,
        cusip: tradeDetails.security,
        quantity: tradeDetails.quantity,
        price: tradeDetails.price,
        counterparty: tradeDetails.buyer || tradeDetails.seller,
        status_type: tradeDetails.status || 'PENDING',
        message_content: parsedMessage
      });

    if (storeError) throw storeError;

    // Find matching internal trade
    const matchedTrade = await findMatchingTrade(tradeDetails);
    
    if (matchedTrade) {
      // Update FICC message with matched trade
      await supabase
        .from('ficc_messages')
        .update({ 
          matched_trade_id: matchedTrade.id,
          status_type: 'MATCHED'
        })
        .eq('external_reference', tradeDetails.transactionId);

      // Update trade with FICC info
      await updateTradeWithFICCInfo(matchedTrade.id, tradeDetails);
    }

    return {
      success: true,
      message: matchedTrade ? 'Message matched to trade' : 'Message stored without match',
      matchedTrade
    };

  } catch (error) {
    console.error('Error processing FICC message:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const findMatchingTrade = async (tradeDetails) => {
  const netMoneyTolerance = 0.01;

  // Query using required fields and party information
  const { data: potentialMatches, error } = await supabase
    .from('trades')
    .select(`
      *,
      age:get_trade_age(trades)
    `)
    .eq('trade_date', tradeDetails.tradeDate)
    .eq('securitysymbol', tradeDetails.securitySymbol)
    .eq('quantity', tradeDetails.quantity)
    .eq('settlement_date', tradeDetails.settlementDate)
    // Match on buyer/seller information
    .eq('buyer_firm', tradeDetails.buyerFirm)
    .eq('buyer_dtc', tradeDetails.buyerDTC)
    .eq('seller_firm', tradeDetails.sellerFirm)
    .eq('seller_dtc', tradeDetails.sellerDTC)
    .eq('comparison_status', 'PENDING')
    .gte('net_money', tradeDetails.netMoney - netMoneyTolerance)
    .lte('net_money', tradeDetails.netMoney + netMoneyTolerance);

  if (error) {
    console.error('Error finding matches:', error);
    return null;
  }

  return potentialMatches?.length > 1 
    ? findBestMatch(potentialMatches, tradeDetails)
    : potentialMatches?.[0] || null;
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
  const { error } = await supabase
    .from('trades')
    .update({
      ficc_status: getFICCStatus(ficcMessage),
      ficc_reference: getFICCReference(ficcMessage),
      counterparty_reference: getCounterpartyRef(ficcMessage),
      comparison_status: getComparisonStatus(ficcMessage),
      message_history: supabase.raw('array_append(message_history, ?)', [ficcMessage])
    })
    .eq('id', tradeId);

  if (error) {
    console.error('Error updating trade with FICC info:', error);
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