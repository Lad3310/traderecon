import React, { useState } from 'react'
import Navigation from './components/Navigation/Navigation'
import TradeTable from './components/TradeTable/TradeTable'
import Contacts from './components/Contacts/Contacts'
import './styles/main.css'

const App = () => {
  const [activeTab, setActiveTab] = useState('trades')

  return (
    <div className="app">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main>
        {activeTab === 'trades' && (
          <div className="section">
            <h2>Trade Reconciliation Dashboard</h2>
            <TradeTable />
          </div>
        )}
        
        {activeTab === 'contacts' && (
          <div className="section">
            <h2>Contacts Management</h2>
            <Contacts />
          </div>
        )}
      </main>
    </div>
  )
}

export default App 