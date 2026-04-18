import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import en from '../assets/locales/en.json';
import fr from '../assets/locales/fr.json';
import ar from '../assets/locales/ar.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
};

const LANGUAGE_KEY = '@app_language';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default to English, LanguageProvider will override this
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    }
  });

export default i18n;

