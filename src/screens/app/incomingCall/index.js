import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Vibration, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Wrapper, Icons, Text, Spacer } from '../../../components';
import { appStyles, colors, sizes, appIcons } from '../../../services';
import { scale } from 'react-native-size-matters';
import callService from '../../../services/callService';
import { routes } from '../../../services/constants';
import { useTranslation } from 'react-i18next';
import { navigate } from '../../../navigation/rootNavigation';

const IncomingCall = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { callData } = route.params || {};
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    // Vibrate phone when call comes in
    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 1000, 1000, 1000], true); // Continuous vibration pattern
    } else {
      Vibration.vibrate([0, 1000, 500, 1000, 500, 1000], true); // Android pattern
    }

    // Listen for call status changes
    const unsubscribe = callService.listenForCallStatus(callData?.callId, (updatedCallData) => {
      console.log('IncomingCall: Call status changed:', updatedCallData.status);
      
      if (updatedCallData.status === 'ended' || updatedCallData.status === 'timeout') {
        // Call ended or timed out, go back to bottom tab
        Vibration.cancel();
        navigate(routes.bottomTab);
      }
    });

    return () => {
      Vibration.cancel();
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [callData?.callId]);

  const handleAccept = async () => {
    if (isAccepting) return;
    
    try {
      setIsAccepting(true);
      Vibration.cancel();
      
      // Accept the call in Firestore
      await callService.acceptCall(callData.callId);
      
      // Navigate to appropriate call screen
      if (callData.isAudioOnly) {
        navigation.replace(routes.audioCall, {
          userId: callData.callerId,
          channelName: callData.channelName,
          callId: callData.callId,
          isReceiver: true,
        });
      } else {
        navigation.replace(routes.videoCall, {
          userId: callData.callerId,
          channelName: callData.channelName,
          callId: callData.callId,
          isReceiver: true,
        });
      }
    } catch (error) {
      console.error('IncomingCall: Error accepting call:', error);
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    try {
      Vibration.cancel();
      
      // Reject the call
      await callService.rejectCall(callData.callId);
      
      // Navigate to bottom tab
      navigate(routes.bottomTab);
    } catch (error) {
      console.error('IncomingCall: Error rejecting call:', error);
      navigate(routes.bottomTab);
    }
  };

  if (!callData) {
    navigate(routes.bottomTab);
    return null;
  }

  return (
    <Wrapper
      isImageBackground
      source={
        callData.callerData?.profilePicture
          ? { uri: callData.callerData.profilePicture }
          : null
      }
      style={{ flex: 1 }}
    >
      {/* Dark overlay for better readability */}
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}
      />
      
      <Wrapper flex={1} alignItemsCenter justifyContentCenter style={{ zIndex: 1 }}>
        {/* Caller Name */}
        <Text 
          isLargeTitle 
          isBold 
          style={{ 
            color: '#FFFFFF', 
            textShadowColor: 'rgba(0, 0, 0, 0.8)', 
            textShadowOffset: { width: 0, height: 2 }, 
            textShadowRadius: 6,
            fontSize: scale(32),
          }}
        >
          {callData.callerData?.username || t('UNKNOWN')}
        </Text>

        <Spacer height={scale(8)} />

        {/* Call Type */}
        <Text isMedium style={{ color: '#FFFFFF', textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
          {callData.isAudioOnly ? `📞 ${t('INCOMING_AUDIO_CALL')}` : `📹 ${t('INCOMING_VIDEO_CALL')}`}
        </Text>

        <Spacer height={scale(60)} />

        {/* Action Buttons */}
        <Wrapper flexDirectionRow style={{ gap: scale(60) }}>
          {/* Reject Button */}
          <TouchableOpacity
            onPress={handleReject}
            style={[styles.callButton, { backgroundColor: 'transparent' }]}
            activeOpacity={0.7}
          >
            <Icons.Custom
              icon={require('../../../assets/icons/call-end-red.png')}
              size={scale(70)}
              style={{ width: scale(70), height: scale(70) }}
            />
          </TouchableOpacity>

          {/* Accept Button */}
          <TouchableOpacity
            onPress={handleAccept}
            disabled={isAccepting}
            style={[
              styles.callButton,
              { backgroundColor: 'transparent' },
              isAccepting && { opacity: 0.6 },
            ]}
            activeOpacity={0.7}
          >
            <Icons.Custom
              icon={require('../../../assets/icons/call-accept.png')}
              size={scale(70)}
              style={{ width: scale(70), height: scale(70) }}
            />
          </TouchableOpacity>
        </Wrapper>
      </Wrapper>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  callButton: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IncomingCall;

