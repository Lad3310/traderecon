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
    cusip: '',
    dateRange: null,
    showBreaksOnly: false,
    contra: '',
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
    console.log('Trade:', {
      id: trade.id,
      contra_firm_id: trade.contra_firm_id,
      contraFilter: filters.contra
    });
    
    if (filters.showBreaksOnly && trade.comparison_status === 'MATCHED') return false
    const matchesCusip = !filters.cusip || 
      (trade.cusip && trade.cusip.toLowerCase().includes(filters.cusip.toLowerCase()));
    if (!matchesCusip) return false
    if (filters.contra && !trade.contra_firm_id?.toString().toLowerCase().includes(filters.contra.toLowerCase())) return false
    if (filters.settlementStatus && trade.settlement_status !== filters.settlementStatus) return false
    return true
  })

  const handleEmailClick = (trade, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const ficcNumber = trade.transaction_type === 'BUY' 
      ? trade.contra_executing_firm  // Seller's FICC for buy trades
      : trade.executing_firm;        // Buyer's FICC for sell trades
    
    if (!ficcNumber) {
      setAlert({
        show: true,
        message: 'No counterparty FICC number found for this trade.',
        type: 'error'
      });
      return;
    }

    const contact = contacts.find(c => c.ficc_number === ficcNumber);

    if (!contact) {
      setAlert({
        show: true,
        message: `No contact found for FICC ${ficcNumber}. Please add contact information in the Contacts page.`,
        type: 'error'
      });
      return;
    }

    if (!contact.email) {
      setAlert({
        show: true,
        message: `Contact exists for FICC ${ficcNumber} but no email address is set. Please update contact information.`,
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
FICC Number: ${ficcNumber}

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
      <div className="filters-section">
        <div className="filter-group">
          <label>CUSIP</label>
          <input
            type="text"
            placeholder="Filter by CUSIP"
            value={filters.cusip}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              cusip: e.target.value
            }))}
          />
        </div>

        <div className="filter-group">
          <label>Contra</label>
          <input
            type="text"
            placeholder="Filter by contra..."
            value={filters.contra}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              contra: e.target.value
            }))}
          />
        </div>

        <div className="filter-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={filters.showBreaksOnly}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                showBreaksOnly: e.target.checked
              }))}
            />
            Show Breaks Only
          </label>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="trade-table">
          <thead>
            <tr>
              <th></th>
              <th className="center">Type</th>
              <th className="center">Trade Date</th>
              <th className="center">Settlement Date</th>
              <th className="center">Age</th>
              <th className="center">CUSIP</th>
              <th className="center">Quantity</th>
              <th className="center">Net Money</th>
              <th className="center">Side</th>
              <th className="center">Contra</th>
              <th className="center">Status</th>
              <th className="center">Actions</th>
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