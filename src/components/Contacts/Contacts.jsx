import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import './Contacts.css';
import AlertDialog from '../common/AlertDialog';

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
  const [alertDialog, setAlertDialog] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success',
    onConfirm: null
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

      setAlertDialog({
        show: true,
        title: 'Success',
        message: `Contact ${editingContact ? 'updated' : 'created'} successfully`,
        type: 'success'
      });

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
      setAlertDialog({
        show: true,
        title: 'Error',
        message: error.message,
        type: 'error'
      });
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

  const handleDelete = async (contact) => {
    setAlertDialog({
      show: true,
      title: 'Confirm Delete',
      message: `Are you sure you want to delete ${contact.counterparty_name}?`,
      type: 'delete',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', contact.id);

          if (error) throw error;
          
          setAlertDialog({
            show: true,
            title: 'Success',
            message: 'Contact deleted successfully',
            type: 'success'
          });
          
          fetchContacts();
        } catch (error) {
          setAlertDialog({
            show: true,
            title: 'Error',
            message: error.message,
            type: 'error'
          });
        }
      }
    });
  };

  return (
    <div className="contacts-dashboard">
      <div className="dashboard-header">
        <h1>Contacts</h1>
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
                <button className="delete-btn" onClick={() => handleDelete(contact)}>Delete</button>
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
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

      <AlertDialog
        show={alertDialog.show}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onConfirm={alertDialog.onConfirm}
        onCancel={() => setAlertDialog({ show: false })}
      />
    </div>
  );
};

export default Contacts; 