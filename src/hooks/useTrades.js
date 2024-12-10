import { useState, useEffect } from 'react'
import { fetchInternalTrades } from '../services/supabase'
import { fetchExternalTrades } from '../services/tradeApi'
import { compareTrades, findMatchingTrade } from '../services/tradeComparison'

export const useTrades = () => {
  const [reconciliationData, setReconciliationData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [internalTrades, setInternalTrades] = useState(null)
  const [externalTrades, setExternalTrades] = useState(null)

  // Fetch both internal and external trades
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setIsLoading(true)
        const [internal, external] = await Promise.all([
          fetchInternalTrades(),
          fetchExternalTrades()
        ])
        setInternalTrades(internal)
        setExternalTrades(external)
      } catch (err) {
        setError(err)
        console.error('Error fetching trades:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrades()
  }, [])

  // Process trades when both are available
  useEffect(() => {
    if (internalTrades && externalTrades) {
      console.log('Internal Trades:', internalTrades)
      console.log('External Trades:', externalTrades)
      
      const comparedData = internalTrades.map(intTrade => {
        const matchingTrade = intTrade.comparison_status?.toUpperCase() === 'MATCHED' 
          ? findMatchingTrade(intTrade, externalTrades)
          : null;

        console.log(`Trade ${intTrade.securitysymbol}:`, {
          status: intTrade.comparison_status,
          hasMatch: !!matchingTrade,
          matchingTrade
        });
        
        const comparison = matchingTrade ? compareTrades(intTrade, matchingTrade) : null;
        
        return {
          ...intTrade,
          matchingTrade,
          comparison,
          hasBreak: comparison?.hasDiscrepancy || !matchingTrade
        };
      });
      
      console.log('Compared Data:', comparedData);
      setReconciliationData(comparedData);
    }
  }, [internalTrades, externalTrades]);

  console.log('Reconciliation Data:', reconciliationData)

  return {
    trades: reconciliationData,
    isLoading,
    error
  }
} 