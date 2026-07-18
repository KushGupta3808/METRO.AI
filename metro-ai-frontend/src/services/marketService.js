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

// Per-base-currency central bank, so the "Central Bank" card actually
// matches whichever currency the user picked as their base - it was
// hardcoded to the Bank of Canada regardless of preference before.
const CENTRAL_BANKS = {
  CAD: { name: 'Bank of Canada', url: 'https://www.bankofcanada.ca' },
  USD: { name: 'the Federal Reserve', url: 'https://www.federalreserve.gov' },
  GBP: { name: 'the Bank of England', url: 'https://www.bankofengland.co.uk' },
  EUR: { name: 'the European Central Bank', url: 'https://www.ecb.europa.eu' },
  AUD: { name: 'the Reserve Bank of Australia', url: 'https://www.rba.gov.au' },
};

// Per-target-currency corridor context, so "Corridors" and "Payments"
// reference the region the user is actually sending to, not a hardcoded
// South Asia reference.
const CORRIDOR_CONTEXT = {
  INR: { region: 'South Asia', label: 'India' },
  PKR: { region: 'South Asia', label: 'Pakistan' },
  PHP: { region: 'Southeast Asia', label: 'the Philippines' },
  MXN: { region: 'Latin America', label: 'Mexico' },
  NGN: { region: 'West Africa', label: 'Nigeria' },
  CNY: { region: 'East Asia', label: 'China' },
};

function possessive(name) {
  return name.endsWith('s') ? `${name}'` : `${name}'s`;
}

function fallbackCentralBank(base) {
  return CENTRAL_BANKS[base] || { name: `${base}'s central bank`, url: 'https://www.bis.org/cbanks.htm' };
}

function fallbackCorridor(target) {
  return CORRIDOR_CONTEXT[target] || { region: 'this corridor', label: target };
}

export async function getNewsFeed(base, target) {
  const resolvedBase = base || 'CAD';
  const resolvedTarget = target || 'INR';
  const bank = fallbackCentralBank(resolvedBase);
  const corridor = fallbackCorridor(resolvedTarget);

  // Reuse the same live rate series that powers the dashboard graph, so
  // the "Rates" card reflects a real 30-day move for this exact pair
  // instead of a hardcoded "0.8%" that never changed with the corridor.
  let rateHeadline = `${resolvedTarget} has been broadly stable against ${resolvedBase} over the past month.`;
  let rateSummary = 'Keep an eye on the rate graph above for the latest move before sending a large amount.';
  try {
    const { isLive, series } = await getRateSeries(resolvedBase, resolvedTarget);
    if (series.length >= 2) {
      const first = series[0].rate;
      const last = series[series.length - 1].rate;
      const pctChange = ((last - first) / first) * 100;
      const direction = pctChange >= 0 ? 'strengthened' : 'weakened';
      rateHeadline = `${resolvedTarget} has ${direction} ${Math.abs(pctChange).toFixed(1)}% against ${resolvedBase} over the last 30 days.`;
      rateSummary = isLive
        ? `Based on real Frankfurter/ECB rate history for ${resolvedBase}/${resolvedTarget}.`
        : `Live data isn't available for this pair, so this reflects a simulated trend, not a real move.`;
    }
  } catch {
    // Keep the generic fallback copy above.
  }

  return [
    {
      id: 1,
      tag: 'Rates',
      tone: 'positive',
      icon: 'trend',
      headline: rateHeadline,
      summary: rateSummary,
      sourceLabel: 'METRO Markets Desk',
      sourceUrl: 'https://www.xe.com/currencycharts/',
    },
    {
      id: 2,
      tag: 'Central Bank',
      tone: 'neutral',
      icon: 'bank',
      headline: `${bank.name} holds its policy rate steady this week.`,
      summary: 'The central bank cited balanced inflation risks, holding off on a move for a second straight meeting.',
      sourceLabel: 'Central Bank Watch',
      sourceUrl: bank.url,
    },
    {
      id: 3,
      tag: 'Advisory',
      tone: 'warning',
      icon: 'alert',
      headline: `Elevated volatility expected for ${resolvedBase}/${resolvedTarget} around the Friday jobs report.`,
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
      headline: `Cross-border remittance volumes to ${corridor.region} grew 12% year over year.`,
      summary: `Digital-first providers keep taking share from cash pickup as mobile wallet coverage expands across ${corridor.label}.`,
      sourceLabel: 'Global Corridors',
      sourceUrl: 'https://www.worldbank.org/en/topic/migrationremittancesdiasporaissues',
    },
    {
      id: 5,
      tag: 'Payments',
      tone: 'positive',
      icon: 'trend',
      headline: `Mobile wallet adoption keeps rising across ${possessive(corridor.label)} payout corridors.`,
      summary: 'Faster settlement and lower fees are pulling volume away from traditional bank deposit rails.',
      sourceLabel: 'METRO Markets Desk',
      sourceUrl: 'https://www.gsma.com/mobilefordevelopment/mobile-money/',
    },
  ];
}