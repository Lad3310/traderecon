import React, { useState } from 'react';
import './Navigation.css';

const Navigation = ({ activeTab, setActiveTab }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="nav-brand">Trade Recon</div>
      
      {/* Hamburger menu for mobile */}
      <button className="hamburger" onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Navigation links */}
      <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
        <button 
          className={`nav-link ${activeTab === 'trades' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('trades');
            setIsMenuOpen(false);
          }}
        >
          Trades
        </button>
        <button 
          className={`nav-link ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('contacts');
            setIsMenuOpen(false);
          }}
        >
          Contacts
        </button>
      </div>
    </nav>
  );
};

export default Navigation; 