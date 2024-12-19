import quickfix.*;
import quickfix.field.*;

public class FixServer {
    private final SocketAcceptor acceptor;
    private final Application application;

    public FixServer(String configFile) throws ConfigError {
        SessionSettings settings = new SessionSettings(configFile);
        application = new FixServerApplication();
        MessageStoreFactory storeFactory = new FileStoreFactory(settings);
        LogFactory logFactory = new FileLogFactory(settings);
        MessageFactory messageFactory = new DefaultMessageFactory();
        
        acceptor = new SocketAcceptor(
            application,
            storeFactory,
            settings,
            logFactory,
            messageFactory
        );
    }

    public void start() throws RuntimeError, ConfigError {
        acceptor.start();
        System.out.println("FIX Server started and listening for connections...");
    }

    public void stop() {
        acceptor.stop();
        System.out.println("FIX Server stopped");
    }

    public static void main(String[] args) {
        try {
            FixServer server = new FixServer("src/main/resources/fixServer.cfg");
            server.start();
            
            // Keep the server running
            while (true) {
                Thread.sleep(1000);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
} 