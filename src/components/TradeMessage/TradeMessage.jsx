import React from 'react';
import './TradeMessage.css';

const TradeMessage = ({ message }) => {
  // Extract message type from the header
  const messageType = message.header.messageType.split('/')[0];

  const renderMessageHeader = () => {
    const { password, sender, messageType, receiver } = message.header;
    return (
      <div className="message-header">
        <div>Password: {password}</div>
        <div>Sender: {sender}</div> 
        <div>Message Type: {messageType}</div>
        <div>Receiver: {receiver}</div>
      </div>
    );
  };

  const renderGenl = () => {
    const { seme, messageFunction, prepDateTime } = message.genl;
    return (
      <div className="message-genl">
        <div>Reference: {seme}</div>
        <div>Function: {messageFunction}</div>
        <div>Prep Date/Time: {prepDateTime}</div>
      </div>
    );
  };

  const renderConfDetails = () => {
    const { tradeDate, settlementDate, price, amount } = message.confDetails || {};
    if (!message.confDetails) return null;
    
    return (
      <div className="message-conf-details">
        <div>Trade Date: {tradeDate}</div>
        <div>Settlement Date: {settlementDate}</div>
        <div>Price: {price}</div>
        <div>Amount: {amount}</div>
      </div>
    );
  };

  const renderStatus = () => {
    if (!message.status) return null;
    
    return (
      <div className={`message-status status-${getStatusClass(message.status.type)}`}>
        <div>Status: {message.status.type}</div>
        {message.status.reason && <div>Reason: {message.status.reason}</div>}
      </div>
    );
  };

  const getStatusClass = (statusType) => {
    if (statusType.includes('PACK')) return 'accepted';
    if (statusType.includes('REJT')) return 'rejected';
    return 'pending';
  };

  return (
    <div className="trade-message" data-type={`MT${messageType}`}>
      {renderMessageHeader()}
      {renderGenl()} 
      {renderConfDetails()}
      {renderStatus()}
    </div>
  );
};

export default TradeMessage; 