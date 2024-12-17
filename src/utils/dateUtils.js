export const calculateBusinessDays = (settlementDate) => {
  // Return 0 if no settlement date
  if (!settlementDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date to midnight

  // Parse settlement date
  const [year, month, day] = settlementDate.split('-');
  const settlement = new Date(year, month - 1, day);
  settlement.setHours(0, 0, 0, 0); // Normalize settlement date to midnight

  // If settlement date is in the future or today, return 0
  if (settlement >= today) return 0;

  let businessDays = 0;
  const current = new Date(settlement);

  // Iterate through each day from settlement to today
  while (current < today) {
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return businessDays;
}; 