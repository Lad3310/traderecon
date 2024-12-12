// Service for handling FICC GSD messaging
export const formatMT515Message = (trade) => {
  return {
    header: {
      password: trade.password,
      sender: trade.senderId,
      messageType: '515/000/GSCC',
      receiver: 'GSCCTRRS'
    },
    genl: {
      seme: generateMessageRef(),
      messageFunction: 'NEWM',
      prepDateTime: new Date().toISOString()
    },
    confDetails: {
      tradeDate: trade.tradeDate,
      settlementDate: trade.settlementDate,
      price: trade.price,
      amount: trade.amount
    }
  };
};

export const formatMT509Message = (status) => {
  return {
    header: {
      password: '',
      sender: 'GSCCTRRS', 
      messageType: '509/000/GSCC',
      receiver: status.receiverId
    },
    genl: {
      seme: generateMessageRef(),
      messageFunction: 'INST',
      prepDateTime: new Date().toISOString()
    },
    status: {
      type: status.type,
      reason: status.reason
    }
  };
};

const generateMessageRef = () => {
  return Math.random().toString(36).substr(2, 9);
}; 