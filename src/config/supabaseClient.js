import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey); 

export const fetchTradeData = async (cusipFilter = '', contraFilter = '', showBreaksOnly = false) => {
  let query = supabase
    .from('trades')
    .select('*')
    
  if (cusipFilter) {
    query = query.ilike('cusip', `%${cusipFilter}%`)
  }

  if (contraFilter) {
    query = query.filter('contra_firm_id::text', 'ilike', `%${contraFilter}%`)
  }

  if (showBreaksOnly) {
    query = query.not('status', 'eq', 'MATCHED')
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching trade data:', error)
    return []
  }

  return data
}