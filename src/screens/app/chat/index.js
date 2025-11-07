import React, {Component, useState, useEffect} from 'react';
import {
  Wrapper,
  Text,
  Headers,
  Icons,
  Spacer,
  Labels,
  Lines,
  MyAnimated,
  Images,
  StatusBars,
} from '../../../components';

import {FlatList, StyleSheet, TouchableOpacity, View, TextInput, TouchableWithoutFeedback, Pressable, Alert} from 'react-native';
import {
  appIcons,
  appImages,
  appStyles,
  colors,
  responsiveHeight,
  responsiveWidth,
  routes,
  sizes,
  fontSizes,
} from '../../../services';
import {scale} from 'react-native-size-matters';
import {navigate} from '../../../navigation/rootNavigation';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import {useSelector} from 'react-redux';
import {getAllChats, deleteChat, markChatAsSeen, listenToChats} from '../../../services/firebaseUtilities/chat';
import {getCallLogs} from '../../../services/firebaseUtilities/callLogs';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import CallMinutesShopModal from '../../../components/modals/CallMinutesShopModal';
import callMinutesService from '../../../services/callMinutesService';
import firestore from '@react-native-firebase/firestore';

// Header
const RenderFlatListHeader = React.memo(({activeTab, setActiveTab}) => {
  const {t} = useTranslation();
  
  return (
    <View>
      <View>
        <Wrapper
          marginVerticalSmall
          marginHorizontalBase
          flexDirectionRow
          alignItemsCenter
          justifyContentSpaceBetween>
          <Text isSmallTitle isMediumFont style={styles.headerTitle}>
            {t('MESSAGES')}
          </Text>
        </Wrapper>
      </View>
      
      {/* Segment Control */}
      <Wrapper style={styles.segmentContainer}>
        <Wrapper style={styles.segmentWrapper}>
          <Pressable
            style={[
              styles.segmentButton,
              activeTab === 'chats' && styles.segmentButtonActive
            ]}
            onPress={() => setActiveTab('chats')}>
            <Text style={[
              styles.segmentButtonText,
              activeTab === 'chats' && styles.segmentButtonTextActive
            ]}>
              {t('CHATS')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.segmentButton,
              activeTab === 'calls' && styles.segmentButtonActive
            ]}
            onPress={() => setActiveTab('calls')}>
            <Text style={[
              styles.segmentButtonText,
              activeTab === 'calls' && styles.segmentButtonTextActive
            ]}>
              {t('CALLS')}
            </Text>
          </Pressable>
        </Wrapper>
      </Wrapper>
      
      <Spacer isBasic />
    </View>
  );
});

