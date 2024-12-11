import React, { useState } from 'react'
import TradeRow from './TradeRow'
import TradeFilters from '../filters/TradeFilters'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import { useTrades } from '../../hooks/useTrades'
import { useContacts } from '../../hooks/useContacts'
import AlertModal from '../common/AlertModal'
import './TradeTable.css'

const TradeTable = () => {
  const [expandedRowId, setExpandedRowId] = useState(null)
  const { trades, isLoading, error } = useTrades()
  const { contacts } = useContacts()
  const [filters, setFilters] = useState({
    symbol: '',
    dateRange: null,
    showBreaksOnly: false,
    counterparty: '',
    settlementStatus: ''
  })
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const filteredTrades = trades.filter(trade => {
    if (filters.showBreaksOnly && trade.comparison_status === 'Matched') return false
    if (filters.symbol && !trade.securitysymbol.toLowerCase().includes(filters.symbol.toLowerCase())) return false
    if (filters.counterparty && !trade.counterparty.toLowerCase().includes(filters.counterparty.toLowerCase())) return false
    if (filters.settlementStatus && trade.settlement_status !== filters.settlementStatus) return false
    return true
  })

  const handleEmailClick = (trade, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const contact = contacts.find(
      c => c.counterparty_name.toLowerCase().trim() === trade.counterparty.toLowerCase().trim()
    );

    if (!contact) {
      setAlert({
        show: true,
        message: `No contact found for ${trade.counterparty}. Please add contact information in the Contacts page.`,
        type: 'error'
      });
      return;
    }

    if (!contact.email) {
      setAlert({
        show: true,
        message: `Contact exists for ${trade.counterparty} but no email address is set. Please update contact information.`,
        type: 'warning'
      });
      return;
    }

    const subject = `Trade Reconciliation - ${trade.securitysymbol} - ${trade.tradedate}`;
    const body = `
Hello,

Please verify the following trade details:

Trade Date: ${new Date(trade.tradedate).toLocaleDateString()}
Settlement Date: ${new Date(trade.settlementdate).toLocaleDateString()}
Security: ${trade.securitysymbol}
Price: ${trade.price.toFixed(2)}
Quantity: ${trade.quantity}
DTC Number: ${trade.dtc_number}

Please confirm if these details match your records.

Best regards,
Trade Operations
    `.trim();

    const mailtoUrl = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleExpandClick = (tradeId) => {
    setExpandedRowId(expandedRowId === tradeId ? null : tradeId);
  };

  return (
    <div className="trade-table-container">
      {alert.show && (
        <AlertModal
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ show: false, message: '', type: '' })}
        />
      )}
      <TradeFilters filters={filters} onFilterChange={setFilters} />
      <table className="trade-table">
        <thead>
          <tr>
            <th></th>
            <th>Trade Date</th>
            <th>Age</th>
            <th>Security Symbol</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Settlement Date</th>
            <th>Counterparty</th>
            <th>DTC Number</th>
            <th>Comparison Status</th>
            <th>Settlement Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTrades.map(trade => (
            <TradeRow 
              key={trade.id}
              trade={trade} 
              onEmailClick={handleEmailClick}
              isExpanded={expandedRowId === trade.id}
              onExpandClick={() => handleExpandClick(trade.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TradeTable 