import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '@/utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Alert } from 'react-native';
import * as Updates from 'expo-updates';
import * as Localization from 'expo-localization';

type Language = 'en' | 'fr' | 'ar';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = '@app_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('en');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
                if (savedLanguage) {
                    setLanguageState(savedLanguage as Language);
                    await i18n.changeLanguage(savedLanguage);
                } else {
                    // Default to device locale if possible
                    const deviceLanguage = Localization.getLocales()[0].languageCode as Language;
                    if (['en', 'fr', 'ar'].includes(deviceLanguage)) {
                        setLanguageState(deviceLanguage);
                        await i18n.changeLanguage(deviceLanguage);
                    }
                }
            } catch (e) {
                console.error('Error loading language:', e);
            } finally {
                setIsReady(true);
            }
        };
        loadLanguage();
    }, []);

    const setLanguage = async (lang: Language) => {
        try {
            await i18n.changeLanguage(lang);
            setLanguageState(lang);
            await AsyncStorage.setItem(LANGUAGE_KEY, lang);

            const isRTL = lang === 'ar';
            if (I18nManager.isRTL !== isRTL) {
                I18nManager.forceRTL(isRTL);
                if (__DEV__) {
                    console.log('RTL changed, please reload the app manually in development.');
                    Alert.alert(
                        'Language Changed',
                        'Please restart the app to apply the Right-to-Left layout for Arabic.',
                        [{ text: 'OK' }]
                    );
                } else {
                    await Updates.reloadAsync();
                }
            }
        } catch (e) {
            console.error('Error setting language:', e);
        }
    };

    if (!isReady) return null;

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};


export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
