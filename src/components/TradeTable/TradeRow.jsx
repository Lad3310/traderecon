import React, { useEffect } from 'react'
import ComparisonStatus from './ComparisonStatus'
import TradeComparison from '../TradeComparison'
import { MdEmail } from 'react-icons/md';

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

  const getDisplayStatus = (status) => {
    return status === 'PENDING' ? 'UNMATCHED' : status;
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
      <tr className={`trade-row ${className} ${trade.isPaired ? 'has-pair' : ''}`} onClick={onExpandClick}>
        <td>
          <button className="expand-button">
            {isExpanded ? '▼' : '▶'}
          </button>
        </td>
        <td>
          {trade.recordType === 'advisory' ? (
            <span className={`record-type ${trade.recordType}`}>
              Advisory
            </span>
          ) : null}
          {getPairStatus()}
        </td>
        <td>{formatDate(trade.tradedate)}</td>
        <td>{formatDate(trade.settlementdate)}</td>
        <td className="center">{trade.age || 0}</td>
        <td>{trade.cusip || 'N/A'}</td>
        <td className="right">{formatQuantity(trade.quantity)}</td>
        <td className="right">{formatMoney(trade.net_money)}</td>
        <td>{trade.transaction_type || 'N/A'}</td>
        <td>{trade.buyer_dtc || 'N/A'}</td>
        <td>{trade.seller_dtc || 'N/A'}</td>
        <td>
          <span className={`status-${(trade.comparison_status || 'UNMATCHED').toLowerCase()}`}>
            {getDisplayStatus(trade.comparison_status) || 'UNMATCHED'}
          </span>
        </td>
        <td className="actions-cell">
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEmailClick(trade, e);
            }}
            className="email-button"
            title="Send email"
          >
            <MdEmail size={20} />
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="13">
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