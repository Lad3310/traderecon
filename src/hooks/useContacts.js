import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('counterparty_name');

      if (error) throw error;
      
      console.log('Fetched contacts:', data);
      setContacts(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.message);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (newContact) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          counterparty_name: newContact.counterparty_name,
          email: newContact.email,
          mpid: newContact.mpid,
          ficc: newContact.ficc
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchContacts();
      return { success: true, data };
    } catch (err) {
      console.error('Error adding contact:', err);
      return { success: false, error: err.message };
    }
  };

  const updateContact = async (contact) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(contact)
        .eq('id', contact.id)
        .select()
        .single();

      if (error) throw error;
      await fetchContacts();
      return { success: true, data };
    } catch (err) {
      console.error('Error updating contact:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteContact = async (id) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchContacts();
      return { success: true };
    } catch (err) {
      console.error('Error deleting contact:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    refetch: fetchContacts
  };
}; 