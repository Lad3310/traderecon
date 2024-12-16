/**
 * Maps database field names to friendly display names and provides descriptions
 * for FICC trade party identification fields
 */
export const FIRM_IDENTIFIERS = {
  // Our side of the trade
  submitting_member_executing_firm_customer_id: {
    displayName: 'Executing Firm',
    description: 'Four-letter identifier representing our firm or customer we are clearing for (e.g., RAJA)',
    example: 'RAJA, STEW, GLBL'
  },
  member_firm_id: {
    displayName: 'Clearing Firm',
    description: 'Four-digit FICC membership number for the clearing firm (e.g., 9553)',
    example: '9553'
  },
  
  // Counterparty side
  contra_firm_executing_firm_customer_id: {
    displayName: 'Contra Executing Firm',
    description: 'Four-letter identifier for the counterparty executing firm (e.g., GSCO)',
    example: 'GSCO, MSCO, JPMS'
  },
  contra_firm_id: {
    displayName: 'Contra Clearing Firm',
    description: 'Four-digit FICC membership number for the counterparty clearing firm',
    example: '9531, 0050, 0187'
  }
};

// Reverse lookup for converting display names to database fields
export const DISPLAY_TO_DB_FIELDS = Object.entries(FIRM_IDENTIFIERS).reduce((acc, [dbField, info]) => {
  acc[info.displayName] = dbField;
  return acc;
}, {}); 