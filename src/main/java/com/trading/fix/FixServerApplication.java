import quickfix.*;
import quickfix.field.*;

public class FixServerApplication implements Application {
    @Override
    public void onCreate(SessionID sessionId) {
        System.out.println("Session created: " + sessionId);
    }

    @Override
    public void onLogon(SessionID sessionId) {
        System.out.println("Client logged on: " + sessionId);
    }

    @Override
    public void onLogout(SessionID sessionId) {
        System.out.println("Client logged out: " + sessionId);
    }

    @Override
    public void fromApp(Message message, SessionID sessionId) throws FieldNotFound, IncorrectDataFormat, IncorrectTagValue, UnsupportedMessageType {
        System.out.println("Received message from " + sessionId + ": " + message);
        
        String msgType = message.getHeader().getString(MsgType.FIELD);
        if (msgType.equals("D")) {  // D is for New Order Single
            handleNewOrderSingle(message, sessionId);
        }
    }

    private void handleNewOrderSingle(Message message, SessionID sessionId) throws FieldNotFound {
        String cusip = message.getString(Symbol.FIELD);
        double quantity = message.getDouble(OrderQty.FIELD);
        char side = message.getChar(Side.FIELD);
        
        System.out.println("Received order: " + cusip + ", " + quantity + ", " + side);
    }

    @Override
    public void fromAdmin(Message message, SessionID sessionId) throws FieldNotFound, IncorrectDataFormat, IncorrectTagValue, RejectLogon {
    }

    @Override
    public void toAdmin(Message message, SessionID sessionId) {
    }

    @Override
    public void toApp(Message message, SessionID sessionId) throws DoNotSend {
    }
} 