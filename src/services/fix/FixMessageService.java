import quickfix.*;
import quickfix.field.*;
import { supabase } from '../../lib/supabaseClient';

public class FixMessageService {
    public static void handleFixMessage(Message message) {
        try {
            // Extract trade details from FIX message
            String cusip = message.getString(Symbol.FIELD);
            double quantity = message.getDouble(OrderQty.FIELD);
            char side = message.getChar(Side.FIELD);
            
            // Store in Supabase
            const { data, error } = await supabase
                .from('trades')
                .insert([
                    {
                        cusip: cusip,
                        quantity: quantity,
                        side: side === '1' ? 'BUY' : 'SELL',
                        source: 'FIX'
                    }
                ]);
                
            if (error) throw error;
            
        } catch (Exception e) {
            System.err.println("Error handling FIX message: " + e.getMessage());
        }
    }
} 