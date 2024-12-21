import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import './Navigation.css';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.nav-left')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  // Close menu when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMenuOpen]);

  return (
    <nav className="main-nav">
      <div className="nav-left">
        <button 
          className="menu-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <NavLink 
            to="/" 
            className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Trades
          </NavLink>
          <NavLink 
            to="/contacts" 
            className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Contacts
          </NavLink>
          {process.env.NODE_ENV === 'development' && (
            <NavLink 
              to="/testing" 
              className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
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