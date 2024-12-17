import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aczwqiaqkgbozejmskmo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjendxaWFxa2dib3plam1za21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2MTE5OTYsImV4cCI6MjA0OTE4Nzk5Nn0.529b-Yx0ixSza3UmVoFJnNZO_6xSYYJnJ-nF-FJwQg0'

export const supabase = createClient(supabaseUrl, supabaseKey)

export const fetchInternalTrades = async () => {
  const { data, error } = await supabase
    .from('trade_comparison_view')
    .select('*')
    .order('tradedate', { ascending: false })

  if (error) throw error

  return data.map(row => ({
    id: row.trade_id,
    cusip: row.cusip,
    tradedate: row.tradedate,
    settlementdate: row.settlementdate,
    transaction_type: row.transaction_type,
    price: row.trade_price,
    quantity: row.trade_quantity,
    net_money: row.trade_net_money,
    comparison_status: row.comparison_status,
    member_firm_id: row.member_firm_id,
    submitting_member_executing_firm_customer_id: row.submitting_member_executing_firm_customer_id,
    contra_firm_id: row.contra_firm_id,
    contra_firm_executing_firm_customer_id: row.contra_firm_executing_firm_customer_id,
    pairedTrade: row.ficc_message_id ? {
      id: row.ficc_message_id,
      cusip: row.cusip,
      tradedate: row.tradedate,
      settlementdate: row.settlementdate,
      transaction_type: row.ficc_transaction_type,
      price: row.ficc_price,
      quantity: row.ficc_quantity,
      net_money: row.ficc_net_money,
      member_firm_id: row.ficc_member_firm_id,
      submitting_member_executing_firm_customer_id: row.ficc_executing_firm,
      contra_firm_id: row.ficc_contra_firm_id,
      contra_firm_executing_firm_customer_id: row.ficc_contra_executing_firm
    } : null,
    is_paired: row.is_paired,
    is_matched: row.is_matched
  }))
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