export const TREASURY_TEST_DATA = {
    CUSIPS: [
        '912795LB1',
        '912795LR6',
        '912828FP1',
        '912828GA3'
    ],
    
    QUANTITIES: [
        1000000,
        2000000,
        2500000,
        3000000
    ],
    
    PRICES: [
        99.50,
        99.625,
        100.25,
        98.75
    ],

    // Store contra firms as pairs
    CONTRA_PAIRS: [
        { id: '9531', name: 'GSCO' },
        { id: '0187', name: 'JPMS' },
        { id: '9585', name: 'PERS' },
        { id: '9510', name: 'BOFA' },
        { id: '9552', name: 'UBSW' },
        { id: '9553', name: 'CITI' }
    ]
};

export const generateRandomTrade = () => {
    const randomItem = (array) => array[Math.floor(Math.random() * array.length)];
    
    // Get a random contra pair
    const contraPair = randomItem(TREASURY_TEST_DATA.CONTRA_PAIRS);
    
    return {
        cusip: randomItem(TREASURY_TEST_DATA.CUSIPS),
        quantity: randomItem(TREASURY_TEST_DATA.QUANTITIES),
        price: randomItem(TREASURY_TEST_DATA.PRICES),
        side: Math.random() > 0.5 ? 'BUY' : 'SELL',
        contra_firm_id: contraPair.id,
        contra_firm_executing_firm_customer_id: contraPair.name
    };
}; 