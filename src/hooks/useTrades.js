import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fetchAllTradesAndAdvisories } from '../services/tradeApi'

export const useTrades = () => {
  const [trades, setTrades] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadTrades = async () => {
      try {
        setIsLoading(true)
        const allTrades = await fetchAllTradesAndAdvisories()
        
        // Sort trades by date (most recent first)
        const sortedTrades = allTrades.sort((a, b) => {
          return new Date(b.trade_date) - new Date(a.trade_date)
        })

        setTrades(sortedTrades)
        setError(null)
      } catch (err) {
        console.error('Error loading trades:', err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadTrades()

    // Set up real-time subscription for trades table
    const tradesSubscription = supabase
      .channel('trades-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'trades' 
        }, 
        loadTrades
      )
      .subscribe()

    // Set up real-time subscription for ficc_messages table
    const ficcSubscription = supabase
      .channel('ficc-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ficc_messages' 
        }, 
        loadTrades
      )
      .subscribe()

    return () => {
      tradesSubscription.unsubscribe()
      ficcSubscription.unsubscribe()
    }
  }, [])

  return { trades, isLoading, error }
} 