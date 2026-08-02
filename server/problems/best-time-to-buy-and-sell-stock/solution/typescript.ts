function maxProfit(prices: number[]): number {
  let minPrice = Infinity;
  let best = 0;
  for (const price of prices) {
    if (price < minPrice) minPrice = price;
    else if (price - minPrice > best) best = price - minPrice;
  }
  return best;
}
