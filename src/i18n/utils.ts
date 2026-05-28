import { translations, defaultLang, type Lang } from './translations';

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in translations) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: keyof (typeof translations)[typeof defaultLang]) {
    return translations[lang][key] || translations[defaultLang][key];
  };
}

export function getLocalizedPath(path: string, lang: Lang): string {
  if (lang === defaultLang) return path;
  return `/${lang}${path}`;
}
