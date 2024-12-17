import { supabase } from '../lib/supabaseClient';

export const compareTrades = async (internalTrade, ficcTrade) => {
  try {
    if (!internalTrade || !ficcTrade) {
      throw new Error('Missing trade data for comparison');
    }
    
    const discrepancies = {
      isPaired: true,
      isMatched: false,
      differences: [],
      details: []
    };

    // Core matching fields (must match exactly)
    const coreFieldsMatch = 
      internalTrade.cusip === ficcTrade.cusip &&
      internalTrade.tradedate === ficcTrade.tradedate &&
      internalTrade.settlementdate === ficcTrade.settlementdate &&
      internalTrade.quantity === ficcTrade.quantity;

    // Check firm identifiers match in opposite directions
    const firmIdentifiersMatch = 
      // Our submitting firm should match their contra firm
      internalTrade.submitting_member_executing_firm_customer_id === ficcTrade.contra_firm_executing_firm_customer_id &&
      internalTrade.member_firm_id === ficcTrade.contra_firm_id &&
      // Their submitting firm should match our contra firm
      internalTrade.contra_firm_executing_firm_customer_id === ficcTrade.submitting_member_executing_firm_customer_id &&
      internalTrade.contra_firm_id === ficcTrade.member_firm_id;

    // Transaction types must be opposite
    const transactionTypesMatch = 
      (internalTrade.transaction_type === 'BUY' && ficcTrade.transaction_type === 'SELL') ||
      (internalTrade.transaction_type === 'SELL' && ficcTrade.transaction_type === 'BUY');

    // Price comparison with tolerance
    const priceMatch = Math.abs(internalTrade.price - ficcTrade.price) <= 0.0001;
    
    // Net money comparison with tolerance
    const netMoneyMatch = Math.abs(internalTrade.net_money - ficcTrade.net_money) <= 0.01;

    // Record differences
    if (!firmIdentifiersMatch) {
      discrepancies.differences.push({
        field: 'firm_identifiers',
        internal: {
          submitting: `${internalTrade.submitting_member_executing_firm_customer_id}/${internalTrade.member_firm_id}`,
          contra: `${internalTrade.contra_firm_executing_firm_customer_id}/${internalTrade.contra_firm_id}`
        },
        ficc: {
          submitting: `${ficcTrade.submitting_member_executing_firm_customer_id}/${ficcTrade.member_firm_id}`,
          contra: `${ficcTrade.contra_firm_executing_firm_customer_id}/${ficcTrade.contra_firm_id}`
        }
      });
    }

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
    discrepancies.isPaired = coreFieldsMatch && firmIdentifiersMatch && transactionTypesMatch;
    discrepancies.isMatched = discrepancies.isPaired && priceMatch && netMoneyMatch;

    // Update the trade_comparisons table
    const updateComparison = async () => {
      const { error } = await supabase
        .from('trade_comparisons')
        .upsert({
          trade_id: internalTrade.id,
          ficc_message_id: ficcTrade.id,
          is_paired: true,
          is_matched: discrepancies.isMatched,
          comparison_status: discrepancies.isMatched ? 'MATCHED' : 'UNMATCHED',
          differences: discrepancies.differences
        });

      if (error) {
        console.error('Error updating trade comparison:', error);
      }
    };

    updateComparison();
    return discrepancies;
  } catch (error) {
    console.error('Trade comparison failed:', error);
    // Consider adding error reporting service
    throw error;
  }
};

export const findMatchingTrade = async (ficcMessage) => {
  // First check existing comparisons
  const { data: existingComparison } = await supabase
    .from('trade_comparisons')
    .select('trade_id')
    .eq('ficc_message_id', ficcMessage.id)
    .single();

  if (existingComparison) {
    const { data: trade } = await supabase
      .from('trades')
      .select('*')
      .eq('id', existingComparison.trade_id)
      .single();
    
    return trade;
  }

  // If no existing comparison, look for potential matches
  const { data: potentialMatches } = await supabase
    .from('trades')
    .select('*')
    .eq('cusip', ficcMessage.cusip)
    .eq('tradedate', ficcMessage.tradedate)
    .eq('settlementdate', ficcMessage.settlementdate);

  if (!potentialMatches?.length) return null;

  // Score and sort potential matches
  const scoredMatches = potentialMatches.map(trade => ({
    trade,
    score: calculateMatchScore(trade, ficcMessage)
  }));

  scoredMatches.sort((a, b) => b.score - a.score);
  
  if (scoredMatches[0].score >= 10) {
    // Create comparison record for the match
    await supabase
      .from('trade_comparisons')
      .insert({
        trade_id: scoredMatches[0].trade.id,
        ficc_message_id: ficcMessage.id,
        is_paired: true,
        is_matched: false // Will be updated after full comparison
      });
    
    return scoredMatches[0].trade;
  }

  return null;
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