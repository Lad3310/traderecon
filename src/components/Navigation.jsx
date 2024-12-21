import { useState } from 'react';
import '../styles/Navigation.css';

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="nav-container">
      <div className="nav-header">
        <h1>Trade Recon</h1>
        <button 
          className="hamburger" 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isOpen ? '×' : '☰'}
        </button>
      </div>
      
      <nav className={`nav-menu ${isOpen ? 'visible' : ''}`}>
        <a href="/trades" className="nav-item">Trades</a>
        <a href="/contacts" className="nav-item">Contacts</a>
        <a href="/testing" className="nav-item">Testing</a>
      </nav>
    </div>
  );
}

export default Navigation; 