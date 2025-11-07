import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './src/locales/en.json';
import de from './src/locales/de.json';
import fr from './src/locales/fr.json';
import es from './src/locales/es.json';

const SUPPORTED_LANGUAGES = ['en', 'de', 'fr', 'es'];
const LANGUAGE_KEY = 'userLanguage';

const languageDetector = {
    type: 'languageDetector',
    async: true,
    detect: async (cb) => {
        try {
            // Get device language FIRST (this is the source of truth for first-time users)
            const locales = RNLocalize.getLocales();
            const deviceLanguageCode = locales[0]?.languageCode || 'en';
            const deviceLanguage = SUPPORTED_LANGUAGES.includes(deviceLanguageCode) 
                ? deviceLanguageCode 
                : 'en';
            
            console.log('🌍 Device language detected:', deviceLanguageCode);
            
            // Check if user has explicitly set a language preference
            // We use a flag to know if user has manually chosen a language
            const hasUserChosenLanguage = await AsyncStorage.getItem('@hasUserChosenLanguage');
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
            
            console.log('📝 Saved language:', savedLanguage);
            console.log('👤 User has chosen language:', hasUserChosenLanguage);
            
            // If user has NEVER explicitly chosen a language, ALWAYS use device language
            if (hasUserChosenLanguage !== 'true') {
                console.log('✅ First time / No user choice - Using device language:', deviceLanguage);
                // Don't save to AsyncStorage yet - let user choose first
                // This ensures device language is always used on first launch
                cb(deviceLanguage);
                return;
            }
            
            // User has explicitly chosen a language - use saved preference
            if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
                console.log('✅ Using user-chosen language:', savedLanguage);
                cb(savedLanguage);
                return;
            }
            
            // Fallback: Invalid saved language, use device language
            console.log('⚠️ Invalid saved language, using device language:', deviceLanguage);
            await AsyncStorage.setItem(LANGUAGE_KEY, deviceLanguage);
            cb(deviceLanguage);
        } catch (error) {
            console.error('❌ Error detecting language:', error);
            cb('en');
        }
    },
    init: () => { },
    cacheUserLanguage: async (language) => {
        try {
            console.log('💾 Caching user language:', language);
            // Mark that user has explicitly chosen a language
            await AsyncStorage.setItem('@hasUserChosenLanguage', 'true');
            await AsyncStorage.setItem(LANGUAGE_KEY, language);
        } catch (error) {
            console.error('Error saving language:', error);
        }
    },
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        compatibilityJSON: 'v3',
        resources: {
            en: { translation: en },
            de: { translation: de },
            fr: { translation: fr },
            es: { translation: es }
        },
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
