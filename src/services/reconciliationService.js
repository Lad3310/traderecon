import { supabase } from '../lib/supabaseClient';
import { FICCMessageParser } from './ficcService';
import { findMatchingTrade, updateTradeWithFICCInfo } from './matchingService';

export class ReconciliationService {
  // Run daily reconciliation
  static async runDailyRecon() {
    try {
      // Get unmatched FICC messages
      const { data: unmatchedMessages, error: messageError } = await supabase
        .from('ficc_messages')
        .select('*')
        .is('matched_trade_id', null)
        .eq('status_type', 'PENDING');

      if (messageError) throw messageError;

      // Process each unmatched message
      const results = await Promise.all(
        unmatchedMessages.map(async (message) => {
          const tradeDetails = FICCMessageParser.extractTradeDetails(message.message_content);
          const matchedTrade = await findMatchingTrade(tradeDetails);
          
          if (matchedTrade) {
            await this.handleMatch(message, matchedTrade, tradeDetails);
            return { status: 'matched', messageId: message.id, tradeId: matchedTrade.id };
          }
          
          return { status: 'unmatched', messageId: message.id };
        })
      );

      // Generate reconciliation report
      return this.generateReconReport(results);

    } catch (error) {
      console.error('Error running daily recon:', error);
      throw error;
    }
  }

  // Generate reconciliation report
  static async generateReconReport(results) {
    const matched = results.filter(r => r.status === 'matched').length;
    const unmatched = results.filter(r => r.status === 'unmatched').length;

    const { data: breaks, error } = await supabase
      .from('trades')
      .select(`
        *,
        age:get_trade_age(trades)
      `)
      .eq('comparison_status', 'PENDING')
      .order('settlement_date', { ascending: false });

    if (error) throw error;

    return {
      summary: {
        totalProcessed: results.length,
        matched,
        unmatched,
        breakCount: breaks?.length || 0
      },
      breaks: breaks || []
    };
  }

  // Handle matched trades
  static async handleMatch(message, trade, tradeDetails) {
    const updates = [];
    
    // Update FICC message
    updates.push(
      supabase
        .from('ficc_messages')
        .update({
          matched_trade_id: trade.id,
          status_type: 'MATCHED'
        })
        .eq('id', message.id)
    );

    // Update trade
    updates.push(
      updateTradeWithFICCInfo(trade.id, tradeDetails)
    );

    await Promise.all(updates);
  }
} 