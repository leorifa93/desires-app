import React, {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Navigation from './src/navigation';
import {Provider, useSelector} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import store, {persistor} from './src/store';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {MenuProvider} from 'react-native-popup-menu';
import {View, ActivityIndicator, Platform} from 'react-native';
import { UploadBanner } from './src/components/loaders';
import { CallProvider } from './src/contexts/CallContext';
import FloatingCallWidget from './src/components/FloatingCallWidget';
import trackingService from './src/services/trackingService';
import './i18n';

function AppContent() {
  const user = useSelector(state => state.auth.user);
  const hasLocalPublicPaths = Array.isArray(user?.publicAlbum) && user.publicAlbum.some(p => typeof p === 'string');
  const showUploadBanner = !!user?.publicPicturesUploading || hasLocalPublicPaths;

  // Sync i18n language with user settings (if they exist)
  // This ensures the app uses device language if no user preference is set
  useEffect(() => {
    if (user?._settings?.currentLang) {
      const savedLang = user._settings.currentLang;
      // Only change if different from current i18n language
      const i18n = require('./i18n').default;
      if (i18n.language !== savedLang) {
        console.log('Syncing language from user settings:', savedLang);
        i18n.changeLanguage(savedLang);
      }
    }
    // If no user language setting exists, i18n will use device language (from i18n.js)
  }, [user?._settings?.currentLang]);

  return (
    <>
      <Navigation />
      <UploadBanner visible={showUploadBanner} />
      <FloatingCallWidget />
    </>
  );
}

const LoadingScreen = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <ActivityIndicator size="large" color="#C61323" />
  </View>
);

export default function App() {
  // Request tracking permission IMMEDIATELY on app start (iOS only)
  // This must happen BEFORE any tracking occurs (Firebase Analytics, etc.)
  // Required by App Store Review - tracking permission must be requested BEFORE login
  useEffect(() => {
    if (Platform.OS === 'ios') {
      console.log('🔒 Requesting tracking permission on app start...');
      // Small delay to ensure app is ready
      const timer = setTimeout(() => {
        trackingService.requestTrackingPermission();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <MenuProvider>
      <GestureHandlerRootView>
        <Provider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <SafeAreaProvider style={{flex: 1}}>
              <CallProvider>
                <AppContent />
              </CallProvider>
            </SafeAreaProvider>
          </PersistGate>
        </Provider>
      </GestureHandlerRootView>
    </MenuProvider>
  );
}
