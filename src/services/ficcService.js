// FICC Message parsing constants
const BLOCK_START = ':16R:';
const BLOCK_END = ':16S:';
const TAG_PATTERN = /:([\d]{2}[A-Z]{1})::([A-Z]+)\/\/(.+)/;

export class FICCMessageParser {
  static mapCusipToSymbol(cusip) {
    // This is a simplified example - you might want to fetch this from a database
    const cusipToSymbolMap = {
      '912828HR4': 'T 2.5 24',
      '912828RT6': 'T 1.625 26'
      // Add more mappings as needed
    };
    return cusipToSymbolMap[cusip] || cusip;
  }

  static parseMessage(rawMessage) {
    const blocks = {};
    let currentBlock = null;
    
    // Split message into lines
    const lines = rawMessage.split('\n').map(line => line.trim());
    
    for (const line of lines) {
      if (line.startsWith(BLOCK_START)) {
        currentBlock = line.substring(5);
        blocks[currentBlock] = {};
      }
      else if (line.startsWith(BLOCK_END)) {
        currentBlock = null;
      }
      else if (currentBlock && line.startsWith(':')) {
        const match = line.match(TAG_PATTERN);
        if (match) {
          const [_, tag, qualifier, value] = match;
          if (!blocks[currentBlock][tag]) {
            blocks[currentBlock][tag] = {};
          }
          blocks[currentBlock][tag][qualifier] = value;
        }
      }
    }
    
    return blocks;
  }

  static validateMessage(parsedMessage, messageType) {
    const requiredTags = {
      'MT515': ['20C', '98A', '36B', '95P'],
      'MT509': ['20C', '25D'],
      'MT518': ['20C', '98A', '35B']
    };

    const required = requiredTags[messageType];
    const missing = [];

    for (const tag of required) {
      let found = false;
      for (const block in parsedMessage) {
        if (parsedMessage[block][tag]) {
          found = true;
          break;
        }
      }
      if (!found) missing.push(tag);
    }

    return {
      isValid: missing.length === 0,
      missingTags: missing
    };
  }

  static extractTradeDetails(parsedMessage) {
    try {
      const genl = parsedMessage['GENL'] || {};
      const confdet = parsedMessage['CONFDET'] || {};
      
      // Extract party information per FICC specs
      const partyInfo = {
        buyerFirm: confdet['95P']?.['BUYR'],
        buyerDTC: confdet['95R']?.['BUYR'],
        sellerFirm: confdet['95P']?.['SELL'],
        sellerDTC: confdet['95R']?.['SELL'],
      };

      return {
        trade_date: this.parseDate(confdet['98A']?.['TRAD']),
        settlement_date: this.parseDate(confdet['98A']?.['SETT']),
        securitySymbol: this.mapCusipToSymbol(confdet['35B']?.['CUSIP']),
        price: this.parseAmount(confdet['90A']?.['DEAL']),
        quantity: this.parseQuantity(confdet['36B']?.['SETT']),
        ...partyInfo,
        cusip: confdet['35B']?.['CUSIP'],
        netMoney: this.parseAmount(confdet['19A']?.['SETT']),
        transactionId: genl['20C']?.['SEME']
      };
    } catch (error) {
      console.error('Error extracting trade details:', error);
      throw new Error('Failed to extract trade details from message');
    }
  }

  static parseDate(dateStr) {
    if (!dateStr) return null;
    // Convert YYYYMMDD to ISO date
    return `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
  }

  static parseQuantity(quantityStr) {
    if (!quantityStr) return null;
    const [unit, amount] = quantityStr.split('/');
    return parseFloat(amount);
  }

  static parseAmount(amountStr) {
    if (!amountStr) return null;
    // Handle FICC money format (remove currency code if present)
    const cleanAmount = amountStr.replace(/[A-Z]{3}/, '').trim();
    return parseFloat(cleanAmount.replace(',', '.'));
  }

  static getPrimaryMatchingFields(parsedMessage) {
    const confdet = parsedMessage['CONFDET'] || {};
    const genl = parsedMessage['GENL'] || {};
    
    return {
      // Trade Identifiers
      cusip: confdet['35B']?.['CUSIP'],          // Security identifier
      tradeDate: this.parseDate(confdet['98A']?.['TRAD']), // Trade date
      settlementDate: this.parseDate(confdet['98A']?.['SETT']), // Settlement date
      quantity: this.parseQuantity(confdet['36B']?.['SETT']), // Trade quantity
      netMoney: this.parseAmount(confdet['19A']?.['SETT']), // Settlement amount
      
      // Party Information
      counterparty: confdet['95P']?.['BUYR'] || confdet['95P']?.['SELL'], // Counterparty ID
      
      // Reference Numbers
      externalRef: genl['20C']?.['SEME'],        // Sender's reference
      brokerRef: confdet['20C']?.['PROC']        // Broker's reference if applicable
    };
  }

  static async processMessage(message, messageType) {
    try {
      console.log('Processing message in FICCParser:', { message, messageType });
      
      // Since we're already getting a structured message, no need to parse
      if (typeof message === 'object') {
        return {
          messageType: messageType,
          header: message.header,
          status: message.status,
          tradeDet: message.tradeDet,
          // Add any other fields you need
        };
      }

      // Keep the old parsing logic for backward compatibility
      if (typeof message === 'string') {
        const parsedMessage = this.parseMessage(message);
        const validation = this.validateMessage(parsedMessage, messageType);
        
        if (!validation.isValid) {
          throw new Error(`Invalid message: Missing required tags: ${validation.missingTags.join(', ')}`);
        }

        return this.extractTradeDetails(parsedMessage);
      }

      throw new Error('Invalid message format');
    } catch (error) {
      console.error('Error in FICCMessageParser:', error);
      throw error;
    }
  }
}

// Message formatting for outbound messages
export const formatMT515Message = (trade) => {
  return `${BLOCK_START}GENL
:20C::SEME//${trade.transactionId}
:23G:NEWM
:98C::PREP//${formatDateTime(new Date())}
${BLOCK_END}GENL
${BLOCK_START}CONFDET
:98A::TRAD//${formatDate(trade.tradeDate)}
:98A::SETT//${formatDate(trade.settlementDate)}
:35B:${trade.cusip}
:36B::SETT//UNIT/${trade.quantity}
:90A::DEAL//PRCT/${formatPrice(trade.price)}
:95P::BUYR//${trade.buyerFirm}
:95R::BUYR//${trade.buyerDTC}
:95P::SELL//${trade.sellerFirm}
:95R::SELL//${trade.sellerDTC}
${BLOCK_END}CONFDET`;
};

const formatDate = (date) => {
  return date.replace(/-/g, '');
};

const formatDateTime = (date) => {
  return date.toISOString().replace(/[-:]/g, '').slice(0, 14);
};

const formatPrice = (price) => {
  return price.toFixed(4).replace('.', ',');
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