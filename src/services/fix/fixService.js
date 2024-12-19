import { supabase } from '../../lib/supabaseClient';
import { generateRandomTrade } from './fixTestData';

class FixService {
    async handleFixMessage(message) {
        try {
            const fields = this.parseFixMessage(message);
            
            const uniqueRef = `FIX${Date.now().toString().slice(-6)}`;
            
            const contraFirmId = fields.get('447');
            const contraFirmName = fields.get('448');
            
            const trade = {
                securitysymbol: fields.get('55'),
                cusip: fields.get('55'),
                quantity: parseFloat(fields.get('38')),
                price: parseFloat(fields.get('44')),
                isresolved: false,
                comparison_status: 'UNMATCHED',
                settlement_status: 'PENDING',
                ficc_status: null,
                record_id: 'FX',
                external_reference: uniqueRef,
                transaction_type: fields.get('54') === '1' ? 'BUY' : 'SELL',
                tradedate: new Date().toISOString().split('T')[0],
                settlementdate: this.getSettlementDate(),
                net_money: parseFloat(fields.get('44')) * parseFloat(fields.get('38')),
                member_firm_id: 9553,
                submitting_member_executing_firm_customer_id: 'RAJA',
                contra_firm_id: contraFirmId,
                contra_firm_executing_firm_customer_id: contraFirmName,
                source: 'FIX',
                broker_reference: fields.get('34'),
                message_history: [],
                amount: parseFloat(fields.get('44')) * parseFloat(fields.get('38'))
            };

            console.log('Processing FIX trade:', trade);

            const { data: existingTrade } = await supabase
                .from('trades')
                .select('id')
                .eq('external_reference', uniqueRef)
                .single();

            if (existingTrade) {
                throw new Error('Trade with this reference already exists');
            }

            const { data, error } = await supabase
                .from('trades')
                .insert([trade])
                .select()
                .single();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error('Error handling FIX message:', error);
            throw error;
        }
    }

    createTestMessage() {
        const testTrade = generateRandomTrade();
        const netMoney = (testTrade.price * testTrade.quantity) / 100;
        
        const fields = [
            ['8', 'FIX.4.4'],
            ['35', 'D'],
            ['49', 'RAJA'],
            ['56', 'FICC'],
            ['34', '1'],
            ['52', new Date().toISOString()],
            ['55', testTrade.cusip],
            ['38', testTrade.quantity.toString()],
            ['44', testTrade.price.toString()],
            ['54', testTrade.side === 'BUY' ? '1' : '2'],
            ['64', this.getSettlementDate()],
            ['381', netMoney.toString()],
            ['448', testTrade.contra_firm_executing_firm_customer_id],
            ['447', testTrade.contra_firm_id]
        ];

        return fields.map(([tag, value]) => `${tag}=${value}`).join('|');
    }

    parseFixMessage(message) {
        const fields = new Map();
        message.split('|').forEach(field => {
            const [tag, value] = field.split('=');
            fields.set(tag, value);
        });
        return fields;
    }

    getSettlementDate() {
        const date = new Date();
        date.setDate(date.getDate() + 2); // T+2 settlement
        return date.toISOString().split('T')[0];
    }
}

export default new FixService(); 