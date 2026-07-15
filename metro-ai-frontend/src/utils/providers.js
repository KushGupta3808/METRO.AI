// Known providers link straight to their real site. Unknown providers
// (e.g. ones your real backend adds later) fall back to a search instead
// of guessing a URL that might not exist.
const PROVIDER_LINKS = {
  wise: 'https://wise.com/',
  remitly: 'https://www.remitly.com/',
  xoom: 'https://www.xoom.com/',
  worldremit: 'https://www.worldremit.com/',
};

export function getProviderUrl(providerName) {
  const key = (providerName || '').toLowerCase().replace(/\s+/g, '');
  if (PROVIDER_LINKS[key]) return PROVIDER_LINKS[key];
  return `https://www.google.com/search?q=${encodeURIComponent(`${providerName} send money`)}`;
}
