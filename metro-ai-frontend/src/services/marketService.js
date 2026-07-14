// Placeholder service for /api/v1/market/bulletin and /api/v1/market/graphs.
// Swap the generated data below for real apiClient.request(...) calls once
// those endpoints ship - the shapes returned here are what the UI expects.
//
// Note on sourceUrl below: these point at real, relevant destinations (a
// central bank, a real economic calendar, the World Bank's remittance page)
// for further reading - they are not claiming those sites wrote the exact
// headline text, which is METRO AI's own generated copy.

export async function getNewsFeed(targetCurrency) {
  return [
    {
      id: 1,
      tag: 'Rates',
      tone: 'positive',
      icon: 'trend',
      headline: `${targetCurrency} strengthened 0.8% overnight on strong capital inflows.`,
      summary:
        'Portfolio and FDI inflows picked up this week, giving the currency room to firm against major peers.',
      sourceLabel: 'METRO Markets Desk',
      sourceUrl: 'https://www.xe.com/currencycharts/',
    },
    {
      id: 2,
      tag: 'Central Bank',
      tone: 'neutral',
      icon: 'bank',
      headline: 'Bank of Canada holds its policy rate steady this week.',
      summary: 'The central bank cited balanced inflation risks, holding off on a move for a second straight meeting.',
      sourceLabel: 'Central Bank Watch',
      sourceUrl: 'https://www.bankofcanada.ca',
    },
    {
      id: 3,
      tag: 'Advisory',
      tone: 'warning',
      icon: 'alert',
      headline: 'Elevated volatility expected around the Friday jobs report.',
      summary:
        'Options markets are pricing a wider-than-usual move - consider timing larger transfers around the print.',
      sourceLabel: 'METRO Advisory',
      sourceUrl: 'https://www.investing.com/economic-calendar/',
    },
    {
      id: 4,
      tag: 'Corridors',
      tone: 'neutral',
      icon: 'globe',
      headline: 'Cross-border remittance volumes to South Asia grew 12% year over year.',
      summary: 'Digital-first providers keep taking share from cash pickup as mobile wallet coverage expands.',
      sourceLabel: 'Global Corridors',
      sourceUrl: 'https://www.worldbank.org/en/topic/migrationremittancesdiasporaissues',
    },
    {
      id: 5,
      tag: 'Payments',
      tone: 'positive',
      icon: 'trend',
      headline: 'Mobile wallet adoption keeps rising across payout corridors.',
      summary: 'Faster settlement and lower fees are pulling volume away from traditional bank deposit rails.',
      sourceLabel: 'METRO Markets Desk',
      sourceUrl: 'https://www.gsma.com/mobilefordevelopment/mobile-money/',
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
