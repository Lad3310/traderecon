import React from 'react';
import PropTypes from 'prop-types';
import './TradeComparison.css';

const TradeComparison = ({ trade, ficcTrade }) => {
  if (!trade || !ficcTrade) {
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
      return new Date(dateString).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
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
      case 'dtc_number':
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
      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Internal Trade</th>
              <th>FICC Trade</th>
            </tr>
          </thead>
          <tbody>
            {/* Primary Matching Fields */}
            <ComparisonRow 
              label="CUSIP"
              field="cusip"
              internalValue={trade.cusip}
              ficcValue={ficcTrade.cusip}
              formatter={(v) => v || 'N/A'}
            />
            <ComparisonRow 
              label="Trade Date"
              field="trade_date"
              internalValue={trade.trade_date}
              ficcValue={ficcTrade.trade_date}
              formatter={formatDate}
            />
            <ComparisonRow 
              label="Settlement Date"
              field="settlement_date"
              internalValue={trade.settlement_date}
              ficcValue={ficcTrade.settlement_date}
              formatter={formatDate}
            />
            <ComparisonRow 
              label="Transaction Type"
              field="transaction_type"
              internalValue={trade.transaction_type}
              ficcValue={ficcTrade.transaction_type}
              formatter={(v) => v || 'N/A'}
            />

            {/* Mandatory Matching Fields */}
            <ComparisonRow 
              label="Quantity"
              field="quantity"
              internalValue={trade.quantity}
              ficcValue={ficcTrade.quantity}
              formatter={formatQuantity}
            />
            <ComparisonRow 
              label="Price"
              field="price"
              internalValue={trade.price}
              ficcValue={ficcTrade.price}
              formatter={formatPrice}
            />
            <ComparisonRow 
              label="Net Money"
              field="net_money"
              internalValue={trade.net_money}
              ficcValue={ficcTrade.net_money}
              formatter={formatCurrency}
            />

            {/* Additional Information */}
            <ComparisonRow 
              label="Executing Firm"
              field="executing_firm"
              internalValue={trade.executing_firm}
              ficcValue={ficcTrade.executing_firm}
              formatter={(v) => v || 'N/A'}
            />
            <ComparisonRow 
              label="DTC Number"
              field="dtc_number"
              internalValue={trade.dtc_number}
              ficcValue={ficcTrade.dtc_number}
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