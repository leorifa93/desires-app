import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import CallButtons from './CallButtons';
import callService from '../services/callService';
import callMinutesService from '../services/callMinutesService';
import { routes } from '../services/constants';

const ProfileCallButtons = ({ userId, username, disabled = false }) => {
  const navigation = useNavigation();
  const user = useSelector(state => state.auth.user);

  const handleAudioCall = async () => {
    if (!user || !userId) {
      console.log('Call: Missing user data');
      return;
    }

    try {
      if (!callMinutesService.hasCallMinutes(user)) {
        // open shop via navigation so user can buy coins/minutes
        navigation.navigate(routes.buyCoins);
        return;
      }
      console.log('Call: Initiating audio call to:', userId);
      
      // Initiate call in Firestore and send push notification
      const { callId, channelName } = await callService.initiateCall(
        user.id,
        userId,
        user,
        true // isAudioOnly
      );
      
      console.log('Call: Call initiated, navigating to audio call screen');
      
      // Navigate to audio call screen
      navigation.navigate(routes.audioCall, {
        userId,
        channelName,
        callId,
        isReceiver: false,
      });
    } catch (error) {
      console.error('Failed to start audio call:', error);
      if (error?.code === 'NO_MINUTES') {
        navigation.navigate(routes.buyCoins);
      }
    }
  };

  const handleVideoCall = async () => {
    if (!user || !userId) {
      console.log('Call: Missing user data');
      return;
    }

    try {
      if (!callMinutesService.hasCallMinutes(user)) {
        navigation.navigate(routes.buyCoins);
        return;
      }
      console.log('Call: Initiating video call to:', userId);
      
      // Initiate call in Firestore and send push notification
      const { callId, channelName } = await callService.initiateCall(
        user.id,
        userId,
        user,
        false // isAudioOnly
      );
      
      console.log('Call: Call initiated, navigating to video call screen');
      
      // Navigate to video call screen
      navigation.navigate(routes.videoCall, {
        userId,
        channelName,
        callId,
        isReceiver: false,
      });
    } catch (error) {
      console.error('Failed to start video call:', error);
      if (error?.code === 'NO_MINUTES') {
        navigation.navigate(routes.buyCoins);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CallButtons
        onAudioCall={handleAudioCall}
        onVideoCall={handleVideoCall}
        disabled={disabled || !user}
        size="medium"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
});

export default ProfileCallButtons;

