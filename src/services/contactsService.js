import { supabase } from '../lib/supabaseClient';

export const contactsService = {
  async getContacts() {
    try {
      console.log('Fetching contacts from Supabase...');
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('counterparty_name');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched contacts:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      return { success: false, error: error.message };
    }
  },

  async addContact(contact) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          counterparty_name: contact.counterparty_name,
          email: contact.email,
          mpid: contact.mpid,
          ficc: contact.ficc
        }])
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error adding contact:', error);
      return { success: false, error: error.message };
    }
  },

  async updateContact(contact) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update({
          ...contact,
          updated_at: new Date()
        })
        .eq('id', contact.id)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating contact:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteContact(id) {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting contact:', error);
      return { success: false, error: error.message };
    }
  }
}; 