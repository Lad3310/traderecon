import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import './TradeComparison.css';
import { FIRM_IDENTIFIERS } from '../constants/firmIdentifiers';

// Custom tooltip component
const CustomTooltip = ({ children, title }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  return (
    <div 
      className="tooltip-container"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="tooltip-content">
          {title}
        </div>
      )}
    </div>
  );
};

const FirmIdentifierRow = ({ label, dbField, internalValue, ficcValue }) => {
  const fieldInfo = FIRM_IDENTIFIERS[dbField];
  
  return (
    <CustomTooltip 
      title={
        <div>
          <p>{fieldInfo.description}</p>
          <p>Example: {fieldInfo.example}</p>
          <p>Database field: {dbField}</p>
        </div>
      }
    >
      <tr className={internalValue !== ficcValue ? 'comparison-row different' : 'comparison-row'}>
        <td className="field-label">{label}</td>
        <td className="internal-value">{internalValue || 'N/A'}</td>
        <td className="ficc-value">{ficcValue || 'N/A'}</td>
      </tr>
    </CustomTooltip>
  );
};

const TradeComparison = ({ trade, ficcTrade }) => {
  const [isProperlySynced, setIsProperlySynced] = React.useState(true);

  // First, determine if this is an advisory record
  const isAdvisory = trade?.recordType === 'advisory';

  // For advisory records, show blank on our side and FICC message on counterparty side
  const ourDetails = isAdvisory ? null : trade;
  const counterpartyDetails = isAdvisory ? trade : ficcTrade;

  useEffect(() => {
    console.log('=== TRADE COMPARISON MOUNT ===', {
      component: 'TradeComparison',
      isAdvisory,
      tradeId: trade?.id,
      tradeDate: trade?.tradedate,
      settlementDate: trade?.settlementdate,
      recordType: trade?.recordType
    });
  }, []);

  useEffect(() => {
    console.log('=== TRADE COMPARISON IDENTITY CHECK ===', {
      tradeId: trade?.id,
      ficcTradeId: ficcTrade?.id,
      trade: {
        rawTradeDate: trade?.tradedate,
        rawSettlementDate: trade?.settlementdate,
      },
      ficcTrade: {
        rawTradeDate: ficcTrade?.tradedate,
        rawSettlementDate: ficcTrade?.settlementdate,
      }
    });
  }, [trade, ficcTrade]);

  useEffect(() => {
    console.log('=== TRADE COMPARISON DATA ===');
    console.log('Parent Trade:', {
      tradedate: trade?.tradedate,
      settlementdate: trade?.settlementdate,
      recordType: trade?.recordType,
      cusip: trade?.cusip
    });
    console.log('FICC Trade:', {
      tradedate: ficcTrade?.tradedate,
      settlementdate: ficcTrade?.settlementdate,
      recordType: ficcTrade?.recordType,
      cusip: ficcTrade?.cusip
    });
    console.log('=== END COMPARISON DATA ===');
  }, [trade, ficcTrade]);

  useEffect(() => {
    console.log('=== TRADE COMPARISON FULL DATA ===');
    console.log('Trade Details:', {
      id: trade?.id,
      cusip: trade?.cusip,
      tradedate: trade?.tradedate,
      settlementdate: trade?.settlementdate,
      transaction_type: trade?.transaction_type,
      recordType: trade?.recordType
    });
    console.log('FICC Trade Details:', {
      id: ficcTrade?.id,
      cusip: ficcTrade?.cusip,
      tradedate: ficcTrade?.tradedate,
      settlementdate: ficcTrade?.settlementdate,
      transaction_type: ficcTrade?.transaction_type,
      recordType: ficcTrade?.recordType
    });
    console.log('=== END TRADE COMPARISON FULL DATA ===');
  }, [trade, ficcTrade]);

  useEffect(() => {
    console.log('=== TRADE PAIRING CRITERIA ===');
    console.log('Internal Trade:', {
      id: trade?.id,
      cusip: trade?.cusip,
      tradedate: trade?.tradedate,
      settlementdate: trade?.settlementdate,
      transaction_type: trade?.transaction_type,
      isPaired: trade?.isPaired
    });
    console.log('FICC Trade:', {
      id: ficcTrade?.id,
      cusip: ficcTrade?.cusip,
      tradedate: ficcTrade?.tradedate,
      settlementdate: ficcTrade?.settlementdate,
      transaction_type: ficcTrade?.transaction_type
    });
    console.log('Pairing Criteria Met:', {
      sameCusip: trade?.cusip === ficcTrade?.cusip,
      sameTradeDate: trade?.tradedate === ficcTrade?.tradedate,
      sameSettleDate: trade?.settlementdate === ficcTrade?.settlementdate,
      oppositeTypes: (trade?.transaction_type === 'BUY' && ficcTrade?.transaction_type === 'SELL') ||
                    (trade?.transaction_type === 'SELL' && ficcTrade?.transaction_type === 'BUY')
    });
    console.log('=== END PAIRING CRITERIA ===');
  }, [trade, ficcTrade]);

  useEffect(() => {
    console.log('=== TRADE COMPARISON RAW DATES ===', {
      trade: {
        rawTradeDate: trade?.tradedate,
        rawSettlementDate: trade?.settlementdate,
        formattedTradeDate: formatDate(trade?.tradedate),
        formattedSettlementDate: formatDate(trade?.settlementdate)
      },
      ficcTrade: {
        rawTradeDate: ficcTrade?.tradedate,
        rawSettlementDate: ficcTrade?.settlementdate,
        formattedTradeDate: formatDate(ficcTrade?.tradedate),
        formattedSettlementDate: formatDate(ficcTrade?.settlementdate)
      }
    });
  }, [trade, ficcTrade]);

  useEffect(() => {
    // Validate pairing criteria
    const validatePairing = () => {
      if (!trade || !ficcTrade) return;
      
      const synced = 
        trade.cusip === ficcTrade.cusip &&
        trade.tradedate === ficcTrade.tradedate &&
        trade.settlementdate === ficcTrade.settlementdate &&
        ((trade.transaction_type === 'BUY' && ficcTrade.transaction_type === 'SELL') ||
         (trade.transaction_type === 'SELL' && ficcTrade.transaction_type === 'BUY'));

      setIsProperlySynced(synced);

      if (!synced) {
        console.error('=== TRADE PAIRING MISMATCH ===', {
          internalTrade: {
            id: trade.id,
            cusip: trade.cusip,
            tradedate: trade.tradedate,
            settlementdate: trade.settlementdate,
            transaction_type: trade.transaction_type
          },
          ficcTrade: {
            id: ficcTrade.id,
            cusip: ficcTrade.cusip,
            tradedate: ficcTrade.tradedate,
            settlementdate: ficcTrade.settlementdate,
            transaction_type: ficcTrade.transaction_type
          },
          mismatches: {
            cusip: trade.cusip !== ficcTrade.cusip,
            tradeDate: trade.tradedate !== ficcTrade.tradedate,
            settlementDate: trade.settlementdate !== ficcTrade.settlementdate,
            oppositeTypes: !((trade.transaction_type === 'BUY' && ficcTrade.transaction_type === 'SELL') ||
                           (trade.transaction_type === 'SELL' && ficcTrade.transaction_type === 'BUY'))
          }
        });
      }
    };

    validatePairing();
  }, [trade, ficcTrade]);

  useEffect(() => {
    console.log('=== TRADE TYPE CHECK ===', {
      recordType: trade?.recordType,
      isAdvisory: trade?.recordType === 'advisory',
      trade: {
        id: trade?.id,
        tradedate: trade?.tradedate,
        settlementdate: trade?.settlementdate,
        transaction_type: trade?.transaction_type
      }
    });
  }, [trade]);

  useEffect(() => {
    console.log('=== TRADE COMPARISON DATE CHECK ===', {
      parentTrade: {
        id: trade?.id,
        tradeDate: trade?.tradedate,
        settlementDate: trade?.settlementdate
      },
      ficcTrade: {
        id: ficcTrade?.id,
        tradeDate: ficcTrade?.tradedate,
        settlementDate: ficcTrade?.settlementdate
      }
    });
  }, [trade, ficcTrade]);

  useEffect(() => {
    console.log('=== TRADE DATE VALIDATION ===', {
      receivedDates: {
        tradedate: trade?.tradedate,
        settlementdate: trade?.settlementdate,
        raw_trade: trade // Log the entire trade object
      },
      formattedDates: {
        tradedate: formatDate(trade?.tradedate),
        settlementdate: formatDate(trade?.settlementdate)
      }
    });
  }, [trade]);

  if (!trade) {
    return (
      <div className="expanded-row">
        <h3 className="comparison-title">TRADE COMPARISON</h3>
        <div className="comparison-message">
          No comparison data available
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const [year, month, day] = dateString.split('-');
      return `${month}/${day}/${year}`;
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatQuantity = (qty) => {
    if (!qty && qty !== 0) return 'N/A';
    return Number(qty).toLocaleString();
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'N/A';
    return Number(price).toFixed(6);
  };

  const isDifferent = (field, internal, ficc) => {
    if (!internal || !ficc) return false;
    
    switch (field) {
      case 'price':
        return Math.abs(internal - ficc) > 0.0001;
      case 'net_money':
        return Math.abs(internal - ficc) > 0.01;
      case 'quantity':
        return internal !== ficc;
      case 'transaction_type':
        return false;
      case 'executing_firm':
        return false;
      case 'clearing_number':
        return false;
      default:
        return internal.toString() !== ficc.toString();
    }
  };

  const ComparisonRow = ({ label, field, internalValue, ficcValue, formatter }) => {
    const different = isDifferent(field, internalValue, ficcValue);
    const rowClass = different ? 'comparison-row different' : 'comparison-row';
    
    return (
      <tr className={rowClass}>
        <td className="field-label">{label}</td>
        <td className="internal-value">{formatter(internalValue)}</td>
        <td className="ficc-value">{formatter(ficcValue)}</td>
      </tr>
    );
  };

  return (
    <div className="expanded-row">
      <h3 className="comparison-title">TRADE COMPARISON</h3>
      {isAdvisory && (
        <div className="advisory-notice">
          Advisory Record - No matching internal trade found
        </div>
      )}
      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th className="field-column">Field</th>
              <th className="internal-column">Our Details</th>
              <th className="counterparty-column">
                {isAdvisory ? 'Advisory Details' : 'Counterparty Details'}
              </th>
            </tr>
          </thead>
          <tbody>
            <ComparisonRow 
              label="CUSIP"
              field="cusip"
              internalValue={ourDetails?.cusip}
              ficcValue={counterpartyDetails?.cusip}
              formatter={(v) => v || 'N/A'}
            />
            <ComparisonRow 
              label="Trade Date"
              field="tradedate"
              internalValue={ourDetails?.tradedate}
              ficcValue={counterpartyDetails?.tradedate}
              formatter={formatDate}
            />
            <ComparisonRow 
              label="Settlement Date"
              field="settlementdate"
              internalValue={ourDetails?.settlementdate}
              ficcValue={counterpartyDetails?.settlementdate}
              formatter={formatDate}
            />
            <ComparisonRow 
              label="Transaction Type"
              field="transaction_type"
              internalValue={ourDetails?.transaction_type}
              ficcValue={counterpartyDetails?.transaction_type}
              formatter={(v) => v || 'N/A'}
            />
            <ComparisonRow 
              label="Quantity"
              field="quantity"
              internalValue={ourDetails?.quantity}
              ficcValue={counterpartyDetails?.quantity}
              formatter={formatQuantity}
            />
            <ComparisonRow 
              label="Price"
              field="price"
              internalValue={ourDetails?.price}
              ficcValue={counterpartyDetails?.price}
              formatter={formatPrice}
            />
            <ComparisonRow 
              label="Net Money"
              field="net_money"
              internalValue={ourDetails?.net_money}
              ficcValue={counterpartyDetails?.net_money}
              formatter={formatCurrency}
            />
            <ComparisonRow 
              label="Executing Firm"
              field="executing_firm"
              internalValue={ourDetails?.submitting_member_executing_firm_customer_id}
              ficcValue={counterpartyDetails?.contra_firm_executing_firm_customer_id}
              formatter={(v) => v || 'N/A'}
            />
            <ComparisonRow 
              label="Clearing Number"
              field="clearing_number"
              internalValue={ourDetails?.member_firm_id}
              ficcValue={counterpartyDetails?.contra_firm_id}
              formatter={(v) => v || 'N/A'}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
};

TradeComparison.propTypes = {
  trade: PropTypes.shape({
    cusip: PropTypes.string,
    trade_date: PropTypes.string,
    settlement_date: PropTypes.string,
    transaction_type: PropTypes.string,
    quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    net_money: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    executing_firm: PropTypes.string,
    dtc_number: PropTypes.string
  }),
  ficcTrade: PropTypes.shape({
    cusip: PropTypes.string,
    trade_date: PropTypes.string,
    settlement_date: PropTypes.string,
    transaction_type: PropTypes.string,
    quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    net_money: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    executing_firm: PropTypes.string,
    dtc_number: PropTypes.string
  })
};

export default TradeComparison; 