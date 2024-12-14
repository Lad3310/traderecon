import React, { useState } from 'react'
import TradeRow from './TradeRow'
import TradeFilters from '../filters/TradeFilters'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import { useTrades } from '../../hooks/useTrades'
import { useContacts } from '../../hooks/useContacts'
import AlertModal from '../common/AlertModal'
import './TradeTable.css'
import { FaEnvelope } from 'react-icons/fa';

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
    
    const dtcNumber = trade.transaction_type === 'BUY' 
      ? trade.contra_executing_firm  // Seller's DTC for buy trades
      : trade.executing_firm;        // Buyer's DTC for sell trades
    
    if (!dtcNumber) {
      setAlert({
        show: true,
        message: 'No counterparty DTC number found for this trade.',
        type: 'error'
      });
      return;
    }

    const contact = contacts.find(c => c.dtc_number === dtcNumber);

    if (!contact) {
      setAlert({
        show: true,
        message: `No contact found for DTC ${dtcNumber}. Please add contact information in the Contacts page.`,
        type: 'error'
      });
      return;
    }

    if (!contact.email) {
      setAlert({
        show: true,
        message: `Contact exists for DTC ${dtcNumber} but no email address is set. Please update contact information.`,
        type: 'warning'
      });
      return;
    }

    const subject = `Trade Reconciliation - ${trade.cusip || 'Unknown'} - ${formatDate(trade.tradedate)}`;
    const body = `
Hello,

Please verify the following trade details:

Trade Date: ${formatDate(trade.tradedate)}
Settlement Date: ${formatDate(trade.settlementdate)}
Security: ${trade.cusip || 'N/A'}
Price: ${trade.price ? trade.price.toFixed(2) : 'N/A'}
Quantity: ${trade.quantity ? trade.quantity.toLocaleString() : 'N/A'}
DTC Number: ${dtcNumber}

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

  const getRowClassName = (record) => {
    return record.recordType === 'advisory' ? 'advisory-row' : '';
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
      <div className="table-wrapper">
        <table className="trade-table">
          <thead>
            <tr>
              <th></th>
              <th>Type</th>
              <th>Trade Date</th>
              <th>Settlement Date</th>
              <th>Age</th>
              <th>CUSIP</th>
              <th>Quantity</th>
              <th>Net Money</th>
              <th>Side</th>
              <th>Buyer DTC</th>
              <th>Seller DTC</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.map(record => (
              <TradeRow 
                key={record.id}
                trade={record}
                className={getRowClassName(record)}
                onEmailClick={handleEmailClick}
                isExpanded={expandedRowId === record.id}
                onExpandClick={() => handleExpandClick(record.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TradeTable 