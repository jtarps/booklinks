const AFFILIATE_TAGS: Record<string, string> = {
  US: 'booklinks-20',
  CA: 'booklinks-ca-20',
  GB: 'booklinks-uk-20',
  DE: 'booklinks-de-20',
  FR: 'booklinks-fr-20',
  JP: 'booklinks-jp-20',
  AU: 'booklinks-au-20',
  IN: 'booklinks-in-20',
};

const AMAZON_DOMAINS: Record<string, string> = {
  US: 'amazon.com',
  CA: 'amazon.ca',
  GB: 'amazon.co.uk',
  DE: 'amazon.de',
  FR: 'amazon.fr',
  JP: 'amazon.co.jp',
  AU: 'amazon.com.au',
  IN: 'amazon.in',
};

// Timezone → country mapping for geo-detection
const TIMEZONE_COUNTRY: Record<string, string> = {
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Phoenix': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/St_Johns': 'CA',
  'America/Regina': 'CA',
  'Europe/London': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Vienna': 'DE',
  'Europe/Zurich': 'DE',
  'Europe/Paris': 'FR',
  'Asia/Tokyo': 'JP',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU',
  'Australia/Hobart': 'AU',
  'Australia/Darwin': 'AU',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
};

function detectCountry(): string {
  if (typeof Intl === 'undefined') return 'US';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_COUNTRY[tz] || 'US';
  } catch {
    return 'US';
  }
}

export function getAmazonAffiliateLink(title: string, author: string): string {
  const country = detectCountry();
  const domain = AMAZON_DOMAINS[country] || AMAZON_DOMAINS.US;
  const tag = AFFILIATE_TAGS[country] || AFFILIATE_TAGS.US;
  const searchQuery = encodeURIComponent(`${title} ${author}`);
  return `https://www.${domain}/s?k=${searchQuery}&tag=${tag}`;
}

export function getUserCountry(): string {
  return detectCountry();
}
