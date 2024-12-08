import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { fetchInternalTrades } from '../services/supabase'
import { fetchExternalTrades } from '../services/tradeApi'
import { compareTrades, findMatchingTrade } from '../services/tradeComparison'

export const useTrades = () => {
  const [reconciliationData, setReconciliationData] = useState([])

  const { 
    data: internalTrades,
    error: internalError,
    isLoading: internalLoading
  } = useQuery('internalTrades', fetchInternalTrades)

  const {
    data: externalTrades,
    error: externalError,
    isLoading: externalLoading
  } = useQuery('externalTrades', fetchExternalTrades)

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
    isLoading: internalLoading || externalLoading,
    error: internalError || externalError
  }
} 