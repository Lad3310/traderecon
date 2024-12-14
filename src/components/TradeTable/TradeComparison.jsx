const TradeComparison = ({ trade }) => {
  const [comparison, setComparison] = useState(null);

  // ... other code ...

  const isDifferent = (field) => {
    if (!comparison.ficc) return false;
    
    const internal = comparison.internal[field];
    const ficc = comparison.ficc[field];
    
    if (!internal || !ficc) return true;
    
    if (field === 'price') {
      return Math.abs(internal - ficc) > 0.0001;
    }
    if (field === 'amount') {
      return Math.abs(internal - ficc) > 0.01;
    }
    
    return internal.toString() !== ficc.toString();
  };

  const renderValue = (field, value) => {
    if (!value) return <span style={{ color: '#1e293b' }}>N/A</span>;
    
    // For differing values, only change the text color
    if (isDifferent(field)) {
      return <span style={{ color: '#dc2626', fontWeight: 500 }}>{value}</span>;
    }
    
    // Default black text
    return <span style={{ color: '#1e293b' }}>{value}</span>;
  };

  return (
    <div className="expanded-row">
      <div className="comparison-title">TRADE COMPARISON</div>
      <div className="comparison-grid">
        <div className="internal-trade">
          <h4>Internal Trade</h4>
          <table className="comparison-table">
            <tbody>
              <tr style={{ background: 'transparent' }}>
                <td>Trade Date:</td>
                <td>{renderValue('trade_date', formatDate(comparison.internal.trade_date))}</td>
              </tr>
              <tr>
                <td>Settlement Date:</td>
                <td>{renderValue('settlement_date', formatDate(comparison.internal.settlement_date))}</td>
              </tr>
              <tr>
                <td>CUSIP:</td>
                <td>{renderValue('cusip', comparison.internal.cusip)}</td>
              </tr>
              {/* ... other rows ... */}
            </tbody>
          </table>
        </div>
        
        <div className="ficc-trade">
          <h4>External Trade (FICC)</h4>
          <table className="comparison-table">
            <tbody>
              <tr style={{ background: 'transparent' }}>
                <td>Trade Date:</td>
                <td>{formatDate(comparison.ficc?.trade_date) || 'N/A'}</td>
              </tr>
              {/* ... other FICC rows ... */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradeComparison; 