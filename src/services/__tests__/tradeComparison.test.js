describe('Trade Comparison Service', () => {
  test('should handle missing trade data', () => {
    expect(() => compareTrades(null, {}))
      .toThrow('Missing trade data for comparison');
  });
  
  test('should correctly compare prices within tolerance', () => {
    const result = compareValues.price(100.0001, 100.0002);
    expect(result).toBe(true);
  });
}); 