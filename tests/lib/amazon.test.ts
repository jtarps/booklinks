import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAmazonAffiliateLink, getUserCountry } from '@/lib/amazon';

describe('getAmazonAffiliateLink', () => {
  beforeEach(() => {
    vi.stubGlobal('Intl', {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: 'America/New_York' }),
      }),
    });
  });

  it('generates a valid Amazon search URL', () => {
    const link = getAmazonAffiliateLink('The Lean Startup', 'Eric Ries');
    expect(link).toContain('amazon.com');
    expect(link).toContain('tag=booklinks-20');
    expect(link).toContain('The%20Lean%20Startup%20Eric%20Ries');
  });

  it('uses correct domain for UK users', () => {
    vi.stubGlobal('Intl', {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: 'Europe/London' }),
      }),
    });
    const link = getAmazonAffiliateLink('Test Book', 'Author');
    expect(link).toContain('amazon.co.uk');
    expect(link).toContain('tag=booklinks-uk-20');
  });

  it('uses correct domain for German users', () => {
    vi.stubGlobal('Intl', {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: 'Europe/Berlin' }),
      }),
    });
    const link = getAmazonAffiliateLink('Test Book', 'Author');
    expect(link).toContain('amazon.de');
    expect(link).toContain('tag=booklinks-de-20');
  });

  it('uses correct domain for Australian users', () => {
    vi.stubGlobal('Intl', {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: 'Australia/Sydney' }),
      }),
    });
    const link = getAmazonAffiliateLink('Test Book', 'Author');
    expect(link).toContain('amazon.com.au');
    expect(link).toContain('tag=booklinks-au-20');
  });

  it('falls back to US for unknown timezone', () => {
    vi.stubGlobal('Intl', {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: 'Antarctica/McMurdo' }),
      }),
    });
    const link = getAmazonAffiliateLink('Test Book', 'Author');
    expect(link).toContain('amazon.com');
    expect(link).toContain('tag=booklinks-20');
  });

  it('falls back to US when Intl is unavailable', () => {
    vi.stubGlobal('Intl', undefined);
    const link = getAmazonAffiliateLink('Test Book', 'Author');
    expect(link).toContain('amazon.com');
    expect(link).toContain('tag=booklinks-20');
  });

  it('encodes special characters in search query', () => {
    const link = getAmazonAffiliateLink("Harry Potter & the Philosopher's Stone", 'J.K. Rowling');
    expect(link).toContain('k=');
    expect(link).toContain('%26'); // & is encoded
    expect(link).toContain('tag='); // tag param is separate from query
  });
});

describe('getUserCountry', () => {
  it('returns the detected country code', () => {
    vi.stubGlobal('Intl', {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: 'Asia/Tokyo' }),
      }),
    });
    expect(getUserCountry()).toBe('JP');
  });
});
