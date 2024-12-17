import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import './Contacts.css';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    counterparty_name: '',
    email: '',
    mpid: '',
    ficc: ''
  });

  const fetchContacts = async () => {
    try {
      console.log('Fetching contacts...');
      const { data, error: supabaseError } = await supabase
        .from('contacts')
        .select('*')
        .order('counterparty_name');
      
      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw supabaseError;
      }
      console.log('Fetched contacts:', data);
      setContacts(data || []);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Log the form data being submitted
      console.log('Form data being submitted:', formData);

      const contactData = {
        counterparty_name: formData.counterparty_name.trim(),
        email: formData.email.trim(),
        mpid: formData.mpid.trim(),
        ficc: formData.ficc.trim()
      };

      console.log('Processed contact data:', contactData);

      if (editingContact) {
        const { data, error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', editingContact.id)
          .select();

        if (error) {
          console.error('Error updating contact:', error);
          throw error;
        }
        console.log('Updated contact response:', data);
      } else {
        const { data, error } = await supabase
          .from('contacts')
          .insert([contactData])
          .select();

        if (error) {
          console.error('Error inserting contact:', error);
          throw error;
        }
        console.log('Inserted contact response:', data);
      }

      // Fetch contacts immediately after insert/update
      const { data: refreshedContacts, error: refreshError } = await supabase
        .from('contacts')
        .select('*')
        .order('counterparty_name');
      
      if (refreshError) {
        console.error('Error refreshing contacts:', refreshError);
      } else {
        console.log('Refreshed contacts:', refreshedContacts);
        setContacts(refreshedContacts);
      }

      setShowModal(false);
      setFormData({
        counterparty_name: '',
        email: '',
        mpid: '',
        ficc: ''
      });
      setEditingContact(null);
      setError(null);

    } catch (error) {
      console.error('Full error object:', error);
      setError(error.message || 'Error saving contact');
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      counterparty_name: contact.counterparty_name,
      email: contact.email,
      mpid: contact.mpid,
      ficc: contact.ficc
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchContacts();
      } catch (error) {
        console.error('Error deleting contact:', error);
        setError(error.message);
      }
    }
  };

  return (
    <div className="app-wrapper">
      <div className="contacts-dashboard">
        <div className="dashboard-header">
          <button 
            className="add-contact-button"
            onClick={() => {
              setEditingContact(null);
              setFormData({
                counterparty_name: '',
                email: '',
                mpid: '',
                ficc: ''
              });
              setShowModal(true);
            }}
          >
            + Add Contact
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : contacts.length === 0 ? (
          <p>No contacts found</p>
        ) : (
          <div className="contacts-grid">
            {contacts.map(contact => (
              <div key={contact.id} className="contact-card">
                <div className="contact-header">
                  <div className="contact-avatar">
                    {contact.counterparty_name.charAt(0)}
                  </div>
                  <div className="contact-title">
                    <h3>{contact.counterparty_name}</h3>
                    <span className="mpid-tag">{contact.mpid}</span>
                  </div>
                </div>
                <div className="contact-body">
                  <div className="contact-info">
                    <div className="info-item">
                      <span className="label">Email:</span>
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </div>
                    <div className="info-item">
                      <span className="label">FICC:</span>
                      <span>{contact.ficc || '-'}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">MPID:</span>
                      <span>{contact.mpid || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="contact-actions">
                  <button className="edit-btn" onClick={() => handleEdit(contact)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(contact.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div 
            className="modal-overlay" 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
              }
            }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingContact ? 'Edit Contact' : 'Add Contact'}</h2>
              </div>
              
              {error && (
                <div className="modal-error">
                  {error}
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit(e);
              }} className="modal-form">
                <div className="form-group">
                  <label>Counterparty Name *</label>
                  <input
                    type="text"
                    value={formData.counterparty_name}
                    onChange={(e) => setFormData({...formData, counterparty_name: e.target.value})}
                    required
                    placeholder="Enter counterparty name"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    placeholder="Enter email address"
                  />
                </div>
                <div className="form-group">
                  <label>MPID</label>
                  <input
                    type="text"
                    value={formData.mpid}
                    onChange={(e) => setFormData({...formData, mpid: e.target.value})}
                    placeholder="Enter MPID"
                  />
                </div>
                <div className="form-group">
                  <label>FICC Number</label>
                  <input
                    type="text"
                    value={formData.ficc}
                    onChange={(e) => setFormData({...formData, ficc: e.target.value})}
                    placeholder="Enter FICC number"
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="cancel-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowModal(false);
                      setError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="save-button"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {editingContact ? 'Save Changes' : 'Add Contact'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contacts; 