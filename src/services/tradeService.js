export const getPairedTradeDetails = async (trade) => {
  if (!trade) return null;
  
  // Get paired FICC message from comparison table
  const { data: comparison } = await supabase
    .from('trade_comparisons')
    .select(`
      ficc_messages:ficc_message_id (*)
    `)
    .eq('trade_id', trade.id)
    .single();
    
  return comparison?.ficc_messages;
}; 