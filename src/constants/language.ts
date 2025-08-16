// languages that have translation files in `public/locales`
export const i18nLanguages = [
  'en',
  'en-US',
  'ja',
] as const;

// languages that are selectable on the web page
export const selectableLanguages = [
  'en-US',
  'ja',
] as const;

export const languageCodeToName = {
  'en': 'English',
  'en-US': 'English (US)',
  'ja': '日本語',
};
