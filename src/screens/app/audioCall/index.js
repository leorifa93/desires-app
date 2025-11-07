import {ImageBackground, StyleSheet, View, Alert, PermissionsAndroid, Platform, TouchableOpacity} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import {Icons, Spacer, StatusBars, Text, Wrapper} from '../../../components';
import {useHooks} from './hooks';
import {
  appIcons,
  appImages,
  appSvgs,
  appStyles,
  colors,
  responsiveHeight,
  responsiveWidth,
} from '../../../services';
import {scale} from 'react-native-size-matters';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import {useSelector} from 'react-redux';
import {goBack, navigate} from '../../../navigation/rootNavigation';
import {routes} from '../../../services/constants';
import agoraService from '../../../services/agoraService';
import {useTranslation} from 'react-i18next';
import callMinutesService from '../../../services/callMinutesService';
import CallMinutesShopModal from '../../../components/modals/CallMinutesShopModal';
import { useCallContext } from '../../../contexts/CallContext';
import { updateCallLogStatus } from '../../../services/firebaseUtilities/callLogs';
import firestore from '@react-native-firebase/firestore';

export default function Index({route}) {
  const { t } = useTranslation();
  const callContext = useCallContext();
  const { startCall, endCall: endCallContext, minimizeCall, activeCall } = callContext;
  const [callStatus, setCallStatus] = useState('initializing');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [showCallMinutesShop, setShowCallMinutesShop] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const isMinimizingRef = React.useRef(false);
  const callInitializedRef = React.useRef(false);
  const lastCallIdRef = React.useRef(null);
  const activeCallRef = React.useRef(null);
  const minutesTrackingStartedRef = React.useRef(false);
  const callLogIdRef = React.useRef(null);
  const callStartTimeRef = React.useRef(null);
  
  // Keep activeCallRef in sync
  React.useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);
  
  // Support both userId and otherUserId params
  const { userId, otherUserId, channelName: providedChannelName, callId, isReceiver, isReturningFromFAB } = route.params || {};
  const otherUserIdFinal = userId || otherUserId;
  const user = useSelector(state => state.auth.user);
  
  // Convert string user ID to number for Agora UID
  const stringToUid = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };
  
  const myAgoraUid = user?.id ? stringToUid(user.id) : 0;
  
  console.log('AudioCall: Route params - isReturningFromFAB:', isReturningFromFAB);
  console.log('AudioCall: My Agora UID:', myAgoraUid);
  
  // Reset callInitialized when callId changes (new call)
  if (lastCallIdRef.current !== callId) {
    console.log('AudioCall: New call detected, resetting flags. Old:', lastCallIdRef.current, 'New:', callId);
    callInitializedRef.current = false;
    minutesTrackingStartedRef.current = false;
    lastCallIdRef.current = callId;
  }
  
  console.log('AudioCall: Render - isReceiver:', isReceiver, 'callId:', callId, 'callInitialized:', callInitializedRef.current);
  console.log('AudioCall: Render - activeCall exists:', !!activeCall, 'activeCall.callId:', activeCall?.callId);

  // Load other user data IMMEDIATELY
  useEffect(() => {
    if (otherUserIdFinal) {
      const loadOtherUser = async () => {
        try {
          const firestore = require('@react-native-firebase/firestore').default;
          const userDoc = await firestore().collection('Users').doc(otherUserIdFinal).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('AudioCall: Loaded other user:', userData.username);
            setOtherUser(userData);
          } else {
            console.warn('AudioCall: Other user not found');
          }
        } catch (error) {
          console.error('AudioCall: Failed to load other user:', error);
        }
      };
      loadOtherUser();
    }
  }, [otherUserIdFinal]);

  // Listen to remaining call minutes in real-time (only for caller)
  useEffect(() => {
    if (!isReceiver && user?.id && callStatus === 'connected') {
      const firestore = require('@react-native-firebase/firestore').default;
      const unsubscribe = firestore()
        .collection('Users')
        .doc(user.id)
        .onSnapshot((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            const minutes = callMinutesService.getAvailableMinutes(userData);
            setRemainingMinutes(minutes);
          }
        });
      
      return () => unsubscribe();
    }
  }, [user?.id, isReceiver, callStatus]);

  // Register call in context when otherUser is loaded and call is connected
  useEffect(() => {
    if (otherUser && callStatus === 'connected' && !activeCall) {
      console.log('AudioCall: otherUser loaded and call connected - registering in context');
      console.log('AudioCall: otherUser:', otherUser.username);
      startCall({
        type: 'audio',
        otherUserId: otherUserIdFinal,
        otherUser: otherUser,
        channelName: providedChannelName || [user.id, otherUserIdFinal].sort().join('_'),
        callId: callId,
        isReceiver: isReceiver,
      });
    }
  }, [otherUser, callStatus, activeCall]);

  // Register event handlers when call is connected (for both fresh and returning calls)
  useEffect(() => {
    if (callStatus === 'connected') {
      console.log('AudioCall: Call is connected - registering/re-registering event handlers');
      agoraService.registerEventHandlers({
        onUserOffline: (connection, uid, reason) => {
          console.log('AudioCall: EVENT - Remote user left:', uid, 'reason:', reason);
          setCallStatus('ended');
          setTimeout(() => navigate(routes.bottomTab), 1000);
        },
        onLeaveChannel: (connection, stats) => {
          console.log('AudioCall: EVENT - Left channel');
          setCallStatus('ended');
        },
        onError: (err, msg) => {
          console.error('AudioCall: EVENT - Agora error:', err, msg);
          Alert.alert('Error', 'Call error occurred');
          navigate(routes.bottomTab);
        },
      });
      
      // Start call minutes tracking when connected (only for caller, only once)
      if (!isReceiver && user?.id && callId && !minutesTrackingStartedRef.current) {
        console.log('AudioCall: Call connected - starting call minutes tracking');
        minutesTrackingStartedRef.current = true;
        callMinutesService.startCallMinutesTracking(
          user.id,
          callId,
          handleCallMinutesEmpty
        );
      }
    }
  }, [callStatus]);

  useEffect(() => {
    console.log('AudioCall: Mount - otherUserIdFinal:', otherUserIdFinal, 'isReturningFromFAB:', isReturningFromFAB);
    console.log('AudioCall: callInitializedRef.current:', callInitializedRef.current);
    console.log('AudioCall: activeCall:', activeCall);
    console.log('AudioCall: activeCall?.callId:', activeCall?.callId, 'current callId:', callId);
    
    // Reset minimizing flag when component mounts
    isMinimizingRef.current = false;
    
    // Check if we're returning to an existing call
    // This happens when activeCall exists and is minimized
    const isReturningToExistingCall = activeCall && activeCall.isMinimized === true;
    
    if (isReturningToExistingCall) {
      console.log('AudioCall: Returning to minimized call - maximizing, skipping Agora init');
      console.log('AudioCall: activeCall.callId:', activeCall.callId, 'current callId:', callId);
      const { maximizeCall: maximize } = callContext;
      maximize();
      callInitializedRef.current = true; // Mark as initialized to prevent re-init
      
      // Set call status to connected since call is already running
      // This will trigger the event handlers registration via useEffect
      setCallStatus('connected');
      console.log('AudioCall: Set status to connected for existing call');
      
      return;
    }
    
    // For fresh calls, init Agora (only once per mount)
    if (otherUserIdFinal && user?.id && !callInitializedRef.current) {
      console.log('AudioCall: Fresh call - Initializing Agora');
      callInitializedRef.current = true;
      initAgoraCall();
    } else if (callInitializedRef.current) {
      console.log('AudioCall: Already initialized in this mount, skipping');
    }
    
    // Listen for call status changes (both caller and receiver need to know when call ends)
    let statusListener = null;
    if (callId) {
      const callService = require('../../../services/callService').default;
      statusListener = callService.listenForCallStatus(callId, (updatedCallData) => {
        console.log('AudioCall: Call status changed:', updatedCallData.status, 'isReceiver:', isReceiver);
        
        if (updatedCallData.status === 'accepted' && !isReceiver) {
          console.log('AudioCall: Call was accepted by receiver');
          setCallStatus('connected');
        } else if (updatedCallData.status === 'rejected' && !isReceiver) {
          console.log('AudioCall: Call was rejected by receiver');
          Alert.alert(t('CALL_REJECTED'), t('CALL_REJECTED_MESSAGE'));
          navigate(routes.bottomTab);
        } else if (updatedCallData.status === 'timeout' && !isReceiver) {
          console.log('AudioCall: Call timed out');
          Alert.alert(t('CALL_TIMEOUT'), t('NO_ANSWER'));
          navigate(routes.bottomTab);
        } else if (updatedCallData.status === 'ended') {
          console.log('AudioCall: Call ended by other party');
          // End call gracefully
          callMinutesService.stopCallMinutesTracking();
          minutesTrackingStartedRef.current = false;
          endCallContext();
          agoraService.endCall();
          navigate(routes.bottomTab);
        }
      });
    }
    
    return () => {
      // Check if call is minimized - if so, don't end it (use ref to get current value)
      const isCallMinimized = activeCallRef.current?.isMinimized === true;
      
      console.log('AudioCall: Cleanup - isMinimizing:', isMinimizingRef.current, 'isCallMinimized:', isCallMinimized);
      
      if (!isMinimizingRef.current && !isCallMinimized) {
        console.log('AudioCall: Cleanup on unmount - ending call');
        // Cleanup on unmount
        agoraService.endCall();
        
        // Remove status listener
        if (statusListener) {
          statusListener();
        }
        
        // End call in Firestore if this is a tracked call
        if (callId && !isReceiver) {
          const callService = require('../../../services/callService').default;
          callService.endCall(callId, 'ended').catch(err => console.error('Failed to end call in Firestore:', err));
        }
        
        // End call in context
        endCallContext();
        
        // Stop call minutes tracking
        callMinutesService.stopCallMinutesTracking();
        
        // Reset call initialized flag
        callInitializedRef.current = false;
      } else {
        console.log('AudioCall: Minimizing or call is minimized - keeping call alive');
        // Remove status listener but keep call alive
        if (statusListener) {
          statusListener();
        }
      }
    };
  }, [otherUserIdFinal, user?.id, callId, isReceiver]);

  const initAgoraCall = async () => {
    console.log('AudioCall: initAgoraCall called - isReceiver:', isReceiver);
    try {
      // Request permissions
      if (Platform.OS === 'android') {
        console.log('AudioCall: Requesting Android permissions...');
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        console.log('AudioCall: Permissions granted');
      }
      
      const newStatus = isReceiver ? 'connecting' : 'calling';
      console.log('AudioCall: Setting call status to:', newStatus);
      setCallStatus(newStatus);
      
      // Initialize Agora
      console.log('AudioCall: Initializing Agora...');
      await agoraService.init();
      console.log('AudioCall: Agora initialized');
      
      // Register event handlers BEFORE starting call
      console.log('AudioCall: Registering event handlers BEFORE starting call...');
      agoraService.registerEventHandlers({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('AudioCall: ✅ EVENT FIRED: onJoinChannelSuccess - isReceiver:', isReceiver);
          // Status is now set directly after startCall() completes
        },
        onUserJoined: (connection, uid, elapsed) => {
          console.log('AudioCall: Remote user joined:', uid);
          setRemoteUid(uid);
          setCallStatus('connected');
          
          // Register call in context for FAB (for both caller and receiver)
          if (otherUser) {
            console.log('AudioCall: Registering call in context with otherUser:', otherUser.username);
            startCall({
              type: 'audio',
              otherUserId: otherUserIdFinal,
              otherUser: otherUser,
              channelName: providedChannelName || [user.id, otherUserIdFinal].sort().join('_'),
              callId: callId,
              isReceiver: isReceiver,
            });
          } else {
            console.warn('AudioCall: otherUser not loaded yet when registering call');
          }
        },
        onUserOffline: (connection, uid, reason) => {
          console.log('AudioCall: Remote user left:', uid);
          setCallStatus('ended');
          setTimeout(() => navigate(routes.bottomTab), 1000);
        },
        onLeaveChannel: (connection, stats) => {
          console.log('AudioCall: Left channel');
          setCallStatus('ended');
        },
        onError: (err, msg) => {
          console.error('AudioCall: Agora error:', err, msg);
          Alert.alert('Error', 'Call error occurred');
          navigate(routes.bottomTab);
        },
      });
      
      // Use provided channel name or generate one
      const channelName = providedChannelName || [user.id, otherUserIdFinal].sort().join('_');
      
      // Start audio-only call with our specific UID
      console.log('AudioCall: Starting call with channel:', channelName, 'isAudioOnly: true, myUID:', myAgoraUid);
      await agoraService.startCall(channelName, true, myAgoraUid);
      
      console.log('AudioCall: ✅ Call started successfully with channel:', channelName);
      
      // Get call log ID from ActiveCall (created by callService)
      if (!isReceiver && callId) {
        try {
          callStartTimeRef.current = Date.now();
          const callDoc = await firestore().collection('ActiveCalls').doc(callId).get();
          const callData = callDoc.data();
          if (callData?.callLogId) {
            callLogIdRef.current = callData.callLogId;
            console.log('AudioCall: Using call log ID from ActiveCall:', callData.callLogId);
          }
        } catch (error) {
          console.error('AudioCall: Failed to get call log ID:', error);
        }
      }
      
      // Set status immediately after successful join
      if (isReceiver) {
        console.log('AudioCall: Receiver joined successfully - setting to connected');
        setCallStatus('connected');
        
        // Register call in context for receiver
        if (otherUser) {
          console.log('AudioCall: Registering receiver call in context');
          startCall({
            type: 'audio',
            otherUserId: otherUserIdFinal,
            otherUser: otherUser,
            channelName: channelName,
            callId: callId,
            isReceiver: isReceiver,
          });
        }
      } else {
        console.log('AudioCall: Caller joined successfully - setting status to ringing');
        setCallStatus('ringing');
      }
    } catch (error) {
      console.error('AudioCall: Failed to start call:', error);
      Alert.alert('Error', 'Failed to start audio call. Please try again.');
      navigate(routes.bottomTab);
    }
  };

  // Calculate call duration from activeCall.startTime
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  useEffect(() => {
    let interval;
    if (callStatus === 'connected') {
      console.log('AudioCall: Starting duration timer - activeCall.startTime:', activeCall?.startTime);
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }
    return () => {
      if (interval) {
        console.log('AudioCall: Clearing duration timer');
        clearInterval(interval);
      }
    };
  }, [callStatus, activeCall?.startTime]);
  
  const callDuration = activeCall?.startTime 
    ? Math.floor((currentTime - activeCall.startTime) / 1000)
    : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = useCallback(async () => {
    try {
      console.log('AudioCall: Ending call...');
      
      // Make sure we're not in minimizing mode
      isMinimizingRef.current = false;
      
      // Reset call initialized flag
      callInitializedRef.current = false;
      
      // Stop call minutes tracking
      callMinutesService.stopCallMinutesTracking();
      minutesTrackingStartedRef.current = false;
      
      // Update call log with duration (only for caller)
      if (!isReceiver && callLogIdRef.current && callStartTimeRef.current) {
        try {
          const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000); // in seconds
          await updateCallLogStatus(callLogIdRef.current, {
            status: 'ended',
            duration
          });
          console.log('AudioCall: Call log updated - duration:', duration, 'seconds');
          callLogIdRef.current = null;
          callStartTimeRef.current = null;
        } catch (error) {
          console.error('AudioCall: Failed to update call log:', error);
        }
      }
      
      // End call in context
      endCallContext();
      
      setCallStatus('ended');
      await agoraService.endCall();
      
      // End call in Firestore if this is a tracked call
      if (callId) {
        const callService = require('../../../services/callService').default;
        await callService.endCall(callId, 'ended');
      }
      
      // Navigate to bottom tab instead of goBack
      navigate(routes.bottomTab);
    } catch (error) {
      console.error('AudioCall: Failed to end call:', error);
      navigate(routes.bottomTab);
    }
  }, [isReceiver, callId, endCallContext]);

  const handleCallMinutesEmpty = useCallback(async () => {
    console.log('AudioCall: ⚠️⚠️⚠️ Call minutes empty - ending call');
    
    // End the call first
    await handleEndCall();
    
    // Show alert with option to buy more minutes
    setTimeout(() => {
      callMinutesService.showMinutesEmptyAlert(
        () => setShowCallMinutesShop(true),
        t
      );
    }, 500);
  }, [handleEndCall, t]);

  const handleMinimizeCall = () => {
    console.log('AudioCall: Minimizing call');
    isMinimizingRef.current = true;
    
    // Make sure otherUser is in the call data
    if (otherUser) {
      console.log('AudioCall: Updating call context with otherUser:', otherUser.username);
      startCall({
        type: 'audio',
        otherUserId: otherUserIdFinal,
        otherUser: otherUser,
        channelName: providedChannelName || [user.id, otherUserIdFinal].sort().join('_'),
        callId: callId,
        isReceiver: isReceiver,
      });
    }
    
    minimizeCall();
    goBack();
  };

  const handleMuteToggle = async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    await agoraService.toggleMute(newMutedState);
  };

  const handleSpeakerToggle = async () => {
    const newSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(newSpeakerState);
    await agoraService.enableSpeakerphone(newSpeakerState);
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'initializing':
        return t('CALL_INITIALIZING');
      case 'calling':
        return t('CALL_CALLING');
      case 'connecting':
        return t('CALL_CONNECTING');
      case 'ringing':
        return t('CALL_RINGING');
      case 'connected':
        return t('CALL_CONNECTED');
      case 'ended':
        return t('CALL_ENDED');
      default:
        return t('CALL_UNKNOWN_STATUS');
    }
  };

  const getBackgroundImage = () => {
    if (otherUser?.profilePictures) {
      if (otherUser.profilePictures.thumbnails?.medium) {
        console.log('AudioCall: Using medium thumbnail for background');
        return { uri: otherUser.profilePictures.thumbnails.medium };
      }
      if (otherUser.profilePictures.medium) {
        console.log('AudioCall: Using medium for background');
        return { uri: otherUser.profilePictures.medium };
      }
      if (otherUser.profilePictures.original) {
        console.log('AudioCall: Using original for background');
        return { uri: otherUser.profilePictures.original };
      }
    }
    console.log('AudioCall: Using fallback image for background, otherUser:', otherUser?.username);
    return appImages.image4;
  };

  return (
    <ImageBackground
      source={getBackgroundImage()}
      style={{flex: 1}}
      blurRadius={35}>
      {/* Dark overlay for better text visibility */}
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />
      
      <StatusBars.Light />
      <Spacer isStatusBarHeigt />
      
      {/* Header */}
      <Wrapper
        flexDirectionRow
        alignItemsCenter
        marginHorizontalBase
        justifyContentSpaceBetween
        style={{ zIndex: 1 }}>
        <Icons.Button
          isRound
          customIcon={appIcons.Down}
          iconSize={scale(22)}
          customPadding={responsiveWidth(2.5)}
          isWithBorder
          buttonColor={colors.appBgColor1}
          onPress={handleMinimizeCall}
        />
        
        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
          <Text style={[styles.statusText, { textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4, color: '#FFFFFF' }]}>
            {getStatusText()}
          </Text>
          {!isReceiver && callStatus === 'connected' && (
            <View style={styles.minutesBadge}>
              <Text style={styles.minutesText}>
                {remainingMinutes} {t('MINUTES')}
              </Text>
            </View>
          )}
        </View>
        
        <Menu>
          <MenuTrigger>
            <Icons.Button
              isRound
              customIcon={appIcons.Menu}
              iconSize={scale(22)}
              customPadding={responsiveWidth(2.5)}
              isWithBorder
              buttonColor={colors.appBgColor1}
            />
          </MenuTrigger>
          <MenuOptions
            optionsContainerStyle={[
              styles.OptionMainContainer,
              {marginTop: scale(50), marginLeft: -scale(20)},
            ]}>
            {['Send Message', 'Convert to Video'].map((item, index) => (
              <MenuOption
                key={index}
                onSelect={() => {
                  Alert.alert('Info', `${item} feature coming soon`);
                }}
                customStyles={{
                  optionWrapper: {
                    paddingVertical: scale(8),
                  },
                }}>
                <Text isSmall isRegularFont>
                  {item}
                </Text>
              </MenuOption>
            ))}
          </MenuOptions>
        </Menu>
      </Wrapper>
      
      <Spacer isDoubleBase />
      
      {/* Call Duration */}
      {callStatus === 'connected' && (
        <Wrapper alignItemsCenter style={{ zIndex: 1 }}>
          <Text style={[styles.durationText, { textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }]}>
            {formatTime(callDuration)}
          </Text>
        </Wrapper>
      )}
      
      {/* the Image and call time  */}
      <Wrapper
        alignItemsCenter
        style={{ zIndex: 1 }}>
        <Wrapper
          style={{
            borderRadius: scale(80),
            borderWidth: 4,
            borderColor: '#FFFFFF',
            padding: 5,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
          <View
            style={{
              width: scale(145),
              height: scale(145),
              borderRadius: scale(75),
              overflow: 'hidden',
            }}
          >
            <ImageBackground
              source={
                otherUser?.profilePictures?.thumbnails?.medium
                  ? { uri: otherUser.profilePictures.thumbnails.medium }
                  : otherUser?.profilePictures?.medium
                  ? { uri: otherUser.profilePictures.medium }
                  : otherUser?.profilePictures?.original
                  ? { uri: otherUser.profilePictures.original }
                  : appImages.image4
              }
              style={{
                width: scale(145),
                height: scale(145),
              }}
              resizeMode="cover"
            />
          </View>
        </Wrapper>
        
        <Spacer height={responsiveHeight(3)} />
        
        <Text style={[styles.callTypeText, { textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }]}>
          {otherUser?.username || 'User'}
        </Text>
        <Text style={[styles.statusText, { textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }]}>
          {getStatusText()}
        </Text>
        
        {callStatus === 'connected' && (
          <Text style={[styles.durationText, { textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }]}>
            {formatTime(callDuration)}
          </Text>
        )}
      </Wrapper>

      {/* Collapsible Controls Container */}
      {(callStatus === 'connected' || callStatus === 'calling' || callStatus === 'ringing' || callStatus === 'connecting') && (
        <View style={styles.controlsWrapper}>
          {/* Animated Controls */}
          <View style={styles.controlsBlur}>
            <View style={styles.controlsContent}>
              {/* Mute Button */}
              <View style={styles.controlButtonWrapper}>
                <TouchableOpacity
                  onPress={handleMuteToggle}
                  style={styles.controlButton}
                >
                  <View style={[styles.iconCircle, isMuted && styles.iconCircleActive]}>
                    {isMuted ? (
                      <Icons.Svg svg={appSvgs.micOff} size={scale(28)} />
                    ) : (
                      <Text style={styles.controlIcon}>🎤</Text>
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={styles.controlLabel}>{isMuted ? t('CALL_UNMUTE') : t('CALL_MUTE')}</Text>
              </View>
              
              {/* Speaker Button */}
              <View style={styles.controlButtonWrapper}>
                <TouchableOpacity
                  onPress={handleSpeakerToggle}
                  style={styles.controlButton}
                >
                  <View style={styles.iconCircle}>
                    <Text style={styles.controlIcon}>{isSpeakerOn ? '🔊' : '🔈'}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.controlLabel}>{isSpeakerOn ? t('CALL_SPEAKER_ON') : t('CALL_SPEAKER_OFF')}</Text>
              </View>
              
              {/* End Call Button */}
              <View style={styles.controlButtonWrapper}>
                <TouchableOpacity
                  onPress={handleEndCall}
                  style={styles.controlButton}
                >
                  <View style={[styles.iconCircle, styles.iconCircleEnd]}>
                    <Icons.Svg svg={appSvgs.callEnd} size={scale(32)} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.controlLabel}>{t('CALL_END')}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
      
      {/* Call Minutes Shop Modal */}
      <CallMinutesShopModal
        visible={showCallMinutesShop}
        onClose={() => setShowCallMinutesShop(false)}
        onSuccess={(minutes) => {
          console.log('AudioCall: Purchased', minutes, 'call minutes');
          setShowCallMinutesShop(false);
        }}
      />
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  OptionMainContainer: {
    //height: responsiveHeight(18),
    width: responsiveWidth(40),
    backgroundColor: colors.appBgColor1,
    ...appStyles.shadowDark,
    borderRadius: responsiveWidth(3),
    padding: scale(18),
    //zIndex: 2,
  },
  statusText: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  durationText: {
    fontSize: scale(40),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  callTypeText: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  controlButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: scale(68),
    height: scale(68),
    borderRadius: scale(34),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    backgroundColor: colors.error || '#FF3B30',
  },
  iconCircleEnd: {
    backgroundColor: colors.appPrimaryColor,
  },
  controlIcon: {
    fontSize: scale(28),
  },
  minutesBadge: {
    backgroundColor: colors.appPrimaryColor,
    paddingHorizontal: scale(12),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    marginTop: scale(5),
  },
  minutesText: {
    color: '#fff',
    fontSize: scale(12),
    fontWeight: 'bold',
  },
  controlButtonWrapper: {
    alignItems: 'center',
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: scale(12),
    marginTop: scale(5),
    fontWeight: '500',
  },
  controlsWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  controlsBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(20px)',
    borderRadius: scale(25),
    paddingVertical: scale(20),
    paddingHorizontal: scale(30),
    alignSelf: 'center',
    marginHorizontal: scale(20),
    marginBottom: scale(20),
  },
  controlsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: scale(20),
  },
});

