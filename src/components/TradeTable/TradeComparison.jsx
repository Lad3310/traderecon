import React, { useState, useEffect } from 'react';
import './TradeComparison.css';

const TradeComparison = ({ trade, ficcTrade }) => {
  const [comparison, setComparison] = useState({
    internal: {},
    ficc: null
  });

  useEffect(() => {
    if (trade) {
      const ficcData = trade.recordType === 'advisory' ? trade : ficcTrade;
      
      setComparison({
        internal: {
          trade_date: trade.tradedate,
          settlement_date: trade.settlementdate,
          cusip: trade.cusip,
          price: trade.price,
          quantity: trade.quantity,
          net_money: trade.net_money,
          transaction_type: trade.transaction_type,
          executing_firm: trade.submitting_member_executing_firm_customer_id || 'N/A',
          clearing_number: trade.member_firm_id || 'N/A'
        },
        ficc: {
          trade_date: trade.tradedate,
          settlement_date: trade.settlementdate,
          cusip: trade.cusip,
          transaction_type: ficcData?.transaction_type || 'N/A',
          price: ficcData?.price,
          quantity: ficcData?.quantity,
          net_money: ficcData?.net_money,
          executing_firm: trade.contra_firm_executing_firm_customer_id || 'N/A',
          clearing_number: trade.contra_firm_id || 'N/A'
        }
      });
    }
  }, [trade, ficcTrade]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const [year, month, day] = dateString.split('-');
      return `${month}/${day}/${year}`;
    } catch {
      return 'N/A';
    }
  };

  const formatMoney = (amount) => {
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

  const isDifferent = (field) => {
    if (!comparison.ficc) return false;
    
    const internal = comparison.internal[field];
    const ficc = comparison.ficc[field];
    
    if (!internal || !ficc) return true;
    
    if (field === 'price') {
      return Math.abs(internal - ficc) > 0.0001;
    }
    if (field === 'net_money') {
      return Math.abs(internal - ficc) > 0.01;
    }
    
    return internal.toString() !== ficc.toString();
  };

  if (!trade) {
    return (
      <div className="expanded-row">
        <div className="comparison-title">TRADE COMPARISON</div>
        <div className="comparison-message">No comparison data available</div>
      </div>
    );
  }

  return (
    <div className="expanded-row">
      <div className="comparison-title">
        {trade.recordType === 'advisory' ? 'ADVISORY TRADE DETAILS' : 'TRADE COMPARISON'}
      </div>
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>{trade.recordType === 'advisory' ? '' : 'Our Details'}</th>
            <th>Counterparty Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CUSIP</td>
            <td>{trade.recordType === 'advisory' ? '' : comparison.internal.cusip}</td>
            <td>{comparison.ficc?.cusip || 'N/A'}</td>
          </tr>
          <tr>
            <td>Trade Date</td>
            <td>{trade.recordType === 'advisory' ? '' : formatDate(comparison.internal.trade_date)}</td>
            <td>{formatDate(comparison.ficc?.trade_date)}</td>
          </tr>
          <tr>
            <td>Settlement Date</td>
            <td>{trade.recordType === 'advisory' ? '' : formatDate(comparison.internal.settlement_date)}</td>
            <td>{formatDate(comparison.ficc?.settlement_date)}</td>
          </tr>
          <tr>
            <td>Transaction Type</td>
            <td>{trade.recordType === 'advisory' ? '' : comparison.internal.transaction_type}</td>
            <td>{comparison.ficc?.transaction_type || 'N/A'}</td>
          </tr>
          <tr>
            <td>Quantity</td>
            <td>{trade.recordType === 'advisory' ? '' : formatQuantity(comparison.internal.quantity)}</td>
            <td>{formatQuantity(comparison.ficc?.quantity)}</td>
          </tr>
          <tr className={isDifferent('price') ? 'different' : ''}>
            <td>Price</td>
            <td>{trade.recordType === 'advisory' ? '' : formatPrice(comparison.internal.price)}</td>
            <td>{formatPrice(comparison.ficc?.price)}</td>
          </tr>
          <tr>
            <td>Net Money</td>
            <td>{trade.recordType === 'advisory' ? '' : formatMoney(comparison.internal.net_money)}</td>
            <td>{formatMoney(comparison.ficc?.net_money)}</td>
          </tr>
          <tr>
            <td>Executing Firm</td>
            <td>{trade.recordType === 'advisory' ? '' : (comparison.internal.executing_firm || 'N/A')}</td>
            <td>{comparison.ficc?.executing_firm || 'N/A'}</td>
          </tr>
          <tr>
            <td>Clearing Number</td>
            <td>{trade.recordType === 'advisory' ? '' : (comparison.internal.clearing_number || 'N/A')}</td>
            <td>{comparison.ficc?.clearing_number || 'N/A'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TradeComparison; 