// The Component of Chat Item
const ChatItem = React.memo(({chat, onPress, onDelete, user}) => {
  const [menuIconColor, setMenuIconColor] = useState(colors.appBorderColor1);

  const getOtherProfile = (chat) => {
    return chat.profiles?.find((profile) => profile.id !== user?.id);
  };

  const otherProfile = getOtherProfile(chat);
  const isSeen = chat.seen?.includes(user?.id);
  const isFromMe = chat.lastMessageFrom === user?.id;

  const styles = StyleSheet.create({
    OptionMainContainer: {
      width: responsiveWidth(36),
      backgroundColor: colors.appBgColor1,
      ...appStyles.shadowDark,
      borderRadius: responsiveWidth(3),
      padding: scale(18),
    },
  });

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <View style={{flex: 1}}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Wrapper
        flexDirectionRow
        marginHorizontalBase
        alignItemsCenter>
        {/* Image */}
        <Wrapper>
          <Images.Round 
            source={{uri: otherProfile?.profilePictures?.thumbnails?.small || otherProfile?.profilePictures?.original || appImages.image4}} 
            size={scale(48)} 
          />
        </Wrapper>
        {/* Text Name And Message */}
        <Wrapper
          marginHorizontalSmall
          style={{width: responsiveWidth(55)}}>
          <Text isRegular isBoldFont>
            {otherProfile?.username || 'Unknown User'}
          </Text>
          <Text isSmall isRegularFont isTextColor2 numberOfLines={1}>
            {isFromMe && <Text children="↩ " />}
            {chat.lastMessage || 'No messages yet'}
          </Text>
        </Wrapper>
        {/* Time and Seen Indicator */}
        <Wrapper
          flex={1}
          flexDirectionRow
          alignItemsCenter
          justifyContentSpaceBetween>
          {/* Seen Indicator */}
          {!isSeen && (
          <View
              style={{
                height: scale(8),
                width: scale(8),
                borderRadius: 150,
                backgroundColor: colors.appPrimaryColor,
              }}
            />
          )}
          
          <Text isSmall isTextColor2 style={{fontSize: scale(10)}}>
            {formatTimeAgo(chat.lastMessageAt)}
          </Text>

          <Menu
            onOpen={() => {
              setMenuIconColor(colors.appBGColor);
            }}
            onClose={() => {
              setMenuIconColor(colors.appBorderColor1);
            }}>
            <MenuTrigger>
              <Icons.Custom
                icon={appIcons.Menu}
                color={menuIconColor}
                size={scale(17)}
              />
            </MenuTrigger>
            <MenuOptions
              optionsContainerStyle={[
                styles.OptionMainContainer,
                {marginTop: scale(22), marginLeft: -scale(6)},
              ]}>
                <MenuOption
                onSelect={() => onDelete(chat.id)}
                  customStyles={{
                    optionWrapper: {
                      paddingVertical: scale(8),
                    },
                  }}>
                <Text isSmall isRegularFont isPrimaryColor>
                  Delete
                  </Text>
                </MenuOption>
            </MenuOptions>
          </Menu>
        </Wrapper>
      </Wrapper>
      </TouchableOpacity>
      <Spacer isSmall />
      {/* Bottom Line */}
      <Wrapper marginHorizontalBase alignItemsFlexEnd>
        <Lines.Horizontal
          height={1}
          width={responsiveWidth(73)}
          color={colors.appBorderColor2}
        />
      </Wrapper>
    </View>
  );
});

