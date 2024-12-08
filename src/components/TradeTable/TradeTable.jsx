import React, { useState } from 'react'
import TradeRow from './TradeRow'
import TradeFilters from '../filters/TradeFilters'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import { useTrades } from '../../hooks/useTrades'

const TradeTable = () => {
  const { trades, isLoading, error } = useTrades()
  const [filters, setFilters] = useState({
    symbol: '',
    dateRange: null,
    showBreaksOnly: false,
    counterparty: '',
    settlementStatus: ''
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const filteredTrades = trades.filter(trade => {
    if (filters.showBreaksOnly && trade.comparison_status === 'Matched') return false
    if (filters.symbol && !trade.securitysymbol.toLowerCase().includes(filters.symbol.toLowerCase())) return false
    if (filters.counterparty && !trade.counterparty.toLowerCase().includes(filters.counterparty.toLowerCase())) return false
    if (filters.settlementStatus && trade.settlement_status !== filters.settlementStatus) return false
    return true
  })

  return (
    <div className="trade-table-container">
      <TradeFilters filters={filters} onFilterChange={setFilters} />
      <table className="trade-table">
        <thead>
          <tr>
            <th></th>
            <th>Trade Date</th>
            <th>Age (Days)</th>
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
            <TradeRow key={trade.id} trade={trade} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TradeTable 