import React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import TradeTable from './components/TradeTable/TradeTable'
import './styles/main.css'

const queryClient = new QueryClient()

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <header>
          <h1>Trade Reconciliation Dashboard</h1>
        </header>
        <main>
          <TradeTable />
        </main>
      </div>
    </QueryClientProvider>
  )
}

export default App 