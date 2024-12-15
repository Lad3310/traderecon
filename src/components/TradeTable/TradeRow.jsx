import React, { useEffect } from 'react'
import ComparisonStatus from './ComparisonStatus'
import TradeComparison from '../TradeComparison'
import { MdEmail } from 'react-icons/md';
import { FaEnvelope } from 'react-icons/fa';

const TradeRow = ({ trade, className, onEmailClick, isExpanded, onExpandClick }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  console.log('Trade data:', {
    tradedate: trade.tradedate,
    settlementdate: trade.settlementdate,
    formatted_trade_date: formatDate(trade.tradedate),
    formatted_settlement_date: formatDate(trade.settlementdate)
  });

  const formatMoney = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatQuantity = (qty) => {
    if (!qty && qty !== 0) return 'N/A';
    return Number(qty).toLocaleString();
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-unmatched';
    return `status-${status.toLowerCase()}`;
  };

  const getDisplayStatus = (status) => {
    return status || 'UNMATCHED';
  };

  const getTypeDisplay = () => {
    return (
      <>
        {trade.recordType === 'advisory' && (
          <span className="record-type advisory">
            Advisory
          </span>
        )}
        {trade.recordType !== 'advisory' && getPairStatus()}
      </>
    );
  };

  const getPairStatus = () => {
    if (trade.recordType === 'advisory') return null;
    return trade.isPaired ? (
      <span className="pair-status paired" title="Paired with FICC trade">
        <span className="pair-icon">⚯</span>
        Paired
      </span>
    ) : (
      <span className="pair-status unpaired" title="No matching FICC trade">
        <span className="pair-icon">⚮</span>
        Unpaired
      </span>
    );
  };

  return (
    <React.Fragment>
      <tr className={`main-row ${isExpanded ? 'expanded' : ''} ${className}`}>
        <td className="center">
          <button className="expand-button" onClick={onExpandClick}>
            {isExpanded ? '▼' : '▶'}
          </button>
        </td>
        <td className="left">{getTypeDisplay()}</td>
        <td className="center">{formatDate(trade.tradedate)}</td>
        <td className="center">{formatDate(trade.settlementdate)}</td>
        <td className="center">{trade.age}</td>
        <td className="left">{trade.cusip}</td>
        <td className="right">{formatQuantity(trade.quantity)}</td>
        <td className="right">{formatMoney(trade.net_money)}</td>
        <td className="center">{trade.transaction_type}</td>
        <td className="center">
          <span className={getStatusClass(trade.comparison_status)}>
            {getDisplayStatus(trade.comparison_status)}
          </span>
        </td>
        <td className="center">
          <button className="email-button" onClick={(e) => onEmailClick(trade, e)}>
            <FaEnvelope size={24} />
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="11">
            <TradeComparison 
              trade={trade.recordType === 'internal' ? trade : null}
              ficcTrade={trade.recordType === 'advisory' ? trade : trade.pairedTrade}
            />
          </td>
        </tr>
      )}
    </React.Fragment>
  )
}

export default TradeRow 