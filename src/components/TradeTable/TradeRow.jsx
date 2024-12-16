import React, { useEffect } from 'react'
import ComparisonStatus from './ComparisonStatus'
import TradeComparison from '../TradeComparison'
import { MdEmail } from 'react-icons/md';
import { FaEnvelope } from 'react-icons/fa';

const TradeRow = ({ trade, className, onEmailClick, isExpanded, onExpandClick }) => {
  useEffect(() => {
    console.log('=== TRADE ROW DATA FLOW ===', {
      rowDates: {
        tradedate: trade.tradedate,
        settlementdate: trade.settlementdate,
        formatted_trade_date: formatDate(trade.tradedate),
        formatted_settlement_date: formatDate(trade.settlementdate)
      },
      expandedData: {
        passedTrade: {
          tradedate: trade.tradedate,
          settlementdate: trade.settlementdate
        },
        pairedTrade: trade.pairedTrade ? {
          tradedate: trade.pairedTrade.tradedate,
          settlementdate: trade.pairedTrade.settlementdate
        } : null
      }
    });
  }, [trade, isExpanded]);

  console.log('TradeRow full data:', {
    mainTrade: {
      recordType: trade.recordType,
      tradedate: trade.tradedate,
      settlementdate: trade.settlementdate,
      cusip: trade.cusip,
      transaction_type: trade.transaction_type
    },
    pairedTradeInfo: trade.pairedTrade ? {
      tradedate: trade.pairedTrade.tradedate,
      settlementdate: trade.pairedTrade.settlementdate,
      cusip: trade.pairedTrade.cusip,
      transaction_type: trade.pairedTrade.transaction_type
    } : 'No paired trade'
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const [year, month, day] = dateString.split('-');
      return `${month}/${day}/${year}`;
    } catch {
      return 'N/A';
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

  useEffect(() => {
    if (isExpanded) {
      console.log('=== ROW EXPANSION DATA ===');
      console.log('Main Row Trade:', {
        id: trade.id,
        tradedate: trade.tradedate,
        settlementdate: trade.settlementdate,
        recordType: trade.recordType
      });
      console.log('Paired Trade:', trade.pairedTrade ? {
        id: trade.pairedTrade.id,
        tradedate: trade.pairedTrade.tradedate,
        settlementdate: trade.pairedTrade.settlementdate,
        recordType: trade.pairedTrade.recordType
      } : 'No paired trade');
      console.log('=== END ROW DATA ===');
    }
  }, [isExpanded, trade]);

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
              key={`comparison-${trade.id}`}
              trade={{
                ...trade,
                tradedate: trade.tradedate,
                settlementdate: trade.settlementdate
              }}
              ficcTrade={trade.pairedTrade}
            />
          </td>
        </tr>
      )}
    </React.Fragment>
  )
}

export default TradeRow 