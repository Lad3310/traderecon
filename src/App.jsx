import React from 'react'
import TradeTable from './components/TradeTable/TradeTable'
import './styles/main.css'

const App = () => {
  return (
    <div className="app">
      <header>
        <h1>Trade Reconciliation Dashboard</h1>
      </header>
      <main>
        <TradeTable />
      </main>
    </div>
  )
}

export default App 