import quickfix.*;
import quickfix.field.*;

public class FixMessageHandler extends MessageCracker implements Application {
    
    @Override
    public void onCreate(SessionID sessionId) {
        System.out.println("Session created: " + sessionId);
    }
    
    @Override
    public void onLogon(SessionID sessionId) {
        System.out.println("Logon - " + sessionId);
    }
    
    @Override
    public void onLogout(SessionID sessionId) {
        System.out.println("Logout - " + sessionId);
    }
    
    @Override
    public void fromAdmin(Message message, SessionID sessionId) throws FieldNotFound, IncorrectDataFormat, IncorrectTagValue, RejectLogon {
    }
    
    @Override
    public void fromApp(Message message, SessionID sessionId) throws FieldNotFound, IncorrectDataFormat, IncorrectTagValue, UnsupportedMessageType {
        crack(message, sessionId);
    }

    @Override
    public void toAdmin(Message message, SessionID sessionId) {
    }

    @Override
    public void toApp(Message message, SessionID sessionId) throws DoNotSend {
    }
} 