import quickfix.*;
import quickfix.field.*;

public class SimpleFixClient {
    public static void main(String[] args) throws ConfigError {
        // Create a test order
        quickfix.fix44.NewOrderSingle order = new quickfix.fix44.NewOrderSingle(
            new ClOrdID("TEST-1"),
            new Side(Side.BUY),
            new TransactTime(),
            new OrdType(OrdType.MARKET)
        );
        order.set(new Symbol("AAPL"));
        order.set(new OrderQty(100));
        
        // Print the message
        System.out.println("FIX Message would look like:");
        System.out.println(order.toString());
    }
} 