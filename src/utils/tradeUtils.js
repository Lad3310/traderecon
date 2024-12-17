export const formatters = {
  date: (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const [year, month, day] = dateString.split('-');
      return `${month}/${day}/${year}`;
    } catch {
      return 'N/A';
    }
  },
  
  currency: (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
};

export const compareValues = {
  price: (val1, val2) => Math.abs(val1 - val2) <= TOLERANCES.PRICE,
  netMoney: (val1, val2) => Math.abs(val1 - val2) <= TOLERANCES.NET_MONEY
}; 