import React, { useState } from 'react';
import { useContacts } from '../../hooks/useContacts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Contacts.css';

const AddContactModal = ({ isOpen, onClose, onSubmit }) => {
  const [newContact, setNewContact] = useState({
    counterparty_name: '',
    email: '',
    phone: '',
    dtc_number: '',
    mpid: '',
    product: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(newContact);
    setNewContact({
      counterparty_name: '',
      email: '',
      phone: '',
      dtc_number: '',
      mpid: '',
      product: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h3>Add New Contact</h3>
        <form onSubmit={handleSubmit} className="add-contact-form">
          <input
            type="text"
            placeholder="Counterparty Name"
            value={newContact.counterparty_name}
            onChange={(e) => setNewContact({...newContact, counterparty_name: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={newContact.email}
            onChange={(e) => setNewContact({...newContact, email: e.target.value})}
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={newContact.phone}
            onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="DTC Number"
            value={newContact.dtc_number}
            onChange={(e) => setNewContact({...newContact, dtc_number: e.target.value})}
          />
          <input
            type="text"
            placeholder="MPID"
            value={newContact.mpid}
            onChange={(e) => setNewContact({...newContact, mpid: e.target.value})}
          />
          <input
            type="text"
            placeholder="Product"
            value={newContact.product}
            onChange={(e) => setNewContact({...newContact, product: e.target.value})}
          />
          <div className="dialog-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button">
              Add Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Contacts = () => {
  const { contacts, loading, error, addContact, deleteContact } = useContacts();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, contact: null });

  const handleAddContact = async (newContact) => {
    const result = await addContact(newContact);
    if (result.success) {
      toast.success('Contact added successfully!');
      setIsAddModalOpen(false);
    } else {
      toast.error(result.error || 'Failed to add contact');
    }
  };

  const handleDeleteClick = (contact) => {
    setDeleteConfirmation({ show: true, contact });
  };

  const handleDeleteConfirm = async () => {
    const result = await deleteContact(deleteConfirmation.contact.id);
    if (result.success) {
      toast.success('Contact deleted successfully!');
      setDeleteConfirmation({ show: false, contact: null });
    } else {
      toast.error(result.error || 'Failed to delete contact');
    }
  };

  if (loading) {
    return (
      <div className="contacts-container">
        <div className="loading-message">Loading contacts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contacts-container">
        <div className="error-message">
          <h3>Error Loading Contacts</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="contacts-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="contacts-header">
        <h2>Contacts Management</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="add-contact-button"
        >
          Add New Contact
        </button>
      </div>

      <AddContactModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddContact}
      />

      {deleteConfirmation.show && (
        <div className="dialog-overlay">
          <div className="dialog-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete the contact for {deleteConfirmation.contact.counterparty_name}?</p>
            <div className="dialog-actions">
              <button 
                className="cancel-button"
                onClick={() => setDeleteConfirmation({ show: false, contact: null })}
              >
                Cancel
              </button>
              <button 
                className="delete-button"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="contacts-list">
        {contacts.map(contact => (
          <div key={contact.id} className="contact-card">
            <h3>{contact.counterparty_name}</h3>
            <p><strong>Email:</strong> {contact.email}</p>
            <p><strong>Phone:</strong> {contact.phone}</p>
            {contact.dtc_number && <p><strong>DTC:</strong> {contact.dtc_number}</p>}
            {contact.mpid && <p><strong>MPID:</strong> {contact.mpid}</p>}
            <p><strong>Product:</strong> {contact.product}</p>
            <div className="contact-actions">
              <button className="edit-button">Edit</button>
              <button 
                className="delete-button"
                onClick={() => handleDeleteClick(contact)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Contacts; 