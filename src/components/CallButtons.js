import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const CallButtons = ({ 
  onAudioCall, 
  onVideoCall, 
  disabled = false,
  size = 'medium' 
}) => {
  const { t } = useTranslation();

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { button: 40, icon: 20 };
      case 'large':
        return { button: 70, icon: 35 };
      default:
        return { button: 55, icon: 28 };
    }
  };

  const { button: buttonSize, icon: iconSize } = getButtonSize();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          styles.audioButton,
          { width: buttonSize, height: buttonSize },
          disabled && styles.disabledButton
        ]}
        onPress={onAudioCall}
        disabled={disabled}
      >
        <Image
          source={require('../assets/icons/audio-call.png')}
          style={[styles.buttonIcon, { width: iconSize, height: iconSize }]}
          tintColor={disabled ? '#ccc' : '#fff'}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.videoButton,
          { width: buttonSize, height: buttonSize },
          disabled && styles.disabledButton
        ]}
        onPress={onVideoCall}
        disabled={disabled}
      >
        <Image
          source={require('../assets/icons/video-call.png')}
          style={[styles.buttonIcon, { width: iconSize, height: iconSize }]}
          tintColor={disabled ? '#ccc' : '#fff'}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 15,
  },
  button: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  audioButton: {
    backgroundColor: '#4CAF50',
  },
  videoButton: {
    backgroundColor: '#2196F3',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonIcon: {
    tintColor: '#fff',
  },
});

export default CallButtons;

