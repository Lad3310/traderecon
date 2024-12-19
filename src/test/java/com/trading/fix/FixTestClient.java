import quickfix.*;

public class FixTestClient {
    public static void main(String[] args) throws ConfigError {
        SessionSettings settings = new SessionSettings("config/quickfix-client.cfg");
        FixTestApplication application = new FixTestApplication();
        MessageStoreFactory storeFactory = new FileStoreFactory(settings);
        LogFactory logFactory = new FileLogFactory(settings);
        MessageFactory messageFactory = new DefaultMessageFactory();
        
        SocketInitiator initiator = new SocketInitiator(
            application, 
            storeFactory, 
            settings, 
            logFactory, 
            messageFactory
        );
        
        initiator.start();
        
        // Create and send a test order
        quickfix.fix44.NewOrderSingle order = new quickfix.fix44.NewOrderSingle(
            new ClOrdID("123"),
            new Side(Side.BUY),
            new TransactTime(),
            new OrdType(OrdType.MARKET)
        );
        order.set(new Symbol("AAPL"));
        order.set(new OrderQty(100));
        
        Session.sendToTarget(order, initiator.getSessions().get(0));
    }
} 