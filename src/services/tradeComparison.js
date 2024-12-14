import { supabase } from '../lib/supabaseClient';

export const compareTrades = (internalTrade, ficcTrade) => {
  if (!internalTrade || !ficcTrade) return null;

  const discrepancies = {
    isPaired: false,
    isMatched: false,
    differences: [],
    details: []
  };

  // Core matching fields (must match exactly)
  const coreFieldsMatch = 
    internalTrade.cusip === ficcTrade.cusip &&
    internalTrade.tradedate === ficcTrade.tradedate &&
    internalTrade.settlementdate === ficcTrade.settlementdate &&
    internalTrade.quantity === ficcTrade.quantity &&
    // Transaction types must be opposite
    ((internalTrade.transaction_type === 'BUY' && ficcTrade.transaction_type === 'SELL') ||
     (internalTrade.transaction_type === 'SELL' && ficcTrade.transaction_type === 'BUY'));

  // Price comparison with tolerance
  const priceMatch = Math.abs(internalTrade.price - ficcTrade.price) <= 0.0001;
  
  // Net money comparison with tolerance
  const netMoneyMatch = Math.abs(internalTrade.net_money - ficcTrade.net_money) <= 0.01;

  // Record differences
  if (!priceMatch) {
    discrepancies.differences.push({
      field: 'price',
      internal: internalTrade.price,
      ficc: ficcTrade.price
    });
  }

  if (!netMoneyMatch) {
    discrepancies.differences.push({
      field: 'net_money',
      internal: internalTrade.net_money,
      ficc: ficcTrade.net_money
    });
  }

  // Set match status
  discrepancies.isPaired = coreFieldsMatch;
  discrepancies.isMatched = coreFieldsMatch && priceMatch && netMoneyMatch;

  return discrepancies;
};

// Update the trade status in the database
const updateTradeStatus = async (tradeId, status) => {
  const { error } = await supabase
    .from('trades')
    .update({ 
      comparison_status: status,
      isresolved: status === 'MATCHED'
    })
    .eq('id', tradeId);

  if (error) {
    console.error('Error updating trade status:', error);
    throw error;
  }
};

// Main function to process trade comparison
export const processTradePairing = async (trade, ficcTrade) => {
  const comparison = compareTrades(trade, ficcTrade);
  
  if (comparison) {
    const status = comparison.isMatched ? 'MATCHED' : 'UNMATCHED';
    await updateTradeStatus(trade.id, status);
  }

  return comparison;
};

export const findMatchingTrade = async (ficcMessage) => {
  const { data: potentialMatches } = await supabase
    .from('trades')
    .select('*')
    .eq('cusip', ficcMessage.cusip)
    .eq('trade_date', ficcMessage.trade_date)
    .eq('settlement_date', ficcMessage.settlement_date)
    .eq('transaction_type', ficcMessage.transaction_type);

  if (!potentialMatches?.length) return null;

  // Score and sort potential matches
  const scoredMatches = potentialMatches.map(trade => ({
    trade,
    score: calculateMatchScore(trade, ficcMessage)
  }));

  scoredMatches.sort((a, b) => b.score - a.score);

  return scoredMatches[0].score >= 10 ? scoredMatches[0].trade : null;
};

const calculateMatchScore = (trade, ficcMessage) => {
  let score = 0;
  const ficcDetails = extractFICCTradeDetails(ficcMessage);

  // Exact matches
  if (trade.cusip === ficcDetails.cusip) score += 5;
  if (trade.quantity === ficcDetails.quantity) score += 5;
  if (trade.counterparty === ficcDetails.contraparty) score += 4;
  
  // Price within tolerance
  if (Math.abs(trade.price - ficcDetails.price) < 0.0001) score += 3;

  // Transaction type match
  if (trade.ficc_transaction_type === ficcDetails.transactionType) score += 2;

  // Executing firm match
  if (trade.ficc_executing_firm === ficcDetails.executingFirm) score += 1;

  return score;
};

const extractFICCTradeDetails = (ficcMessage) => {
  // Extract fields based on FICC message format
  return {
    cusip: ficcMessage.cusip,
    tradeDate: ficcMessage.tradeDate,
    settlementDate: ficcMessage.settlementDate,
    price: ficcMessage.price,
    quantity: ficcMessage.quantity,
    transactionType: ficcMessage.transactionType,
    contraparty: ficcMessage.contraparty,
    executingFirm: ficcMessage.executingFirm,
    priceMethod: ficcMessage.priceMethod
  };
};

export const handleFICCDK = async (dkMessage, trade) => {
  const dkReason = dkMessage.confdet?.tpro?.dkrs;
  
  await supabase
    .from('trades')
    .update({
      ficc_status: 'DK',
      dk_reason: dkReason,
      message_history: supabase.raw('array_append(message_history, ?)', [dkMessage])
    })
    .eq('id', trade.id);

  return {
    status: 'DK',
    reason: dkReason
  };
};