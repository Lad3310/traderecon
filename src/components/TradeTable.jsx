import React, { useState, useEffect } from 'react';
import { getTradeComparison } from '../services/matchingService';

const ExpandedRow = ({ trade }) => {
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    const loadComparison = async () => {
      const data = await getTradeComparison(trade.id);
      setComparison(data);
    };
    loadComparison();
  }, [trade.id]);

  if (!comparison) return <div>Loading...</div>;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="expanded-row">
      <h3 className="comparison-title">TRADE COMPARISON</h3>
      <div className="comparison-grid">
        <div className="internal-trade">
          <h4>Internal Trade</h4>
          <div className="trade-details">
            <table className="comparison-table">
              <tbody>
                <tr>
                  <td>Trade Date:</td>
                  <td>{comparison.internal.trade_date}</td>
                </tr>
                <tr>
                  <td>Settlement:</td>
                  <td>{comparison.internal.settlement_date}</td>
                </tr>
                <tr>
                  <td>Security:</td>
                  <td>{comparison.internal.security}</td>
                </tr>
                <tr>
                  <td>CUSIP:</td>
                  <td>{comparison.internal.cusip}</td>
                </tr>
                <tr>
                  <td>Transaction Type:</td>
                  <td>{comparison.internal.transaction_type}</td>
                </tr>
                <tr>
                  <td>Price:</td>
                  <td>{comparison.internal.price?.toFixed(3)}</td>
                </tr>
                <tr>
                  <td>Quantity:</td>
                  <td>{comparison.internal.quantity?.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Amount:</td>
                  <td>{formatCurrency(comparison.internal.amount)}</td>
                </tr>
                <tr className="section-header">
                  <td colSpan="2">Buyer Information</td>
                </tr>
                <tr>
                  <td>Firm:</td>
                  <td>{comparison.internal.buyer_firm}</td>
                </tr>
                <tr>
                  <td>DTC:</td>
                  <td>{comparison.internal.buyer_dtc}</td>
                </tr>
                <tr className="section-header">
                  <td colSpan="2">Seller Information</td>
                </tr>
                <tr>
                  <td>Firm:</td>
                  <td>{comparison.internal.seller_firm}</td>
                </tr>
                <tr>
                  <td>DTC:</td>
                  <td>{comparison.internal.seller_dtc}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="ficc-trade">
          <h4>External Trade (FICC)</h4>
          <div className="trade-details">
            <table className="comparison-table">
              <tbody>
                <tr>
                  <td>Trade Date:</td>
                  <td>{comparison.ficc?.trade_date || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Settlement:</td>
                  <td>{comparison.ficc?.settlement_date || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Security:</td>
                  <td>{comparison.ficc?.security || 'N/A'}</td>
                </tr>
                <tr>
                  <td>CUSIP:</td>
                  <td>{comparison.ficc?.cusip || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Transaction Type:</td>
                  <td>{comparison.ficc?.transaction_type || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Price:</td>
                  <td>{comparison.ficc?.price?.toFixed(3) || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Quantity:</td>
                  <td>{comparison.ficc?.quantity?.toLocaleString() || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Amount:</td>
                  <td>{comparison.ficc?.amount ? formatCurrency(comparison.ficc.amount) : 'N/A'}</td>
                </tr>
                <tr className="section-header">
                  <td colSpan="2">Buyer Information</td>
                </tr>
                <tr>
                  <td>Firm:</td>
                  <td>{comparison.ficc?.buyer_firm || 'N/A'}</td>
                </tr>
                <tr>
                  <td>DTC:</td>
                  <td>{comparison.ficc?.buyer_dtc || 'N/A'}</td>
                </tr>
                <tr className="section-header">
                  <td colSpan="2">Seller Information</td>
                </tr>
                <tr>
                  <td>Firm:</td>
                  <td>{comparison.ficc?.seller_firm || 'N/A'}</td>
                </tr>
                <tr>
                  <td>DTC:</td>
                  <td>{comparison.ficc?.seller_dtc || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {comparison.differences.length > 0 && (
        <div className="differences">
          <h4>Differences</h4>
          {comparison.differences.map((diff, i) => (
            <div key={i} className="difference">
              {diff.field}: Internal({diff.internal}) vs FICC({diff.ficc})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TradeTable = ({ trades }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (tradeId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(tradeId)) {
      newExpanded.delete(tradeId);
    } else {
      newExpanded.add(tradeId);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <table className="trade-table">
      <thead>
        <tr>
          <th></th> {/* Expand/collapse column */}
          <th>Trade Date</th>
          <th>Security</th>
          <th>Price</th>
          <th>Quantity</th>
          <th>Settlement Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {trades.map(trade => (
          <React.Fragment key={trade.id}>
            <tr onClick={(e) => {
              e.stopPropagation();
              toggleRow(trade.id);
            }}>
              <td>
                {expandedRows.has(trade.id) ? '▼' : '▶'}
              </td>
              <td>{trade.tradedate}</td>
              <td>{trade.securitysymbol}</td>
              <td>{trade.price}</td>
              <td>{trade.quantity}</td>
              <td>{trade.settlementdate}</td>
              <td>{trade.comparison_status}</td>
            </tr>
            {expandedRows.has(trade.id) && (
              <tr>
                <td colSpan="7">
                  <ExpandedRow trade={trade} />
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
};

export default TradeTable; 