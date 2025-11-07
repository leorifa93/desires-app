import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useCallContext } from '../contexts/CallContext';
import { colors } from '../services';
import { scale } from 'react-native-size-matters';
import { navigate } from '../navigation/rootNavigation';
import { routes } from '../services/constants';
import { appImages, appSvgs } from '../services/utilities/assets';
import agoraService from '../services/agoraService';
import callMinutesService from '../services/callMinutesService';
import { Icons } from '../components';

const FloatingCallWidget = () => {
  const { activeCall, endCall } = useCallContext();
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!activeCall || !activeCall.isMinimized) {
      return;
    }

    // Update time every second for duration display
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCall]);

  if (!activeCall || !activeCall.isMinimized) {
    return null;
  }

  const handlePress = () => {
    console.log('FloatingCallWidget: Returning to call screen');
    
    // Navigate back to call screen (don't maximize yet - let the screen do it)
    if (activeCall.type === 'video') {
      navigate(routes.videoCall, {
        userId: activeCall.otherUserId,
        channelName: activeCall.channelName,
        callId: activeCall.callId,
        isReceiver: activeCall.isReceiver,
        isReturningFromFAB: true,
      });
    } else {
      navigate(routes.audioCall, {
        userId: activeCall.otherUserId,
        channelName: activeCall.channelName,
        callId: activeCall.callId,
        isReceiver: activeCall.isReceiver,
        isReturningFromFAB: true,
      });
    }
  };

  const handleEndCall = async (e) => {
    e.stopPropagation();
    console.log('FloatingCallWidget: Ending call');
    
    try {
      // Stop call minutes tracking
      callMinutesService.stopCallMinutesTracking();
      
      // End call in context
      endCall();
      
      // End Agora call
      await agoraService.endCall();
      
      // End call in Firestore
      if (activeCall.callId) {
        const callService = require('../services/callService').default;
        await callService.endCall(activeCall.callId, 'ended');
      }
    } catch (error) {
      console.error('FloatingCallWidget: Error ending call:', error);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const duration = activeCall.startTime 
    ? Math.floor((currentTime - activeCall.startTime) / 1000)
    : 0;

  // Get the correct avatar source
  const avatarSource = activeCall.otherUser?.profilePictures?.thumbnails?.medium
    ? { uri: activeCall.otherUser.profilePictures.thumbnails.medium }
    : activeCall.otherUser?.profilePictures?.medium
    ? { uri: activeCall.otherUser.profilePictures.medium }
    : activeCall.otherUser?.profilePictures?.original
    ? { uri: activeCall.otherUser.profilePictures.original }
    : appImages.image4;

  return (
    <TouchableOpacity
      style={styles.widget}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.content}>
        <Image
          source={avatarSource}
          style={styles.avatar}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {activeCall.otherUser?.username || 'Unknown'}
          </Text>
          <Text style={styles.duration}>
            {formatDuration(duration)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.endCallButton}
          onPress={handleEndCall}
        >
          <Icons.Svg svg={appSvgs.callEnd} size={scale(20)} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  widget: {
    position: 'absolute',
    bottom: scale(80),
    left: scale(20),
    right: scale(20),
    backgroundColor: colors.appPrimaryColor,
    borderRadius: scale(30),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
  },
  avatar: {
    width: scale(45),
    height: scale(45),
    borderRadius: scale(22.5),
    backgroundColor: colors.appBgColor2,
  },
  info: {
    flex: 1,
    marginLeft: scale(12),
  },
  name: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  duration: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: scale(13),
    marginTop: scale(2),
  },
  endCallButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(10),
  },
});

export default FloatingCallWidget;

