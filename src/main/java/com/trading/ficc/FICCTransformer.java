import quickfix.fix44.NewOrderSingle;
import quickfix.FieldNotFound;

public class FICCTransformer {
    
    public String transformToFICC(NewOrderSingle fixMessage) throws FieldNotFound {
        StringBuilder ficcMessage = new StringBuilder();
        
        // Example FICC mapping (you'll need to adjust based on actual FICC specs)
        ficcMessage.append("FICC_TRADE|");
        ficcMessage.append("ID=").append(fixMessage.getClOrdID().getValue()).append("|");
        ficcMessage.append("SECURITY=").append(fixMessage.getSymbol().getValue()).append("|");
        ficcMessage.append("QTY=").append(fixMessage.getOrderQty().getValue()).append("|");
        ficcMessage.append("SIDE=").append(mapSide(fixMessage.getSide().getValue()));
        
        return ficcMessage.toString();
    }
    
    private String mapSide(char fixSide) {
        // Map FIX side values to FICC side values
        return switch (fixSide) {
            case '1' -> "BUY";
            case '2' -> "SELL";
            default -> throw new IllegalArgumentException("Unknown side: " + fixSide);
        };
    }
} 