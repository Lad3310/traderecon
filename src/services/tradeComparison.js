export const compareTrades = (internalTrade, externalTrade) => {
  if (!internalTrade || !externalTrade) return null;

  const discrepancies = {
    price: Math.abs(internalTrade.price - externalTrade.price) > 0.01, // Allow for small decimal differences
    quantity: internalTrade.quantity !== externalTrade.quantity,
    settlementdate: new Date(internalTrade.settlementdate).getTime() !== new Date(externalTrade.settlementdate).getTime(),
    hasDiscrepancy: false,
    details: []
  };

  // Build detailed discrepancy messages
  if (discrepancies.price) {
    discrepancies.details.push(`Price: ${internalTrade.price} vs ${externalTrade.price}`);
  }
  if (discrepancies.quantity) {
    discrepancies.details.push(`Quantity: ${internalTrade.quantity} vs ${externalTrade.quantity}`);
  }
  if (discrepancies.settlementdate) {
    discrepancies.details.push(
      `Settlement: ${new Date(internalTrade.settlementdate).toLocaleDateString()} vs ${new Date(externalTrade.settlementdate).toLocaleDateString()}`
    );
  }

  discrepancies.hasDiscrepancy = discrepancies.details.length > 0;
  return discrepancies;
};

export const findMatchingTrade = (internalTrade, externalTrades) => {
  console.log('Finding match for:', {
    symbol: internalTrade.securitysymbol,
    date: internalTrade.tradedate,
    counterparty: internalTrade.counterparty
  })
  
  const match = externalTrades.find(extTrade => 
    extTrade.securitysymbol === internalTrade.securitysymbol && 
    extTrade.tradedate === internalTrade.tradedate &&
    extTrade.counterparty === internalTrade.counterparty
  )
  
  console.log('Match found:', match)
  return match
} 