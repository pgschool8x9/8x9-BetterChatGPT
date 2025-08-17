import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

// Language code to currency code mapping
export const LANGUAGE_CURRENCY_MAP: Record<string, string> = {
  'ja': 'JPY',      // 日本語 → 日本円
  'ja_jp': 'JPY',   // 日本語(アンダースコア) → 日本円
  'ja-jp': 'JPY',   // 日本語(小文字ハイフン) → 日本円
  'ja-JP': 'JPY',   // 日本語(大文字ハイフン) → 日本円
  'en': 'USD',      // 英語 → 米ドル
  'en-US': 'USD',   // 英語(US) → 米ドル
  'en-GB': 'GBP',   // 英語(UK) → 英ポンド
  'de': 'EUR',      // ドイツ語 → ユーロ
  'fr': 'EUR',      // フランス語 → ユーロ
  'fr-FR': 'EUR',   // フランス語(FR) → ユーロ
  'es': 'EUR',      // スペイン語 → ユーロ
  'it': 'EUR',      // イタリア語 → ユーロ
  'zh': 'CNY',      // 中国語 → 中国元
  'zh-CN': 'CNY',   // 中国語(簡体) → 中国元
  'zh-TW': 'TWD',   // 中国語(繁体) → 台湾ドル
  'zh-HK': 'HKD',   // 中国語(香港) → 香港ドル
  'ko': 'KRW',      // 韓国語 → 韓国ウォン
  'ru': 'RUB',      // ロシア語 → ルーブル
  'da': 'DKK',      // デンマーク語 → デンマーククローネ
  'sv': 'SEK',      // スウェーデン語 → スウェーデンクローナ
  'nb': 'NOK',      // ノルウェー語 → ノルウェークローネ
  'ro': 'RON',      // ルーマニア語 → ルーマニアレイ
  'ms': 'MYR',      // マレー語 → マレーシアリンギット
  'vi-VN': 'VND',   // ベトナム語 → ベトナムドン
  'yue': 'HKD',     // 広東語 → 香港ドル
};

// Default currency
const DEFAULT_CURRENCY = 'USD';

// Exchange rate cache
interface ExchangeRateCache {
  rates: Record<string, number>;
  timestamp: number;
  baseCurrency: string;
}

const CACHE_KEY = 'exchangeRateCache';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24時間

// Get data from cache
const getCachedRates = (): ExchangeRateCache | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      // キャッシュが有効かチェック
      if (data.timestamp && Date.now() - data.timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (error) {
    console.warn('Cache read error:', error);
  }
  return null;
};

// Save data to cache
const setCachedRates = (cache: ExchangeRateCache): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Cache save error:', error);
  }
};

// Fetch exchange rates
export const fetchExchangeRates = async (): Promise<Record<string, number>> => {
  // キャッシュをチェック
  const cachedRates = getCachedRates();
  if (cachedRates) {
    return cachedRates.rates;
  }
  try {
    // ExchangeRate-API (無料プラン)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    
    if (data.rates) {
      const newCache = {
        rates: data.rates,
        timestamp: Date.now(),
        baseCurrency: 'USD'
      };
      setCachedRates(newCache);
      return data.rates;
    }
  } catch (error) {
    console.warn('Failed to fetch exchange rates:', error);
  }

  // Fallback: default rates (approximate values)
  return {
    USD: 1,
    JPY: 150,
    EUR: 0.85,
    GBP: 0.73,
    CNY: 7.2,
    KRW: 1350,
    TWD: 32,
    HKD: 7.8,
    RUB: 90,
    DKK: 6.7,
    SEK: 10.5,
    NOK: 10.8,
    RON: 4.6,
    MYR: 4.7,
    VND: 24000
  }
};

