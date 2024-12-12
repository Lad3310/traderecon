import { supabase } from '../lib/supabaseClient';

const getFICCStatus = (message) => {
  if (message.messageType === '509') {
    return message.status?.type || 'PENDING';
  }
  return 'PENDING';
};

const getFICCReference = (message) => {
  return message.genl?.seme || null;
};

const getCounterpartyRef = (message) => {
  if (message.confDetails) {
    // For MT515/MT518 messages
    const buyerParty = message.confDetails.parties?.find(p => p.role === 'BUYR');
    const sellerParty = message.confDetails.parties?.find(p => p.role === 'SELL');
    return buyerParty?.reference || sellerParty?.reference;
  }
  return null;
};

export const matchTradeToFICCMessage = async (message) => {
  // First store the message
  const { error: insertError } = await supabase
    .from('ficc_messages')
    .insert({
      message_type: message.header.messageType.split('/')[0],
      sender: message.header.sender,
      receiver: message.header.receiver,
      reference_id: message.genl?.seme,
      trade_reference: message.genl?.references?.find(r => r.qualifier === 'MAST')?.reference,
      message_function: message.genl?.messageFunction,
      status_type: message.status?.type,
      message_content: message,
      created_at: new Date().toISOString(),
      is_processed: false
    });

  if (insertError) {
    console.error('Error storing FICC message:', insertError);
    return null;
  }

  // Extract key matching fields from FICC message
  const {
    tradeDate,
    settlementDate,
    price,
    quantity,
    cusip,
    counterparty
  } = extractTradeDetails(message);

  // Query our trades table for potential matches
  const { data: potentialMatches, error } = await supabase
    .from('trades')
    .select('*')
    .eq('tradedate', tradeDate)
    .eq('settlementdate', settlementDate)
    .eq('cusip', cusip)
    // Add tolerance for price/amount matching
    .gte('price', price * 0.9999)
    .lte('price', price * 1.0001);

  if (error) {
    console.error('Error finding matches:', error);
    return null;
  }

  // Find best match using additional criteria
  const bestMatch = findBestMatch(potentialMatches, message);
  
  if (bestMatch) {
    // Update trade with FICC information
    await updateTradeWithFICCInfo(bestMatch.id, message);
    
    // Update ficc_message with matched trade
    await supabase
      .from('ficc_messages')
      .update({ 
        matched_trade_id: bestMatch.id,
        is_processed: true
      })
      .eq('reference_id', message.genl?.seme);

    return bestMatch;
  }

  return null;
};

const extractTradeDetails = (message) => {
  const confDetails = message.confDetails || {};
  return {
    tradeDate: confDetails.tradeDate,
    settlementDate: confDetails.settlementDate,
    price: confDetails.price,
    quantity: confDetails.quantity || (confDetails.amount / confDetails.price), // Calculate quantity if not provided
    cusip: confDetails.security,
    counterparty: confDetails.parties?.find(p => 
      p.role === (message.header.sender === 'GSCCTRRS' ? 'BUYR' : 'SELL')
    )?.id
  };
};

const findBestMatch = (potentialMatches, ficcMessage) => {
  if (!potentialMatches || potentialMatches.length === 0) return null;

  // If only one match, return it
  if (potentialMatches.length === 1) return potentialMatches[0];

  // Score each potential match
  const scoredMatches = potentialMatches.map(trade => {
    let score = 0;
    const messageDetails = extractTradeDetails(ficcMessage);

    // Exact quantity match
    if (trade.quantity === messageDetails.quantity) score += 5;

    // Price match within tolerance
    if (Math.abs(trade.price - messageDetails.price) < 0.0001) score += 3;

    // Counterparty match
    if (trade.counterparty === messageDetails.counterparty) score += 4;

    // CUSIP match
    if (trade.cusip === messageDetails.cusip) score += 5;

    // Date matches
    if (trade.tradedate.toISOString().split('T')[0] === messageDetails.tradeDate) score += 2;
    if (trade.settlementdate.toISOString().split('T')[0] === messageDetails.settlementDate) score += 2;

    return { trade, score };
  });

  // Sort by score descending
  scoredMatches.sort((a, b) => b.score - a.score);

  // Return the trade with highest score if it meets minimum threshold
  return scoredMatches[0].score >= 10 ? scoredMatches[0].trade : null;
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