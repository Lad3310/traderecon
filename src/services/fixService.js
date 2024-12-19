import { FIXParser } from 'fixparser';

class FixService {
    constructor() {
        this.parser = new FIXParser();
    }

    async handleFixMessage(message) {
        try {
            // Parse FIX message
            const parsed = this.parser.parse(message);
            
            // Extract trade details
            const trade = {
                cusip: parsed.getField(Symbol).value,
                quantity: parsed.getField(OrderQty).value,
                side: parsed.getField(Side).value === '1' ? 'BUY' : 'SELL',
                source: 'FIX'
            };

            // Store in Supabase using your existing client
            const { data, error } = await supabase
                .from('trades')
                .insert([trade]);

            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Error handling FIX message:', error);
            throw error;
        }
    }
}

export default new FixService(); 