// Get currency code based on current language
export const getCurrentCurrency = (language: string): string => {  
  // Check for exact match
  if (LANGUAGE_CURRENCY_MAP[language]) {
    const currency = LANGUAGE_CURRENCY_MAP[language];
    return currency;
  }
  
  // Check for partial match (ja_jp → ja etc.)
  const languageBase = language.split(/[-_]/)[0];
  if (LANGUAGE_CURRENCY_MAP[languageBase]) {
    const currency = LANGUAGE_CURRENCY_MAP[languageBase];
    return currency;
  }  
  return DEFAULT_CURRENCY;
};

// Currency formatting
export const formatCurrency = (
  amount: number, 
  currency: string, 
  locale?: string
): string => {
  try {
    // Handle invalid values
    if (!isFinite(amount) || isNaN(amount)) {
      const symbol = getCurrencySymbol(currency);
      return `${symbol}0`;
    }

    // Determine locale based on language
    const formatLocale = locale || getLocaleFromCurrency(currency);
    
    // Adjust decimal places based on currency
    const isIntegerCurrency = currency === 'KRW' || currency === 'VND'; // JPYを除外
    
    // Decimal places setting (always 2 digits)
    let maxDigits = 2;
    let minDigits = 2;
    
    return new Intl.NumberFormat(formatLocale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    }).format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error, 'Amount:', amount, 'Currency:', currency);
    // Fallback
    const symbol = getCurrencySymbol(currency);
    // Always display to 2 decimal places
    return `${symbol}${amount.toFixed(2)}`;
  }
};

// Estimate locale from currency code
const getLocaleFromCurrency = (currency: string): string => {
  const currencyLocaleMap: Record<string, string> = {
    'USD': 'en-US',
    'JPY': 'ja-JP',
    'EUR': 'de-DE',
    'GBP': 'en-GB',
    'CNY': 'zh-CN',
    'KRW': 'ko-KR',
    'TWD': 'zh-TW',
    'HKD': 'zh-HK',
    'RUB': 'ru-RU',
    'DKK': 'da-DK',
    'SEK': 'sv-SE',
    'NOK': 'nb-NO',
    'RON': 'ro-RO',
    'MYR': 'ms-MY',
    'VND': 'vi-VN'
  };
  return currencyLocaleMap[currency] || 'en-US';
};

// Get currency symbol (for fallback)
const getCurrencySymbol = (currency: string): string => {
  const symbolMap: Record<string, string> = {
    'USD': '$',
    'JPY': '¥',
    'EUR': '€',
    'GBP': '£',
    'CNY': '¥',
    'KRW': '₩',
    'TWD': 'NT$',
    'HKD': 'HK$',
    'RUB': '₽',
    'DKK': 'kr',
    'SEK': 'kr',
    'NOK': 'kr',
    'RON': 'lei',
    'MYR': 'RM',
    'VND': '₫'
  };
  return symbolMap[currency] || currency;
};

// Convert from USD to specified currency
export const convertUsdToCurrency = async (
  usdAmount: number, 
  targetCurrency: string
): Promise<number> => {
  if (targetCurrency === 'USD') return usdAmount;
  
  const rates = await fetchExchangeRates();
  const rate = rates[targetCurrency];
  
  if (!rate) {
    console.warn(`Unsupported currency rate: ${targetCurrency}`);
    return usdAmount;
  }
  
  return usdAmount * rate;
};

// Main hook: Format USD amount in current language currency
export const useLocalizedCurrency = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const currentCurrency = getCurrentCurrency(currentLanguage);

  const formatLocalizedCurrency = useCallback(async (usdAmount: number): Promise<string> => {
    try {
      if (usdAmount === 0) {
        return formatCurrency(0, currentCurrency, currentLanguage);
      }
      
      const convertedAmount = await convertUsdToCurrency(usdAmount, currentCurrency);
      const formatted = formatCurrency(convertedAmount, currentCurrency, currentLanguage);
      
      return formatted;
    } catch (error) {
      console.error('formatLocalizedCurrency error:', error);
      // Fallback: display in USD
      return `$${usdAmount.toFixed(2)}`;
    }
  }, [currentCurrency, currentLanguage]);

  return {
    currentCurrency,
    currentLanguage,
    formatLocalizedCurrency
  };
};