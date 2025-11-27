import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import Modal from 'react-native-modal';
import { Text } from './';
import { colors, responsiveWidth, responsiveHeight } from '../services';
import { scale } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';
import { CloseSvgIcon } from './icons/ProfileIcons';

const WebViewModal = ({ visible, url, title, onClose }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  // Reset loading when URL changes
  useEffect(() => {
    if (visible && url) {
      setLoading(true);
      console.log('WebViewModal: Opening URL:', url, 'Visible:', visible);
    }
  }, [visible, url]);

  if (!url || !visible || !WebView) {
    return null;
  }

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.5}
      useNativeDriverForBackdrop={Platform.OS === 'android'}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text isMediumTitle style={styles.title}>
            {title || 'Web View'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <CloseSvgIcon size={scale(24)} color={colors.appTextColor1} />
          </TouchableOpacity>
        </View>

        {/* WebView */}
        <View style={styles.webViewContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.appPrimaryColor} />
            </View>
          )}
          {WebView && (
            <WebView
            source={{ uri: url }}
            onLoadStart={() => {
              console.log('WebView: Load started for', url);
              setLoading(true);
            }}
            onLoadEnd={() => {
              console.log('WebView: Load ended for', url);
              setLoading(false);
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              setLoading(false);
            }}
            style={styles.webView}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.appPrimaryColor} />
              </View>
            )}
            onShouldStartLoadWithRequest={(request) => {
              // Allow navigation within the same domain
              const shouldLoad = request.url.startsWith('https://desires.app') || request.url === url;
              console.log('WebView: Should load?', shouldLoad, 'URL:', request.url);
              return shouldLoad;
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={true}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.appBgColor1,
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    height: responsiveHeight(90),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: colors.appBorderColor2,
    backgroundColor: colors.appBgColor1,
  },
  title: {
    flex: 1,
    marginRight: scale(10),
  },
  closeButton: {
    padding: scale(5),
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: colors.appBgColor1,
  },
  webView: {
    flex: 1,
    backgroundColor: colors.appBgColor1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.appBgColor1,
  },
});

export default WebViewModal;

