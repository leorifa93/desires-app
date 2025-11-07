import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  appIcons,
  appImages,
  colors,
  responsiveFontSize,
  responsiveWidth,
  routes,
  tabs,
  useReduxStore,
} from '../../services';
import {Icons, Images, Spacer, StatusBars, Wrapper} from '../../components';
import {Icon} from '@rneui/base';
import * as App from '../../screens/app';
import {View} from 'react-native';
import { useSelector } from 'react-redux';
import { getRangPosition } from '../../services/firebaseUtilities/user';
import { getAllChats } from '../../services/firebaseUtilities/chat';
import { useState, useEffect, useRef } from 'react';
import firestore from '@react-native-firebase/firestore';
import {Text} from 'react-native';
const BottomTabStack = createBottomTabNavigator();

export default function BottomTabNavigation() {
  const tabIconSize = responsiveFontSize(25);
  const me = useSelector(state => state.auth.user);
  const [currentPosition, setCurrentPosition] = useState(1);
  const [messageCount, setMessageCount] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const chatListenerRef = useRef(null);

  useEffect(() => {
    if (me) {
      getCurrentPosition();
      getUnreadChats();
      
      // Set up real-time listener for chat updates
      if (chatListenerRef.current) {
        chatListenerRef.current(); // Clean up previous listener
      }
      
      // Listen to all chats where the current user is a member
      if (me?.id) {
        chatListenerRef.current = firestore()
          .collection('Chats')
          .where('memberIds', 'array-contains', me.id)
          .onSnapshot(
            (snapshot) => {
              // Recalculate unread chats when any chat changes
              getUnreadChats();
            },
            (error) => {
              console.error('Error listening to chat updates:', error);
            }
          );
      }
      
      // Fallback: Update unread chats every 30 seconds as backup
      const interval = setInterval(() => {
        getUnreadChats();
      }, 30000);
      
      // TODO: Implement message count from CometChat
      // setMessageCount(cometChatUnreadCount);
      
      return () => {
        clearInterval(interval);
        if (chatListenerRef.current) {
          chatListenerRef.current();
        }
      };
    } else {
      setCurrentPosition(1);
      setUnreadChats(0);
      if (chatListenerRef.current) {
        chatListenerRef.current();
        chatListenerRef.current = null;
      }
    }
  }, [me]);

  const getCurrentPosition = async () => {
    try {
      // Only call getRangPosition if user data is valid and complete
      if (me?.id && 
          me?.gender !== undefined && me?.gender !== null && me?.gender !== '' &&
          me?.membership !== undefined && me?.membership !== null && me?.membership !== '' &&
          me?.currentLocation?.lat && me?.currentLocation?.lng) {
        const position = await getRangPosition(me);
        setCurrentPosition(position);
      } else {
        console.log('User data not ready for position calculation:', { 
          id: me?.id, 
          gender: me?.gender, 
          membership: me?.membership,
          hasLocation: !!(me?.currentLocation?.lat && me?.currentLocation?.lng)
        });
        setCurrentPosition(1);
      }
    } catch (error) {
      console.error('Error getting position:', error);
      setCurrentPosition(1);
    }
  };

  const getUnreadChats = async () => {
    try {
      if (!me?.id) { setUnreadChats(0); return; }
      const chats = await getAllChats(me.id);
      const unreadCount = chats.filter(chat => !chat.seen?.includes(me.id)).length;
      setUnreadChats(unreadCount);
    } catch (error) {
      console.error('Error getting unread chats:', error);
      setUnreadChats(0);
    }
  };

  const TabIcon = ({color, iconName, iconType, size, focused, image, badgeValue}) => {
    return (
      <Wrapper
        alignItemsCenter
        style={{
          flex: 1,
          width: responsiveWidth(15),
          justifyContent: 'center',
          marginTop: 0,
          position: 'relative',
        }}>
        {!image ? (
          <Icon
            name={iconName}
            type={iconType}
            size={tabIconSize}
            color={color}
            focused={focused}
          />
        ) : (
          <Icons.Custom
            icon={image}
            size={tabIconSize}
            color={focused ? undefined : colors.appTextColor2}
          />
        )}
        
        {badgeValue > 0 && (
          <Wrapper
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              backgroundColor: '#FF0000',
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 4,
            }}>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: responsiveFontSize(12),
                fontWeight: 'bold',
              }}
              numberOfLines={1}>
              {badgeValue > 99 ? '99+' : String(badgeValue)}
            </Text>
          </Wrapper>
        )}
      </Wrapper>
    );
  };
  return (
    <>
      <BottomTabStack.Navigator
        initialRouteName={routes.home}
        screenOptions={{
          headerShown: false,
          ...tabs.tabBarOptions,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          unmountOnBlur: true,

          // header: () => (
          //   <View>
          //     <StatusBars.Dark />
          //     <Spacer isStatusBarHeigt />
          //   </View>
          // ),
        }}>
        <BottomTabStack.Screen
          name={routes.home}
          component={App.Home}
          options={() => ({
            tabBarIcon: ({color, size, focused}) => {
              return (
                <TabIcon
                  image={focused ? appIcons.HomeActive : appIcons.Home}
                  size={tabIconSize}
                  focused={focused}
                />
              );
            },
          })}
        />

        <BottomTabStack.Screen
          name={routes.explore}
          component={App.Explore}
          options={() => ({
            tabBarIcon: ({color, size, focused}) => {
              return (
                <TabIcon
                  image={focused ? appIcons?.ExploreActive : appIcons?.Explore}
                  size={tabIconSize}
                  //color={color}
                  focused={focused}
                />
              );
            },
          })}
        />
        <BottomTabStack.Screen
          name={routes.hotOrNot}
          component={App.HotORNot}
          options={() => ({
            tabBarIcon: ({color, size, focused}) => {
              return (
                <TabIcon
                  image={focused ? appIcons?.FireActive : appIcons?.Fire}
                  size={tabIconSize}
                  focused={focused}
                  badgeValue={me?._badges?.likes ? Number(me._badges.likes) : 0}
                />
              );
            },
          })}
        />

        <BottomTabStack.Screen
          name={routes.friends}
          component={App.Friends}
          options={() => ({
            tabBarIcon: ({color, size, focused}) => {
              return (
                <TabIcon
                  image={focused ? appIcons?.FriendsActive : appIcons?.Friends}
                  size={tabIconSize}
                  focused={focused}
                  badgeValue={(() => {
                    const badgeValue = me?._friendRequests?.length ? Number(me._friendRequests.length) : 0;
                    console.log('BottomTab Friends badge value:', badgeValue, 'me._friendRequests:', me?._friendRequests);
                    return badgeValue;
                  })()}
                />
              );
            },
          })}
        />
        <BottomTabStack.Screen
          name={routes.chat}
          component={App.Chat}
          options={() => ({
            tabBarIcon: ({color, size, focused}) => {
              return (
                <TabIcon
                  image={focused ? appIcons?.MessageActive : appIcons?.Message}
                  size={tabIconSize}
                  focused={focused}
                  badgeValue={unreadChats || 0}
                />
              );
            },
          })}
        />
        <BottomTabStack.Screen
          name={routes.profileSetting}
          component={App.ProfileSetting}
          options={() => ({
            tabBarIcon: ({color, size, focused}) => {
              return (
                <TabIcon
                  image={
                    focused
                      ? appIcons?.ProfileSettingActive
                      : appIcons?.ProfileSetting
                  }
                  size={tabIconSize}
                  //color={color}
                  focused={focused}
                />
              );
            },
          })}
        />
      </BottomTabStack.Navigator>
    </>
  );
}
