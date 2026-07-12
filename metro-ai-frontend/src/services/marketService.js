// Placeholder service for /api/v1/market/bulletin and /api/v1/market/graphs.
// Swap the generated data below for real apiClient.request(...) calls once
// those endpoints ship - the shapes returned here are what the UI expects.

export async function getBulletin(targetCurrency) {
  return [
    {
      id: 1,
      tag: 'Rates',
      tone: 'positive',
      headline: `${targetCurrency} strengthened 0.8% overnight on strong capital inflows.`,
    },
    {
      id: 2,
      tag: 'Central Bank',
      tone: 'neutral',
      headline: 'Bank of Canada holds its policy rate steady this week.',
    },
    {
      id: 3,
      tag: 'Advisory',
      tone: 'warning',
      headline: 'Elevated volatility expected around the Friday jobs report.',
    },
  ];
}

export async function getRateSeries(base, target) {
  const days = 30;
  const seed = (base + target).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  let value = 45 + (seed % 30);
  const today = new Date();

  return Array.from({ length: days }).map((_, i) => {
    value += (Math.sin(i / 3 + seed) + Math.random() - 0.5) * 0.6;
    const date = new Date(today);
    date.setDate(date.getDate() - (days - i));
    return {
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      rate: Number(value.toFixed(3)),
    };
  });
}
