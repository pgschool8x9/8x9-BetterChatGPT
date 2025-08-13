import { useTranslation } from 'react-i18next';

// 言語コードから通貨コードへのマッピング
export const LANGUAGE_CURRENCY_MAP: Record<string, string> = {
  'ja': 'JPY',      // 日本語 → 日本円
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

// デフォルト通貨
const DEFAULT_CURRENCY = 'USD';

// 為替レートのキャッシュ
interface ExchangeRateCache {
  rates: Record<string, number>;
  timestamp: number;
  baseCurrency: string;
}

let exchangeRateCache: ExchangeRateCache | null = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1時間

// 為替レート取得
export const fetchExchangeRates = async (): Promise<Record<string, number>> => {
  // キャッシュをチェック
  if (exchangeRateCache && 
      Date.now() - exchangeRateCache.timestamp < CACHE_DURATION) {
    return exchangeRateCache.rates;
  }

  try {
    // ExchangeRate-API (無料プラン)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    
    if (data.rates) {
      exchangeRateCache = {
        rates: data.rates,
        timestamp: Date.now(),
        baseCurrency: 'USD'
      };
      return data.rates;
    }
  } catch (error) {
    console.warn('為替レート取得に失敗しました:', error);
  }

  // フォールバック: デフォルトレート（概算値）
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
  };
};

// 現在の言語に基づいて通貨コードを取得
export const getCurrentCurrency = (language: string): string => {
  return LANGUAGE_CURRENCY_MAP[language] || DEFAULT_CURRENCY;
};

// 通貨フォーマット
export const formatCurrency = (
  amount: number, 
  currency: string, 
  locale?: string
): string => {
  try {
    // 無効な値の処理
    if (!isFinite(amount) || isNaN(amount)) {
      const symbol = getCurrencySymbol(currency);
      return `${symbol}0`;
    }

    // 言語に基づいてロケールを決定
    const formatLocale = locale || getLocaleFromCurrency(currency);
    
    // 小数点以下の桁数を通貨に応じて調整
    const isIntegerCurrency = currency === 'JPY' || currency === 'KRW' || currency === 'VND';
    
    // 小数点桁数の設定
    let maxDigits = isIntegerCurrency ? 0 : 3; // 通常は最大3桁
    let minDigits = isIntegerCurrency ? 0 : 2; // 最低2桁（通常金額の場合）
    
    // 小額の場合は整数通貨でも小数点を表示、最低桁数を0に
    if (amount > 0 && amount < 0.1) {
      maxDigits = 3;
      minDigits = 0;
    }
    
    return new Intl.NumberFormat(formatLocale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    }).format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error, 'Amount:', amount, 'Currency:', currency);
    // フォールバック
    const symbol = getCurrencySymbol(currency);
    const isIntegerCurrency = currency === 'JPY' || currency === 'KRW' || currency === 'VND';
    let digits = isIntegerCurrency ? 0 : 3; // 通常は最大3桁
    
    // 小額の場合は整数通貨でも小数点を表示
    if (amount > 0 && amount < 0.1) {
      digits = 3;
    }
    
    return `${symbol}${amount.toFixed(digits)}`;
  }
};

// 通貨コードからロケールを推定
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

// 通貨シンボル取得（フォールバック用）
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

// USD から指定通貨に変換
export const convertUsdToCurrency = async (
  usdAmount: number, 
  targetCurrency: string
): Promise<number> => {
  if (targetCurrency === 'USD') return usdAmount;
  
  const rates = await fetchExchangeRates();
  const rate = rates[targetCurrency];
  
  if (!rate) {
    console.warn(`通貨レート未対応: ${targetCurrency}`);
    return usdAmount;
  }
  
  return usdAmount * rate;
};

// メインフック：USD金額を現在の言語通貨でフォーマット
export const useLocalizedCurrency = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const currentCurrency = getCurrentCurrency(currentLanguage);

  const formatLocalizedCurrency = async (usdAmount: number): Promise<string> => {
    try {
      console.log('Debug - Input USD amount:', usdAmount, 'Target currency:', currentCurrency);
      
      if (usdAmount === 0) {
        return formatCurrency(0, currentCurrency, currentLanguage);
      }
      
      const convertedAmount = await convertUsdToCurrency(usdAmount, currentCurrency);
      console.log('Debug - Converted amount:', convertedAmount);
      
      const formatted = formatCurrency(convertedAmount, currentCurrency, currentLanguage);
      console.log('Debug - Formatted:', formatted);
      
      return formatted;
    } catch (error) {
      console.error('Debug - formatLocalizedCurrency error:', error);
      // フォールバック: USDで表示
      return `$${usdAmount.toFixed(4)}`;
    }
  };

  return {
    currentCurrency,
    currentLanguage,
    formatLocalizedCurrency
  };
};