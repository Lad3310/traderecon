import React, { useEffect } from 'react'
import ComparisonStatus from './ComparisonStatus'
import { updateTradeStatus } from '../../services/supabase'

const TradeRow = ({ trade, onEmailClick, isExpanded, onExpandClick }) => {
  console.log('Trade status check:', {
    actual: trade.comparison_status,
    expected: "MATCHED",
    isEqual: trade.comparison_status === "MATCHED"
  })
  
  useEffect(() => {
    console.log('TradeRow mounted/updated:', {
      symbol: trade.securitysymbol,
      status: trade.comparison_status,
      isExpanded
    })
  }, [trade, isExpanded])

  const hasMatchingTrade = trade.comparison_status?.toUpperCase() === "MATCHED"
  
  console.log('Trade data:', {
    trade,
    hasMatchingTrade,
    comparison_status: trade.comparison_status,
    isExpanded
  })

  const handleResolve = async () => {
    try {
      await updateTradeStatus(trade.id, 'Resolved')
    } catch (error) {
      console.error('Failed to update trade status:', error)
    }
  }

  const getCellClassName = (field) => {
    if (!trade.comparison) return ''
    return trade.comparison[field] ? 'discrepancy' : ''
  }

  const isDifferent = (field) => {
    if (!trade.matchingTrade) return false;
    return trade[field] !== trade.matchingTrade[field];
  }

  return (
    <>
      <tr 
        className={`main-row ${trade.isresolved ? 'resolved' : ''} ${isExpanded ? 'expanded' : ''}`}
        onClick={onExpandClick}
      >
        <td className="expand-cell">
          <button 
            type="button"
            className="expand-button"
            onClick={(e) => {
              e.stopPropagation();
              onExpandClick();
            }}
            disabled={!hasMatchingTrade}
          >
            <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
          </button>
        </td>
        <td>{new Date(trade.tradedate).toLocaleDateString()}</td>
        <td>{trade.age}</td>
        <td>{trade.securitysymbol}</td>
        <td className={getCellClassName('price')}>{trade.price.toFixed(2)}</td>
        <td className={getCellClassName('quantity')}>{trade.quantity}</td>
        <td>{new Date(trade.settlementdate).toLocaleDateString()}</td>
        <td>{trade.counterparty}</td>
        <td>{trade.dtc_number}</td>
        <td>
          <ComparisonStatus 
            status={trade.comparison_status} 
            isResolved={trade.isresolved}
            exceptionReason={trade.exception_reason}
          />
        </td>
        <td>{trade.settlement_status}</td>
        <td className="actions-cell">
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEmailClick(trade, e);
            }}
            className="email-button"
            title="Send email to counterparty"
          >
            ✉️
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="comparison-row">
          <td></td>
          <td colSpan="11">
            <div className="comparison-content">
              <div className="comparison-header">
                <span className="comparison-title">Trade Comparison</span>
              </div>
              <div className="comparison-grid">
                <div className="comparison-column">
                  <h4>Internal Trade</h4>
                  <div className="trade-details">
                    <div className="detail-row">
                      <span className="detail-label">Trade Date:</span>
                      <span>{new Date(trade.tradedate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Security:</span>
                      <span>{trade.securitysymbol}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Price:</span>
                      <span>{trade.price.toFixed(2)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Quantity:</span>
                      <span>{trade.quantity}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Settlement:</span>
                      <span>{new Date(trade.settlementdate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Counterparty:</span>
                      <span>{trade.counterparty}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">DTC Number:</span>
                      <span>{trade.dtc_number}</span>
                    </div>
                  </div>
                </div>
                <div className="comparison-column">
                  <h4>External Trade</h4>
                  <div className="trade-details">
                    <div className="detail-row">
                      <span className="detail-label">Trade Date:</span>
                      <span>{new Date(trade.tradedate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Security:</span>
                      <span>{trade.securitysymbol}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Price:</span>
                      <span>{trade.price.toFixed(2)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Quantity:</span>
                      <span>{trade.quantity}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Settlement:</span>
                      <span>{new Date(trade.settlementdate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Counterparty:</span>
                      <span>{trade.counterparty}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">DTC Number:</span>
                      <span>{trade.dtc_number}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default TradeRow 