export default function Index() {
  const {t} = useTranslation();
  const user = useSelector(state => state.auth.user);
  const [chats, setChats] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'calls'
  const [unsubscribeChats, setUnsubscribeChats] = useState(null);
  const [unsubscribeCallLogs, setUnsubscribeCallLogs] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        if (activeTab === 'chats') {
          setupRealTimeChats();
        } else {
          setupRealTimeCallLogs();
        }
      }
      
      // Cleanup function
      return () => {
        if (unsubscribeChats) {
          console.log('Cleaning up real-time chats listener');
          unsubscribeChats();
        }
        if (unsubscribeCallLogs) {
          console.log('Cleaning up real-time call logs listener');
          unsubscribeCallLogs();
        }
      };
    }, [user, activeTab])
  );

  const setupRealTimeChats = () => {
    try {
      setLoading(true);
      
      // Clean up call logs listener when switching to chats
      if (unsubscribeCallLogs) {
        console.log('Switching to chats - cleaning up call logs listener');
        unsubscribeCallLogs();
        setUnsubscribeCallLogs(null);
      }
      
      // Clean up existing chats listener
      if (unsubscribeChats) {
        unsubscribeChats();
      }
      
      console.log('Setting up real-time chats listener for user:', user.id);
      
      const unsubscribe = listenToChats(user.id, (chatsData) => {
        console.log('Real-time chats update received:', chatsData.length, 'chats');
        
        // Sort chats by lastMessageAt (newest first)
        const sortedChats = chatsData.sort((a, b) => {
          return (b.lastMessageAt || 0) - (a.lastMessageAt || 0);
        });
        
        setChats(sortedChats);
        setLoading(false);
      });
      
      setUnsubscribeChats(() => unsubscribe);
    } catch (error) {
      console.error('Error setting up real-time chats:', error);
      setLoading(false);
    }
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const chatsData = await getAllChats(user.id);
      
      // Sort chats by lastMessageAt (newest first)
      const sortedChats = chatsData.sort((a, b) => {
        return (b.lastMessageAt || 0) - (a.lastMessageAt || 0);
      });
      
      setChats(sortedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeCallLogs = () => {
    try {
      setCallLogsLoading(true);
      
      // Clean up chats listener when switching to call logs
      if (unsubscribeChats) {
        console.log('Switching to call logs - cleaning up chats listener');
        unsubscribeChats();
        setUnsubscribeChats(null);
      }
      
      // Clean up existing call logs listener
      if (unsubscribeCallLogs) {
        unsubscribeCallLogs();
      }
      
      console.log('Setting up real-time call logs listener for user:', user.id);
      
      const unsubscribe = firestore()
        .collection('CallLogs')
        .where('members', 'array-contains', user.id)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .onSnapshot(snapshot => {
          console.log('Real-time call logs update received:', snapshot.size, 'logs');
          
          const logs = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            logs.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
            });
          });
          
          // Filter and sort
          const filteredLogs = logs.filter((log) => {
            return log.status !== 'onOutgoing' && log.status !== 'rejected' ||
                   ((log.status === 'onOutgoing' || log.status === 'rejected') && log.callerId === user.id);
          });
          
          filteredLogs.sort((a, b) => {
            const aTime = typeof a.createdAt === 'number' ? a.createdAt : a.createdAt;
            const bTime = typeof b.createdAt === 'number' ? b.createdAt : b.createdAt;
            return bTime - aTime;
          });
          
          setCallLogs(filteredLogs);
          setCallLogsLoading(false);
        }, error => {
          console.error('Error in call logs listener:', error);
          setCallLogsLoading(false);
        });
      
      setUnsubscribeCallLogs(() => unsubscribe);
    } catch (error) {
      console.error('Error setting up real-time call logs:', error);
      setCallLogsLoading(false);
    }
  };

  const handleChatPress = async (chat) => {
    const otherProfile = chat.profiles?.find((profile) => profile.id !== user?.id);
    if (otherProfile) {
      // Mark chat as seen before navigating
      try {
        if (!chat.seen?.includes(user.id)) {
          await markChatAsSeen(chat.id, user.id);
          // Update local state
          setChats(prevChats => 
            prevChats.map(c => 
              c.id === chat.id 
                ? { ...c, seen: [...(c.seen || []), user.id] }
                : c
            )
          );
        }
      } catch (error) {
        console.error('Error marking chat as seen:', error);
      }
      
      navigate(routes.chatScreen, {chatId: chat.id, otherUserId: otherProfile.id});
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await deleteChat(chatId);
      setChats(chats.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const renderEmptyState = () => (
    <Wrapper marginHorizontalBase alignItemsCenter justifyContentCenter style={{marginTop: responsiveHeight(20)}}>
      <Text isMedium isBoldFont alignTextCenter>
        {activeTab === 'chats' ? t('NOMESSAGES') : t('NO_CALLS')}
      </Text>
    </Wrapper>
  );

  const renderLoadingState = () => (
    <Wrapper marginHorizontalBase>
      {[1, 2, 3, 4, 5].map((item, index) => (
        <Wrapper key={index} flexDirectionRow marginVerticalSmall alignItemsCenter>
          <Wrapper
            style={{
              width: scale(48),
              height: scale(48),
              borderRadius: scale(24),
              backgroundColor: colors.appBorderColor2,
            }}
          />
          <Wrapper marginHorizontalSmall style={{flex: 1}}>
            <Wrapper
              style={{
                height: scale(16),
                width: responsiveWidth(30),
                backgroundColor: colors.appBorderColor2,
                borderRadius: scale(2),
                marginBottom: scale(8),
              }}
            />
            <Wrapper
              style={{
                height: scale(12),
                width: responsiveWidth(50),
                backgroundColor: colors.appBorderColor2,
                borderRadius: scale(2),
              }}
            />
          </Wrapper>
        </Wrapper>
      ))}
    </Wrapper>
  );

  const [showCallMinutesShop, setShowCallMinutesShop] = useState(false);

  const handleCallBack = async (callLog) => {
    try {
      // Determine the other user's ID
      const otherUserId = callLog.callerId === user.id ? callLog.receiverId : callLog.callerId;
      
      // Check if user has call minutes
      const hasMinutes = callMinutesService.hasCallMinutes(user);
      if (!hasMinutes) {
        Alert.alert(
          t('NO_CALL_MINUTES_TITLE'),
          t('NO_CALL_MINUTES_MESSAGE'),
          [
            { text: t('CANCEL'), style: 'cancel' },
            { text: t('BUY_MINUTES'), onPress: () => setShowCallMinutesShop(true) }
          ]
        );
        return;
      }
      
      // Initiate call and navigate to appropriate call screen
      const callService = require('../../../services/callService').default;
      if (callLog.type === 'audio') {
        const { callId, channelName } = await callService.initiateCall(user.id, otherUserId, user, true); // true = audio only
        navigate(routes.audioCall, { userId: otherUserId, channelName, callId, isReceiver: false });
      } else {
        const { callId, channelName } = await callService.initiateCall(user.id, otherUserId, user, false); // false = video
        navigate(routes.videoCall, { userId: otherUserId, channelName, callId, isReceiver: false });
      }
    } catch (error) {
      console.error('Failed to call back:', error);
      if (error?.code === 'NO_MINUTES') {
        setShowCallMinutesShop(true);
        return;
      }
      Alert.alert(t('ERROR'), t('FAILED_TO_START_CALL'));
    }
  };

  const renderCallLogItem = ({item, index}) => (
    <TouchableOpacity 
      key={index} 
      onPress={() => handleCallBack(item)}
      activeOpacity={0.7}
    >
      <Wrapper style={styles.callLogItem}>
        <Wrapper flexDirectionRow alignItemsCenter style={styles.callLogContent}>
          <Wrapper style={styles.avatarContainer}>
            <Images.Round 
              source={{uri: item.avatar || appImages.image4}} 
              size={scale(45)} 
            />
            <Wrapper style={styles.onlineIndicator} />
          </Wrapper>
          <Wrapper style={styles.callLogTextContainer}>
            <Text style={styles.callLogName}>
              {item.callerId === user.id ? item.receiverName : item.callerName}
            </Text>
            <Text style={styles.callLogTime}>
              {formatTimeAgo(item.createdAt)}
            </Text>
            <Text style={styles.callLogStatus}>
              {item.status === 'ended' ? t('ENDEDCALL') : 
               item.status === 'rejected' ? t('REJECTEDCALL') : 
               item.status === 'onOutgoing' ? t('OUTGOINGCALL') : 
               t('MISSEDCALL')}
            </Text>
          </Wrapper>
          <Wrapper style={styles.callLogIcon}>
            <Wrapper style={styles.iconContainer}>
              {item.type === 'audio' ? (
                <Svg width={scale(18)} height={scale(18)} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                    fill={colors.appPrimaryColor}
                  />
                </Svg>
              ) : (
                <Svg width={scale(18)} height={scale(18)} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M23 7a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7z"
                    fill={colors.appTextColor1}
                  />
                  <Path
                    d="M9 9l6 6"
                    stroke={colors.appBgColor1}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <Path
                    d="M15 9l-6 6"
                    stroke={colors.appBgColor1}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </Svg>
              )}
            </Wrapper>
            <Text style={styles.callTypeLabel}>
              {item.type === 'audio' ? t('AUDIO') : t('VIDEO')}
            </Text>
          </Wrapper>
        </Wrapper>
      </Wrapper>
    </TouchableOpacity>
  );

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <Wrapper isMain>
      <StatusBars.Dark />
      <Spacer isStatusBarHeigt />
        <FlatList
        data={activeTab === 'chats' ? chats : callLogs}
          ListHeaderComponent={
            <RenderFlatListHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            />
          }
          ListFooterComponent={<Spacer isBasic />}
          renderItem={activeTab === 'chats' ? 
            ({item, index}) => (
              <ChatItem 
                key={index} 
                chat={item} 
                user={user}
                onPress={() => handleChatPress(item)}
                onDelete={handleDeleteChat}
              />
            ) : renderCallLogItem
          }
          ListEmptyComponent={
            (activeTab === 'chats' ? loading : callLogsLoading) ? 
            renderLoadingState : 
            renderEmptyState
          }
          contentContainerStyle={{ paddingBottom: responsiveHeight(10) }}
        />
        
      {/* Call Minutes Shop Modal */}
      <CallMinutesShopModal 
        visible={showCallMinutesShop}
        onClose={() => setShowCallMinutesShop(false)}
      />
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  ButtonBackContainer: {
    marginHorizontal: sizes.baseMargin,
    height: sizes.buttonHeight,
    borderRadius: responsiveWidth(3),
    borderRadius: responsiveWidth(100),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.appBorderColor2,
  },
  SeletedLayerContainer: {
    height: sizes.buttonHeight,
    borderRadius: responsiveWidth(100),
    width: responsiveWidth(45),
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentContainer: {
    marginHorizontal: sizes.baseMargin,
    marginBottom: responsiveHeight(2),
    marginTop: responsiveHeight(1),
  },
  segmentWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.appBgColor1,
    borderRadius: responsiveWidth(25),
    borderWidth: 1,
    borderColor: colors.appBorderColor2,
    padding: responsiveWidth(0.5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: responsiveHeight(1.5),
    alignItems: 'center',
    borderRadius: responsiveWidth(24),
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  segmentButtonActive: {
    backgroundColor: colors.appPrimaryColor,
    shadowColor: colors.appPrimaryColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    transform: [{scale: 1.02}],
  },
  segmentButtonText: {
    fontSize: scale(15),
    fontWeight: '600',
    color: colors.appTextColor2,
    letterSpacing: 0.5,
  },
  segmentButtonTextActive: {
    color: colors.appBgColor1,
    fontWeight: '700',
  },
  callLogItem: {
    marginHorizontal: sizes.baseMargin,
    marginVertical: sizes.smallMargin,
    backgroundColor: colors.appBgColor1,
    borderRadius: responsiveWidth(16),
    padding: scale(18),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.appBorderColor2,
  },
  callLogContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  callLogTextContainer: {
    flex: 1,
    marginLeft: scale(15),
  },
  callLogName: {
    fontSize: scale(16),
    fontWeight: '600',
    color: colors.appTextColor1,
  },
  callLogTime: {
    fontSize: scale(12),
    color: colors.appTextColor2,
    marginTop: scale(6),
    fontWeight: '500',
    opacity: 0.8,
  },
  callLogStatus: {
    fontSize: scale(12),
    color: colors.appTextColor2,
    marginTop: scale(3),
    fontWeight: '400',
    opacity: 0.7,
  },
  callLogIcon: {
    marginLeft: scale(15),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scale(50),
  },
  iconContainer: {
    padding: scale(8),
    backgroundColor: colors.appBorderColor2,
    borderRadius: scale(20),
    marginBottom: scale(4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  callTypeLabel: {
    fontSize: scale(10),
    color: colors.appTextColor2,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: scale(15),
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: colors.appPrimaryColor,
  },
  headerTitle: {
    marginLeft: responsiveWidth(10),
  },
});
