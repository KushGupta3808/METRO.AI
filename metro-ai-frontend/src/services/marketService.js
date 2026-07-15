// Placeholder service for /api/v1/market/bulletin and /api/v1/market/graphs.
// getNewsFeed() is still mocked - swap it for a real apiClient.request(...)
// call once that endpoint ships.
//
// getRateSeries()/getLatestRate() are NOT mocked - they call Frankfurter
// (api.frankfurter.dev), a free, keyless, no-signup exchange rate API
// backed by real central bank data (ECB and others). No API key, no
// backend needed. If a currency pair isn't covered there, both functions
// fall back to a deterministic simulated series so the UI never breaks -
// and the fallback is always labeled as simulated, never presented as live.

const FX_API_BASE = 'https://api.frankfurter.dev/v1';

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function seedFromPair(base, target) {
  return (base + target).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

function generateSimulatedSeries(base, target) {
  const days = 30;
  const seed = seedFromPair(base, target);
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

// Real historical daily rates over the last 30 days for {base}/{target}.
// Falls back to a simulated series (clearly flagged via isLive: false) if
// the pair isn't covered or the request fails for any reason.
export async function getRateSeries(base, target) {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    const url = `${FX_API_BASE}/${formatDate(start)}..${formatDate(end)}?base=${base}&symbols=${target}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`FX API responded ${response.status}`);

    const payload = await response.json();
    const entries = Object.entries(payload.rates || {}).sort(([a], [b]) => (a < b ? -1 : 1));
    const series = entries
      .map(([date, rates]) => ({
        date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rate: rates[target] != null ? Number(rates[target].toFixed(4)) : null,
      }))
      .filter((point) => point.rate != null);

    if (!series.length) throw new Error('No rate data returned for this pair');
    return { isLive: true, series };
  } catch (err) {
    return { isLive: false, series: generateSimulatedSeries(base, target) };
  }
}

// A single current rate - used by the Compare Engine's demo fallback so
// the sample provider offers are built around a real mid-market rate
// instead of an arbitrary number, whenever the pair is covered.
export async function getLatestRate(base, target) {
  try {
    const response = await fetch(`${FX_API_BASE}/latest?base=${base}&symbols=${target}`);
    if (!response.ok) throw new Error(`FX API responded ${response.status}`);
    const payload = await response.json();
    const rate = payload.rates?.[target];
    if (rate == null) throw new Error('No rate for this pair');
    return { rate, isLive: true };
  } catch (err) {
    const seed = seedFromPair(base, target);
    return { rate: 45 + (seed % 30) + (seed % 7) / 10, isLive: false };
  }
}

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
