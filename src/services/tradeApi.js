import { supabase } from '../lib/supabaseClient';

export const fetchAllTradesAndAdvisories = async () => {
  const [tradesResult, ficcResult] = await Promise.all([
    supabase.from('trades').select('*'),
    supabase.from('ficc_messages').select('*')
  ]);

  if (tradesResult.error) throw tradesResult.error;
  if (ficcResult.error) throw ficcResult.error;

  console.log('FICC Messages:', ficcResult.data);
  console.log('Internal Trades:', tradesResult.data);

  // First, process FICC messages and create a lookup map
  const ficcMap = new Map();
  ficcResult.data.forEach(ficc => {
    const key = `${ficc.cusip}-${ficc.tradedate}-${ficc.settlementdate}`;
    console.log('FICC Key:', key, 'FICC Record:', {
      cusip: ficc.cusip,
      tradedate: ficc.tradedate,
      settlementdate: ficc.settlementdate,
      transaction_type: ficc.transaction_type
    });
    if (!ficcMap.has(key)) {
      ficcMap.set(key, []);
    }
    ficcMap.get(key).push(ficc);
  });

  // Process internal trades and find their pairs
  const internalTrades = await Promise.all(tradesResult.data.map(async trade => {
    const key = `${trade.cusip}-${trade.tradedate}-${trade.settlementdate}`;
    const potentialMatches = ficcMap.get(key) || [];
    
    // Find pairing based on core fields only
    const pairedFicc = potentialMatches.find(ficc => 
      // Core pairing fields
      trade.cusip === ficc.cusip &&
      trade.tradedate === ficc.tradedate &&
      trade.settlementdate === ficc.settlementdate &&
      trade.quantity === ficc.quantity &&
      // Opposite transaction types
      ((trade.transaction_type === 'BUY' && ficc.transaction_type === 'SELL') ||
       (trade.transaction_type === 'SELL' && ficc.transaction_type === 'BUY'))
    );

    // Initialize matching variables
    let priceMatch = false;
    let netMoneyMatch = false;
    let isMatched = false;

    if (pairedFicc) {
      // Remove paired FICC message from the map
      const updatedMatches = potentialMatches.filter(f => f.id !== pairedFicc.id);
      if (updatedMatches.length === 0) {
        ficcMap.delete(key);
      } else {
        ficcMap.set(key, updatedMatches);
      }

      // Check matching fields for status
      priceMatch = Math.abs(trade.price - pairedFicc.price) <= 0.0001;
      netMoneyMatch = Math.abs(trade.net_money - pairedFicc.net_money) <= 0.01;
      isMatched = priceMatch && netMoneyMatch;

      // Update trade status
      await supabase
        .from('trades')
        .update({ 
          comparison_status: isMatched ? 'MATCHED' : 'UNMATCHED',
          isresolved: isMatched
        })
        .eq('id', trade.id);
    }

    return {
      ...trade,
      recordType: 'internal',
      displayStatus: pairedFicc ? (priceMatch && netMoneyMatch ? 'MATCHED' : 'UNMATCHED') : trade.comparison_status,
      pairedTrade: pairedFicc || null,
      isPaired: !!pairedFicc
    };
  }));

  // Remaining FICC messages become advisories
  const advisories = Array.from(ficcMap.values())
    .flat()
    .map(ficcMsg => ({
      ...ficcMsg,
      recordType: 'advisory',
      displayStatus: 'Advisory',
      id: `ficc-${ficcMsg.id}`,
      isPaired: false
    }));

  return [...internalTrades, ...advisories];
};

export const getFICCMatch = async (trade) => {
  if (!trade) return null;

  const { data: matches } = await supabase
    .from('ficc_messages')
    .select('*')
    .eq('cusip', trade.cusip)
    .eq('tradedate', trade.tradedate)
    .eq('settlementdate', trade.settlementdate)
    .eq('transaction_type', trade.transaction_type);

  if (!matches?.length) return null;

  // Return the best matching FICC trade
  return matches[0];
}; 