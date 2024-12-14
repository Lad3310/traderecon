import { ReconciliationService } from '../services/reconciliationService';

async function testReconciliation() {
  try {
    const report = await ReconciliationService.runDailyRecon();
    console.log('Reconciliation Report:', report);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testReconciliation(); 