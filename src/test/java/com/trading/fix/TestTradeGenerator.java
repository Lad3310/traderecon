import quickfix.*;
import quickfix.field.*;
import java.util.Random;

public class TestTradeGenerator {
    private static final String[] SYMBOLS = {"AAPL", "MSFT", "GOOGL", "AMZN"};
    private static final Random random = new Random();
    
    public static void main(String[] args) throws ConfigError {
        // Set up FIX initiator as before
        SessionSettings settings = new SessionSettings("config/quickfix-client.cfg");
        FixTestApplication application = new FixTestApplication();
        Initiator initiator = getInitiator(settings, application);
        initiator.start();
        
        // Generate and send test trades
        try {
            for (int i = 0; i < 10; i++) {
                sendRandomTrade(initiator);
                Thread.sleep(1000); // Wait between trades
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    private static void sendRandomTrade(Initiator initiator) throws SessionNotFound {
        quickfix.fix44.NewOrderSingle order = createRandomOrder();
        Session.sendToTarget(order, initiator.getSessions().get(0));
    }
    
    private static quickfix.fix44.NewOrderSingle createRandomOrder() {
        String symbol = SYMBOLS[random.nextInt(SYMBOLS.length)];
        char side = random.nextBoolean() ? Side.BUY : Side.SELL;
        int quantity = random.nextInt(100) * 100; // Random lot sizes
        
        quickfix.fix44.NewOrderSingle order = new quickfix.fix44.NewOrderSingle(
            new ClOrdID(String.format("ID-%d", System.currentTimeMillis())),
            new Side(side),
            new TransactTime(),
            new OrdType(OrdType.MARKET)
        );
        
        order.set(new Symbol(symbol));
        order.set(new OrderQty(quantity));
        return order;
    }
} 