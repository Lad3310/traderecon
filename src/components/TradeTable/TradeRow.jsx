import React, { useEffect, useState } from 'react'
import ComparisonStatus from './ComparisonStatus'
import TradeComparison from './TradeComparison.jsx'
import { MdEmail } from 'react-icons/md';
import { FaEnvelope } from 'react-icons/fa';
import { calculateBusinessDays } from '../../utils/dateUtils';
import { supabase } from '../../config/supabaseClient';
import AlertDialog from '../common/AlertDialog';

const TradeRow = ({ trade, className, onEmailClick, isExpanded, onExpandClick }) => {
  const [contactEmail, setContactEmail] = useState(null);
  const [contactError, setContactError] = useState(null);
  const [alertDialog, setAlertDialog] = useState({ show: false, message: '', type: 'error' });

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
    if (trade.recordType === 'advisory') {
      return 'UNMATCHED';
    }
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

  const getContraValue = () => {
    return trade.contra_firm_id || 'N/A';
  };

  const getAge = () => {
    return calculateBusinessDays(trade.settlementdate);
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

  const age = getAge();

  const handleEmailClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const ficcNumber = getContraValue();

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('email, counterparty_name')
        .eq('ficc', ficcNumber)
        .single();

      if (error || !data) {
        setAlertDialog({
          show: true,
          message: `No contact found for FICC ${ficcNumber}. Please add contact information in the Contacts page.`,
          type: 'error'
        });
        return;
      }

      const subject = `Trade Reconciliation - ${trade.cusip} - ${formatDate(trade.tradedate)}`;
      const body = `
Hello,

Please verify the following trade details:

Trade Date: ${formatDate(trade.tradedate)}
Settlement Date: ${formatDate(trade.settlementdate)}
Security: ${trade.cusip}
Price: ${trade.price ? trade.price.toFixed(2) : 'N/A'}
Quantity: ${trade.quantity ? trade.quantity.toLocaleString() : 'N/A'}
FICC Number: ${ficcNumber}

Please confirm if these details match your records.

Best regards,
Trade Operations
`.trim();

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = `mailto:${data.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Simulate click and remove the element
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Error handling email click:', err);
      setAlertDialog({
        show: true,
        message: 'Error finding contact information. Please try again.',
        type: 'error'
      });
    }
  };

  return (
    <React.Fragment>
      <tr 
        className={`main-row ${isExpanded ? 'expanded' : ''} ${className}`}
        data-age={age}
      >
        <td className="center">
          <button className="expand-button" onClick={onExpandClick}>
            {isExpanded ? '▼' : '▶'}
          </button>
        </td>
        <td className="left">{getTypeDisplay()}</td>
        <td className="center">{formatDate(trade.tradedate)}</td>
        <td className="center">{formatDate(trade.settlementdate)}</td>
        <td className="center">
          {age > 0 ? <span>{age}</span> : age}
        </td>
        <td className="left">{trade.cusip}</td>
        <td className="right">{formatQuantity(trade.quantity)}</td>
        <td className="right">{formatMoney(trade.net_money)}</td>
        <td className="center">{trade.transaction_type}</td>
        <td className="center">{getContraValue()}</td>
        <td className="right">
          <span className={getStatusClass(trade.comparison_status)}>
            {getDisplayStatus(trade.comparison_status)}
          </span>
        </td>
        <td className="right">
          <button 
            className="email-button" 
            onClick={handleEmailClick}
            title="Send reconciliation email"
          >
            <FaEnvelope size={24} />
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="12">
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
      {alertDialog.show && (
        <AlertDialog
          message={alertDialog.message}
          type={alertDialog.type}
          onClose={() => setAlertDialog({ show: false, message: '', type: 'error' })}
        />
      )}
    </React.Fragment>
  )
}

export default TradeRow 