import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import './Navigation.css';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="main-nav">
      <div className="nav-left">
        <button 
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <NavLink 
            to="/" 
            className="nav-link"
            onClick={() => setIsMenuOpen(false)}
          >
            Trades
          </NavLink>
          <NavLink 
            to="/contacts" 
            className="nav-link"
            onClick={() => setIsMenuOpen(false)}
          >
            Contacts
          </NavLink>
          {process.env.NODE_ENV === 'development' && (
            <NavLink 
              to="/testing" 
              className="nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Testing
            </NavLink>
          )}
        </div>
      </div>

      <div className="nav-brand">Trade Recon</div>
    </nav>
  );
};

export default Navigation; 