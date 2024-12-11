import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export const useContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('contacts')
        .select('*')
        .order('counterparty_name');

      if (supabaseError) throw supabaseError;
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (newContact) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('contacts')
        .insert([newContact])
        .select();

      if (supabaseError) throw supabaseError;
      
      setContacts(prev => [...prev, data[0]]);
      return { success: true };
    } catch (err) {
      console.error('Error adding contact:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteContact = async (id) => {
    try {
      const { error: supabaseError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (supabaseError) throw supabaseError;
      
      setContacts(prev => prev.filter(contact => contact.id !== id));
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
    deleteContact,
    refreshContacts: fetchContacts
  };
}; 