import {ImageBackground, StyleSheet, View, Alert, PermissionsAndroid, Platform, TouchableOpacity, Animated} from 'react-native';
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
import {Position} from '..';
import {BlurView} from '@react-native-community/blur';
import {useSelector} from 'react-redux';
import {goBack, navigate} from '../../../navigation/rootNavigation';
import {routes} from '../../../services/constants';
import agoraService from '../../../services/agoraService';
import {RtcSurfaceView} from 'react-native-agora';
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
  const [blurStart, setBlurStart] = useState(false);
  const [callStatus, setCallStatus] = useState('initializing');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [remoteUid, setRemoteUid] = useState(null);
  const [isRemoteVideoEnabled, setIsRemoteVideoEnabled] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [controlsAnimation] = useState(new Animated.Value(1));
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
  const otherUserAgoraUid = otherUserIdFinal ? stringToUid(otherUserIdFinal) : null;
  
  console.log('VideoCall: My Agora UID:', myAgoraUid, 'Other User Agora UID:', otherUserAgoraUid);
  
  console.log('VideoCall: Route params - isReturningFromFAB:', isReturningFromFAB);
  
  // Reset callInitialized when callId changes (new call)
  if (lastCallIdRef.current !== callId) {
    console.log('VideoCall: New call detected, resetting flags. Old:', lastCallIdRef.current, 'New:', callId);
    callInitializedRef.current = false;
    minutesTrackingStartedRef.current = false;
    lastCallIdRef.current = callId;
  }
  
  console.log('VideoCall: Render - isReceiver:', isReceiver, 'callId:', callId, 'callInitialized:', callInitializedRef.current);

  // Load other user data
  useEffect(() => {
    if (otherUserIdFinal) {
      const loadOtherUser = async () => {
        try {
          const firestore = require('@react-native-firebase/firestore').default;
          const userDoc = await firestore().collection('Users').doc(otherUserIdFinal).get();
          if (userDoc.exists) {
            setOtherUser(userDoc.data());
          }
        } catch (error) {
          console.error('Failed to load other user:', error);
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
      console.log('VideoCall: otherUser loaded and call connected - registering in context');
      console.log('VideoCall: otherUser:', otherUser.username);
      startCall({
        type: 'video',
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
      console.log('VideoCall: Call is connected - registering/re-registering event handlers');
      agoraService.registerEventHandlers({
        onUserOffline: (connection, uid, reason) => {
          console.log('VideoCall: EVENT - Remote user left:', uid, 'reason:', reason);
          setCallStatus('ended');
          setTimeout(() => navigate(routes.bottomTab), 1000);
        },
        onLeaveChannel: (connection, stats) => {
          console.log('VideoCall: EVENT - Left channel');
          setCallStatus('ended');
        },
        onError: (err, msg) => {
          console.error('VideoCall: EVENT - Agora error:', err, msg);
          Alert.alert('Error', 'Call error occurred');
          navigate(routes.bottomTab);
        },
      });
      
      // Start call minutes tracking when connected (only for caller, only once)
      if (!isReceiver && user?.id && callId && !minutesTrackingStartedRef.current) {
        console.log('VideoCall: Call connected - starting call minutes tracking');
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
    setTimeout(() => setBlurStart(true), 150);
    
    console.log('VideoCall: Mount - otherUserIdFinal:', otherUserIdFinal, 'isReturningFromFAB:', isReturningFromFAB);
    console.log('VideoCall: callInitializedRef.current:', callInitializedRef.current);
    console.log('VideoCall: activeCall:', activeCall);
    console.log('VideoCall: activeCall?.callId:', activeCall?.callId, 'current callId:', callId);
    
    // Reset minimizing flag when component mounts
    isMinimizingRef.current = false;
    
    // Check if we're returning to an existing call
    // This happens when activeCall exists and is minimized
    const isReturningToExistingCall = activeCall && activeCall.isMinimized === true;
    
    if (isReturningToExistingCall) {
      console.log('VideoCall: Returning to minimized call - maximizing, skipping Agora init');
      console.log('VideoCall: activeCall.callId:', activeCall.callId, 'current callId:', callId);
      const { maximizeCall: maximize } = callContext;
      maximize();
      callInitializedRef.current = true; // Mark as initialized to prevent re-init
      
      // Set call status to connected since call is already running
      // This will trigger the event handlers registration via useEffect
      setCallStatus('connected');
      console.log('VideoCall: Set status to connected for existing call');
      
      return;
    }
    
    // For fresh calls, init Agora (only once per mount)
    if (otherUserIdFinal && user?.id && !callInitializedRef.current) {
      console.log('VideoCall: Fresh call - Initializing Agora');
      callInitializedRef.current = true;
      initAgoraCall();
    } else if (callInitializedRef.current) {
      console.log('VideoCall: Already initialized in this mount, skipping');
    }
    
    // Listen for call status changes (if caller is waiting for acceptance)
    let statusListener = null;
    if (callId) {
      console.log('VideoCall: Setting up status listener for callId:', callId, 'isReceiver:', isReceiver);
      const callService = require('../../../services/callService').default;
      statusListener = callService.listenForCallStatus(callId, (updatedCallData) => {
        console.log('VideoCall: Call status changed:', updatedCallData.status, 'Current status:', callStatus, 'isReceiver:', isReceiver);
        
        if (updatedCallData.status === 'accepted' && !isReceiver) {
          console.log('VideoCall: Call was accepted by receiver - setting status to connected');
          setCallStatus('connected');
        } else if (updatedCallData.status === 'rejected' && !isReceiver) {
          console.log('VideoCall: Call was rejected by receiver');
          Alert.alert(t('CALL_REJECTED'), t('CALL_REJECTED_MESSAGE'));
          navigate(routes.bottomTab);
        } else if (updatedCallData.status === 'timeout' && !isReceiver) {
          console.log('VideoCall: Call timed out');
          Alert.alert(t('CALL_TIMEOUT'), t('NO_ANSWER'));
          navigate(routes.bottomTab);
        } else if (updatedCallData.status === 'ended') {
          console.log('VideoCall: Call ended by other party');
          // End call gracefully
          callMinutesService.stopCallMinutesTracking();
          minutesTrackingStartedRef.current = false;
          endCallContext();
          agoraService.endCall();
          navigate(routes.bottomTab);
        }
      });
    } else {
      console.log('VideoCall: No status listener needed - no callId');
    }
    
    return () => {
      // Check if call is minimized - if so, don't end it (use ref to get current value)
      const isCallMinimized = activeCallRef.current?.isMinimized === true;
      
      console.log('VideoCall: Cleanup - isMinimizing:', isMinimizingRef.current, 'isCallMinimized:', isCallMinimized);
      
      if (!isMinimizingRef.current && !isCallMinimized) {
        console.log('VideoCall: Cleanup on unmount - ending call');
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
        console.log('VideoCall: Minimizing or call is minimized - keeping call alive');
        // Remove status listener but keep call alive
        if (statusListener) {
          statusListener();
        }
      }
    };
  }, [otherUserIdFinal, user?.id, callId, isReceiver]);

  const initAgoraCall = async () => {
    try {
      // Request permissions
      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
      }
      
      setCallStatus(isReceiver ? 'connecting' : 'calling');
      
      // Initialize Agora
      await agoraService.init();
      
      // Register event handlers
      agoraService.registerEventHandlers({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('VideoCall: ✅ EVENT FIRED: onJoinChannelSuccess - isReceiver:', isReceiver);
          // Status is now set directly after startCall() completes
        },
        onUserJoined: (connection, uid, elapsed) => {
          console.log('VideoCall: ✅ onUserJoined EVENT - Remote user joined:', uid, 'isReceiver:', isReceiver, 'elapsed:', elapsed);
          console.log('VideoCall: Setting remoteUid to:', uid);
          setRemoteUid(uid);
          setCallStatus('connected');
          
          // Register call in context for FAB (for both caller and receiver)
          if (otherUser) {
            console.log('VideoCall: Registering call in context with otherUser:', otherUser.username);
            startCall({
              type: 'video',
              otherUserId: otherUserIdFinal,
              otherUser: otherUser,
              channelName: providedChannelName || [user.id, otherUserIdFinal].sort().join('_'),
              callId: callId,
              isReceiver: isReceiver,
            });
          } else {
            console.warn('VideoCall: otherUser not loaded yet when registering call');
          }
        },
        onRemoteVideoStateChanged: (connection, remoteUid, state, reason, elapsed) => {
          console.log('VideoCall: ✅ onRemoteVideoStateChanged - uid:', remoteUid, 'state:', state, 'reason:', reason);
          // State: 0=stopped, 1=starting, 2=decoding, 3=frozen, 4=failed
          if (state === 2) { // Remote video decoding normally
            console.log('VideoCall: Remote video is PLAYING');
            setRemoteUid(remoteUid);
            setIsRemoteVideoEnabled(true);
            if (!isReceiver) {
              setCallStatus('connected');
            }
          } else if (state === 0) { // Remote video stopped
            console.log('VideoCall: Remote video STOPPED - showing profile picture');
            setIsRemoteVideoEnabled(false);
          }
        },
        onUserOffline: (connection, uid, reason) => {
          console.log('VideoCall: Remote user left:', uid);
          setCallStatus('ended');
          setTimeout(() => navigate(routes.bottomTab), 1000);
        },
        onLeaveChannel: (connection, stats) => {
          console.log('VideoCall: Left channel');
          setCallStatus('ended');
        },
        onError: (err, msg) => {
          console.error('VideoCall: Agora error:', err, msg);
          Alert.alert('Error', 'Call error occurred');
          navigate(routes.bottomTab);
        },
      });
      
      // Use provided channel name or generate one
      const channelName = providedChannelName || [user.id, otherUserIdFinal].sort().join('_');
      
      // Start video call with our specific UID
      console.log('VideoCall: Starting call with channel:', channelName, 'isAudioOnly: false, myUID:', myAgoraUid);
      await agoraService.startCall(channelName, false, myAgoraUid);
      
      console.log('VideoCall: ✅ Call started successfully with channel:', channelName);
      
      // Get call log ID from ActiveCall (created by callService)
      if (!isReceiver && callId) {
        try {
          callStartTimeRef.current = Date.now();
          const callDoc = await firestore().collection('ActiveCalls').doc(callId).get();
          const callData = callDoc.data();
          if (callData?.callLogId) {
            callLogIdRef.current = callData.callLogId;
            console.log('VideoCall: Using call log ID from ActiveCall:', callData.callLogId);
          }
        } catch (error) {
          console.error('VideoCall: Failed to get call log ID:', error);
        }
      }
      
      // Set status immediately after successful join
      if (isReceiver) {
        console.log('VideoCall: Receiver joined successfully - setting to connected');
        // For receiver: assume caller is already there or will be there soon
        // The remote video will show once we receive the video stream
        setCallStatus('connected');
        
        // Register call in context for receiver
        if (otherUser) {
          console.log('VideoCall: Registering receiver call in context');
          startCall({
            type: 'video',
            otherUserId: otherUserIdFinal,
            otherUser: otherUser,
            channelName: channelName,
            callId: callId,
            isReceiver: isReceiver,
          });
        }
      } else {
        console.log('VideoCall: Caller joined successfully - setting status to ringing');
        setCallStatus('ringing');
      }
    } catch (error) {
      console.error('VideoCall: Failed to start call:', error);
      Alert.alert('Error', 'Failed to start video call. Please try again.');
      navigate(routes.bottomTab);
    }
  };

  // Track remoteUid changes
  useEffect(() => {
    console.log('VideoCall: ⚡ remoteUid changed to:', remoteUid);
  }, [remoteUid]);
  
  // Listen for partner's camera state changes via Firestore
  useEffect(() => {
    if (!callId) return;
    
    console.log('VideoCall: Setting up camera state listener for callId:', callId, 'isReceiver:', isReceiver);
    
    const unsubscribe = firestore()
      .collection('ActiveCalls')
      .doc(callId)
      .onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          const partnerCameraEnabled = isReceiver ? data.callerCameraEnabled : data.receiverCameraEnabled;
          
          console.log('VideoCall: Camera state update from Firestore - partnerCameraEnabled:', partnerCameraEnabled, 'current isRemoteVideoEnabled:', isRemoteVideoEnabled);
          
          if (partnerCameraEnabled !== undefined) {
            console.log('VideoCall: Setting isRemoteVideoEnabled to:', partnerCameraEnabled);
            setIsRemoteVideoEnabled(partnerCameraEnabled);
          }
        }
      }, error => {
        console.error('VideoCall: Error listening to camera state:', error);
      });
    
    return () => unsubscribe();
  }, [callId, isReceiver]);

  // Calculate call duration from activeCall.startTime
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  useEffect(() => {
    let interval;
    if (callStatus === 'connected') {
      console.log('VideoCall: Starting duration timer - activeCall.startTime:', activeCall?.startTime);
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }
    return () => {
      if (interval) {
        console.log('VideoCall: Clearing duration timer');
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
      console.log('VideoCall: Ending call...');
      
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
          console.log('VideoCall: Call log updated - duration:', duration, 'seconds');
          callLogIdRef.current = null;
          callStartTimeRef.current = null;
        } catch (error) {
          console.error('VideoCall: Failed to update call log:', error);
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
      console.error('VideoCall: Failed to end call:', error);
      navigate(routes.bottomTab);
    }
  }, [isReceiver, callId, endCallContext]);

  const handleCallMinutesEmpty = useCallback(async () => {
    console.log('VideoCall: ⚠️⚠️⚠️ Call minutes empty - ending call');
    
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
    console.log('VideoCall: Minimizing call');
    isMinimizingRef.current = true;
    
    // Make sure otherUser is in the call data
    if (otherUser) {
      console.log('VideoCall: Updating call context with otherUser:', otherUser.username);
      startCall({
        type: 'video',
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

  const handleCameraToggle = async () => {
    const newCameraState = !isCameraOn;
    setIsCameraOn(newCameraState);
    await agoraService.toggleVideo(newCameraState);
    
    // Sync camera state to Firestore so other party knows
    if (callId) {
      try {
        await firestore().collection('ActiveCalls').doc(callId).update({
          [`${isReceiver ? 'receiver' : 'caller'}CameraEnabled`]: newCameraState
        });
        console.log('VideoCall: Camera state synced to Firestore:', newCameraState);
      } catch (error) {
        console.error('VideoCall: Failed to sync camera state:', error);
      }
    }
  };

  const handleSwitchCamera = async () => {
    await agoraService.switchCamera();
  };

  const toggleControls = () => {
    const newVisibility = !controlsVisible;
    setControlsVisible(newVisibility);
    
    Animated.timing(controlsAnimation, {
      toValue: newVisibility ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
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
        console.log('VideoCall: Using medium thumbnail for background');
        return { uri: otherUser.profilePictures.thumbnails.medium };
      }
      if (otherUser.profilePictures.medium) {
        console.log('VideoCall: Using medium for background');
        return { uri: otherUser.profilePictures.medium };
      }
      if (otherUser.profilePictures.original) {
        console.log('VideoCall: Using original for background');
        return { uri: otherUser.profilePictures.original };
      }
    }
    console.log('VideoCall: Using fallback image for background, otherUser:', otherUser?.username);
    return appImages.image4;
  };

  return (
    <View style={{flex: 1}}>
      {/* Background Layer - Partner's Profile Picture */}
      <ImageBackground 
        source={
          otherUser?.profilePictures?.thumbnails?.medium
            ? { uri: otherUser.profilePictures.thumbnails.medium }
            : otherUser?.profilePictures?.medium
            ? { uri: otherUser.profilePictures.medium }
            : otherUser?.profilePictures?.original
            ? { uri: otherUser.profilePictures.original }
            : getBackgroundImage()
        } 
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      
      {/* Remote Video Layer - ONLY when connected AND partner's camera is ON */}
      {callStatus === 'connected' && otherUserAgoraUid && isRemoteVideoEnabled && (
        <>
          {console.log('VideoCall: Rendering FULLSCREEN Remote Video - UID:', otherUserAgoraUid, 'isRemoteVideoEnabled:', isRemoteVideoEnabled)}
          <RtcSurfaceView
            canvas={{uid: otherUserAgoraUid}}
            style={StyleSheet.absoluteFillObject}
            zOrderMediaOverlay={false}
          />
        </>
      )}
      
      {/* Dark overlay for better text visibility when not connected */}
      {callStatus !== 'connected' && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />
      )}
      
      <StatusBars.Light />
      <Spacer isStatusBarHeigt />
      
      {/* Header */}
      <Wrapper
        style={{zIndex: 20}}
        flexDirectionRow
        alignItemsCenter
        marginHorizontalBase
        justifyContentSpaceBetween>
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
          <Text style={[styles.statusText, { textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }]}>
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
            {[
              'Effects',
              'Send Message',
              'Share Screen',
              'Convert to Audio',
            ].map((item, index) => (
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
      
      {/* Content Area */}
      <View style={{flex: 1}}>
        {/* Debug info */}
        {console.log('VideoCall RENDER: callStatus:', callStatus, 'remoteUid:', remoteUid, 'otherUserAgoraUid:', otherUserAgoraUid, 'isRemoteVideoEnabled:', isRemoteVideoEnabled, 'isReceiver:', isReceiver, 'isCameraOn:', isCameraOn)}
        
        {/* Profile Picture Circle - only show when NOT connected */}
        {callStatus !== 'connected' && (
          <Wrapper
            alignItemsCenter
            style={{ flex: 1, justifyContent: 'center', zIndex: 1 }}>
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
            
            {/* User Name */}
            <Text style={[styles.userNameText, { textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }]}>
              {otherUser?.username || 'Unknown User'}
            </Text>
            
            {/* Status Text - only show when NOT connected */}
            <Text style={[styles.statusText, { textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }]}>
              {getStatusText()}
            </Text>
          </Wrapper>
        )}
        
        {/* User Name and Timer - show when connected (above controls at bottom) */}
        {callStatus === 'connected' && (
          <View style={{
            position: 'absolute',
            bottom: responsiveHeight(22),
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 20,
            paddingHorizontal: responsiveWidth(5)
          }}>
            <Text style={{ 
              fontSize: scale(16), 
              fontWeight: '500', 
              color: '#FFFFFF',
              textShadowColor: 'rgba(0, 0, 0, 0.8)', 
              textShadowOffset: { width: 0, height: 1 }, 
              textShadowRadius: 4 
            }}>
              {otherUser?.username || 'Unknown User'}
            </Text>
            <Text style={{ 
              fontSize: scale(14), 
              fontWeight: '400', 
              color: '#FFFFFF',
              textShadowColor: 'rgba(0, 0, 0, 0.8)', 
              textShadowOffset: { width: 0, height: 1 }, 
              textShadowRadius: 4, 
              marginTop: 4 
            }}>
              {formatTime(callDuration)}
            </Text>
          </View>
        )}
        
        {/* Local Video Preview (Small) - Top Right */}
        {callStatus === 'connected' && (
          <View style={styles.localVideoContainer}>
            {console.log('VideoCall: Rendering local preview - isCameraOn:', isCameraOn)}
            {isCameraOn ? (
              /* Show video when camera is on - uid: 0 for local preview */
              <>
                {console.log('VideoCall: Rendering LOCAL RtcSurfaceView with uid: 0')}
                <RtcSurfaceView
                  canvas={{uid: 0}}
                  style={styles.localVideo}
                  zOrderMediaOverlay={true}
                  zOrderOnTop={true}
                />
              </>
            ) : (
              /* Show profile picture when camera is off */
              <ImageBackground
                source={
                  user?.profilePictures?.thumbnails?.medium
                    ? { uri: user.profilePictures.thumbnails.medium }
                    : user?.profilePictures?.medium
                    ? { uri: user.profilePictures.medium }
                    : user?.profilePictures?.original
                    ? { uri: user.profilePictures.original }
                    : appImages.image4
                }
                style={styles.localVideo}
                resizeMode="cover"
              />
            )}
          </View>
        )}
      </View>

      {/* Collapsible Controls Container */}
      {(callStatus === 'connected' || callStatus === 'calling' || callStatus === 'ringing' || callStatus === 'connecting') && (
        <View style={styles.controlsWrapper}>
          {/* Toggle Handle */}
          <TouchableOpacity 
            style={styles.controlsHandle} 
            onPress={toggleControls}
            activeOpacity={0.7}
          >
            <View style={styles.handleLine} />
          </TouchableOpacity>
          
          {/* Animated Controls */}
          <Animated.View 
            style={[
              styles.controlsContainer,
              {
                opacity: controlsAnimation,
                transform: [{
                  translateY: controlsAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  })
                }]
              }
            ]}
          >
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
                
                {/* Video Button */}
                <View style={styles.controlButtonWrapper}>
                  <TouchableOpacity
                    onPress={handleCameraToggle}
                    style={styles.controlButton}
                  >
                    <View style={[styles.iconCircle, !isCameraOn && styles.iconCircleActive]}>
                      {isCameraOn ? (
                        <Icons.Svg svg={appSvgs.videoCamera} size={scale(28)} />
                      ) : (
                        <Icons.Svg svg={appSvgs.videoCameraOff} size={scale(28)} />
                      )}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.controlLabel}>{isCameraOn ? t('CALL_VIDEO_ON') : t('CALL_VIDEO_OFF')}</Text>
                </View>
                
                {/* Switch Camera Button */}
                <View style={styles.controlButtonWrapper}>
                  <TouchableOpacity
                    onPress={handleSwitchCamera}
                    style={styles.controlButton}
                  >
                    <View style={styles.iconCircle}>
                      <Icons.Custom
                        icon={appIcons.flipCamera}
                        size={scale(28)}
                        color="#fff"
                      />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.controlLabel}>{t('CALL_SWITCH_CAMERA')}</Text>
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
          </Animated.View>
        </View>
      )}
      
      {/* Call Minutes Shop Modal */}
      <CallMinutesShopModal
        visible={showCallMinutesShop}
        onClose={() => setShowCallMinutesShop(false)}
        onSuccess={(minutes) => {
          console.log('VideoCall: Purchased', minutes, 'call minutes');
          setShowCallMinutesShop(false);
        }}
      />
    </View>
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
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  durationText: {
    fontSize: scale(24),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  callTypeText: {
    fontSize: scale(20),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: scale(20),
    width: '100%',
    paddingHorizontal: responsiveWidth(5),
  },
  durationContainer: {
    position: 'absolute',
    top: scale(80),
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: scale(15),
    paddingVertical: scale(8),
    borderRadius: scale(20),
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
  userNameText: {
    fontSize: scale(32),
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: scale(15),
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
    zIndex: 20,
    elevation: 20,
  },
  controlsHandle: {
    height: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  handleLine: {
    width: scale(40),
    height: scale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: scale(2),
  },
  controlsBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(20px)',
    borderRadius: scale(25),
    paddingVertical: scale(20),
    paddingHorizontal: scale(30),
    alignSelf: 'center',
    marginHorizontal: scale(20),
  },
  controlsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: scale(280),
  },
  localVideoContainer: {
    position: 'absolute',
    right: scale(15),
    top: scale(40),
    width: scale(120),
    height: scale(160),
    borderRadius: scale(15),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 15,
    zIndex: 15,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
});

