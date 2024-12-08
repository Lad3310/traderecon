import React from 'react'

const TradeFilters = ({ filters, onFilterChange }) => {
  const handleSymbolChange = (e) => {
    onFilterChange({
      ...filters,
      symbol: e.target.value
    })
  }

  const handleBreaksOnlyChange = (e) => {
    onFilterChange({
      ...filters,
      showBreaksOnly: e.target.checked
    })
  }

  const handleCounterpartyChange = (e) => {
    onFilterChange({
      ...filters,
      counterparty: e.target.value
    })
  }

  return (
    <div className="trade-filters">
      <div className="filter-group">
        <label htmlFor="symbol-filter">Security Symbol</label>
        <input
          id="symbol-filter"
          type="text"
          value={filters.symbol}
          onChange={handleSymbolChange}
          placeholder="Filter by symbol..."
        />
      </div>

      <div className="filter-group">
        <label htmlFor="counterparty-filter">Counterparty</label>
        <input
          id="counterparty-filter"
          type="text"
          value={filters.counterparty}
          onChange={handleCounterpartyChange}
          placeholder="Filter by counterparty..."
        />
      </div>

      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            checked={filters.showBreaksOnly}
            onChange={handleBreaksOnlyChange}
          />
          <span>Show Breaks Only</span>
        </label>
      </div>
    </div>
  )
}

export default TradeFilters 