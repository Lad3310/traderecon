// Mock data to simulate external API response
const mockExternalTrades = [
  {
    // Match for TSLA Pershing trade
    tradeId: '1',
    tradedate: '2024-11-30',
    securitysymbol: 'TSLA',
    price: 390.00,
    quantity: 1,
    settlementdate: '2024-12-01',
    counterparty: 'Pershing',
    dtc_number: '0443'
  },
  {
    // Match for SPOT Pershing trade
    tradeId: '2',
    tradedate: '2024-11-30',
    securitysymbol: 'SPOT',
    price: 498.00,
    quantity: 363,
    settlementdate: '2024-12-01',
    counterparty: 'Pershing',
    dtc_number: '0443'
  },
  {
    // Match for NET Citadel trade
    tradeId: '3',
    tradedate: '2024-11-30',
    securitysymbol: 'NET',
    price: 115.00,
    quantity: 69,
    settlementdate: '2024-12-01',
    counterparty: 'Citadel',
    dtc_number: '0388'
  },
  {
    // Match for NVDA Citadel trade
    tradeId: '4',
    tradedate: '2024-11-30',
    securitysymbol: 'NVDA',
    price: 140.00,
    quantity: 451,
    settlementdate: '2024-12-01',
    counterparty: 'Citadel',
    dtc_number: '0388'
  },
  {
    // Match for SHOP Citadel trade
    tradeId: '5',
    tradedate: '2024-11-30',
    securitysymbol: 'SHOP',
    price: 120.00,
    quantity: 319,
    settlementdate: '2024-12-01',
    counterparty: 'Citadel',
    dtc_number: '0388'
  },
  {
    // Match for SPOT Goldman Sachs trade
    tradeId: '6',
    tradedate: '2024-11-30',
    securitysymbol: 'SPOT',
    price: 498.00,
    quantity: 437,
    settlementdate: '2024-12-01',
    counterparty: 'Goldman Sachs',
    dtc_number: '0005'
  },
  {
    // Match for TSLA Goldman Sachs trade
    tradeId: '7',
    tradedate: '2024-11-30',
    securitysymbol: 'TSLA',
    price: 390.00,
    quantity: 351,
    settlementdate: '2024-12-01',
    counterparty: 'Goldman Sachs',
    dtc_number: '0005'
  }
  // No matches for Morgan Stanley and JP Morgan trades to simulate UNMATCHED status
];

export const fetchExternalTrades = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data
  return mockExternalTrades;
}; 