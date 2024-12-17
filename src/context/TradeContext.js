export const TradeContext = React.createContext();

export const TradeProvider = ({ children }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ... state management logic

  return (
    <TradeContext.Provider value={{ trades, loading, error }}>
      {children}
    </TradeContext.Provider>
  );
}; 