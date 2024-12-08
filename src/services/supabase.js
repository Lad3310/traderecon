import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aczwqiaqkgbozejmskmo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjendxaWFxa2dib3plam1za21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2MTE5OTYsImV4cCI6MjA0OTE4Nzk5Nn0.529b-Yx0ixSza3UmVoFJnNZO_6xSYYJnJ-nF-FJwQg0'

export const supabase = createClient(supabaseUrl, supabaseKey)

export const fetchInternalTrades = async () => {
  const { data, error } = await supabase
    .from('trades_with_age')
    .select('*')
    .order('tradedate', { ascending: false })

  if (error) throw error
  return data
}

export const updateTradeStatus = async (tradeId, status) => {
  const { data, error } = await supabase
    .from('trades_with_age')
    .update({ 
      isresolved: true,
      comparison_status: status 
    })
    .match({ id: tradeId })

  if (error) throw error
  return data
} 