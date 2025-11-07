import React, {Component, useState, useEffect, useCallback} from 'react';
import {
  Wrapper,
  Text,
  Headers,
  Icons,
  Spacer,
  Lines,
  Labels,
  Images,
  StatusBars,
} from '../../../components';
import {useHooks} from './hooks';
import {
  appIcons,
  appImages,
  appStyles,
  colors,
  responsiveHeight,
  responsiveWidth,
  routes,
  sizes,
} from '../../../services';
import {scale} from 'react-native-size-matters';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import {Badge} from '@rneui/base';
import {navigate} from '../../../navigation/rootNavigation';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {getUsersByIds} from '../../../services/firebaseUtilities/user';
import {useFocusEffect} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';

export default function Index({ route }) {
  const {t} = useTranslation();
  const user = useSelector(state => state.auth.user);
  const {FriendRenderDetail, data} = useHooks();

  const [OptionShown, setOptionShown] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(route?.params?.activeTab || 'friends');

  // Refresh data when screen comes into focus (e.g., after accepting/rejecting requests)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        if (activeTab === 'friends') {
          loadFriends();
        } else {
          loadFriendRequests();
        }
      }
    }, [user, activeTab])
  );

  useEffect(() => {
    if (user) {
      if (activeTab === 'friends') {
        loadFriends();
      } else {
        loadFriendRequests();
      }
    }
  }, [user, activeTab, user?._friendRequests, user?._friendsList]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'friends') {
        await loadFriends();
      } else {
        await loadFriendRequests();
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTab]);

  const refreshData = useCallback(() => {
    if (activeTab === 'friends') {
      loadFriends();
    } else {
      loadFriendRequests();
    }
  }, [activeTab]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      console.log('Friends page - loadFriends called, user._friendsList:', user?._friendsList);
      if (user?._friendsList && user._friendsList.length > 0) {
        console.log('Loading friends for user:', user.id, 'Friends list:', user._friendsList);
        const friendsData = await getUsersByIds(user._friendsList);
        console.log('Loaded friends data:', friendsData);
        
        // Check if some users were not found (deleted or don't exist)
        if (friendsData?.length !== user._friendsList.length) {
          console.warn('Friends MISMATCH: Expected', user._friendsList.length, 'but got', friendsData?.length);
          console.warn('Cleaning up non-existent users from _friendsList');
          
          // Get IDs of found users
          const foundUserIds = friendsData.map(u => u.id);
          
          // Find IDs that don't exist anymore
          const invalidIds = user._friendsList.filter(id => !foundUserIds.includes(id));
          console.log('Invalid friend IDs to remove:', invalidIds);
          
          // Remove invalid IDs from Firestore
          if (invalidIds.length > 0) {
            await firestore()
              .collection('Users')
              .doc(user.id)
              .update({
                _friendsList: firestore.FieldValue.arrayRemove(...invalidIds)
              });
            console.log('Successfully cleaned up', invalidIds.length, 'invalid user IDs from _friendsList');
          }
        }
        
        setFriends(friendsData);
      } else {
        console.log('No friends list found for user:', user?.id);
        setFriends([]);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      console.error('Error details:', error.message, error.stack);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      setLoading(true);
      console.log('===== LOAD FRIEND REQUESTS DEBUG =====');
      console.log('user._friendRequests:', user?._friendRequests);
      console.log('user._friendRequests length:', user?._friendRequests?.length);
      
      if (user?._friendRequests && user._friendRequests.length > 0) {
        console.log('Loading friend requests for user:', user.id);
        console.log('Requests IDs:', JSON.stringify(user._friendRequests));
        
        const requestsData = await getUsersByIds(user._friendRequests);
        
        console.log('Loaded friend requests data:', requestsData);
        console.log('Loaded count:', requestsData?.length);
        console.log('Expected count:', user._friendRequests.length);
        
        // Check if some users were not found (deleted or don't exist)
        if (requestsData?.length !== user._friendRequests.length) {
          console.warn('MISMATCH: Expected', user._friendRequests.length, 'but got', requestsData?.length);
          console.warn('Cleaning up non-existent users from _friendRequests');
          
          // Get IDs of found users
          const foundUserIds = requestsData.map(u => u.id);
          console.log('Found user IDs:', foundUserIds);
          
          // Find IDs that don't exist anymore
          const invalidIds = user._friendRequests.filter(id => !foundUserIds.includes(id));
          console.log('Invalid user IDs to remove:', invalidIds);
          
          // Remove invalid IDs from Firestore
          if (invalidIds.length > 0) {
            await firestore()
              .collection('Users')
              .doc(user.id)
              .update({
                _friendRequests: firestore.FieldValue.arrayRemove(...invalidIds)
              });
            console.log('Successfully cleaned up', invalidIds.length, 'invalid user IDs from _friendRequests');
          }
        }
        
        setFriendRequests(requestsData);
      } else {
        console.log('No friend requests found for user:', user?.id);
        setFriendRequests([]);
      }
      console.log('===== END DEBUG =====');
    } catch (error) {
      console.error('Error loading friend requests:', error);
      console.error('Error details:', error.message, error.stack);
      setFriendRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const RenderFlatListHeader = () => {
    return (
      <View>
        <View>
          <Wrapper
            marginVerticalSmall
            marginHorizontalBase
            flexDirectionRow
            alignItemsCenter
            justifyContentSpaceBetween>
            <Text isSmallTitle isMediumFont>
              {t('FRIENDS')}
            </Text>
            <Icons.Button
              isRound
              customIcon={appIcons.Menu}
              iconSize={scale(22)}
              customPadding={responsiveWidth(2.5)}
              isWithBorder
              buttonStyle={{backgroundColor: colors.appBgColor1}}
              onPress={() => {
                setOptionShown(!OptionShown);
              }}
            />
          </Wrapper>
        </View>
        <Spacer isSmall />
        {/* Segment Control for Friends/Requests */}
        <Wrapper
          marginHorizontalBase
          flexDirectionRow
          alignItemsCenter
          justifyContentCenter
          style={{
            backgroundColor: colors.appBgColor2,
            borderRadius: responsiveWidth(25),
            padding: responsiveWidth(2),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
          <Pressable
            onPress={() => setActiveTab('friends')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'friends' ? colors.appPrimaryColor : 'transparent',
              borderRadius: responsiveWidth(20),
              paddingVertical: responsiveWidth(3),
              paddingHorizontal: responsiveWidth(4),
              alignItems: 'center',
              justifyContent: 'center',
              transform: activeTab === 'friends' ? [{ scale: 1.02 }] : [{ scale: 1 }],
              shadowColor: activeTab === 'friends' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: activeTab === 'friends' ? 0.2 : 0,
              shadowRadius: activeTab === 'friends' ? 4 : 0,
              elevation: activeTab === 'friends' ? 4 : 0,
            }}>
            <Text
              style={{
                fontSize: responsiveWidth(3.5),
                fontWeight: activeTab === 'friends' ? '600' : '400',
                color: activeTab === 'friends' ? colors.appBgColor1 : colors.appTextColor2,
                letterSpacing: 0.5,
              }}>
              {t('FRIENDS')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('requests')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'requests' ? colors.appPrimaryColor : 'transparent',
              borderRadius: responsiveWidth(20),
              paddingVertical: responsiveWidth(3),
              paddingHorizontal: responsiveWidth(4),
              alignItems: 'center',
              justifyContent: 'center',
              transform: activeTab === 'requests' ? [{ scale: 1.02 }] : [{ scale: 1 }],
              shadowColor: activeTab === 'requests' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: activeTab === 'requests' ? 0.2 : 0,
              shadowRadius: activeTab === 'requests' ? 4 : 0,
              elevation: activeTab === 'requests' ? 4 : 0,
            }}>
            <Text
              style={{
                fontSize: responsiveWidth(3.5),
                fontWeight: activeTab === 'requests' ? '600' : '400',
                color: activeTab === 'requests' ? colors.appBgColor1 : colors.appTextColor2,
                letterSpacing: 0.5,
              }}>
              {t('REQUESTS')}
            </Text>
          </Pressable>
        </Wrapper>
        <Spacer isBasic />
        {/* Conditional content based on active tab */}
        {activeTab === 'friends' ? (
          <>
            <Labels.Normal Label={`${t('ALLFRIENDS')} (${user?._friendsList?.length || 0})`} />
            <Spacer isBasic />
          </>
        ) : (
          <>
            <Labels.Normal Label={`${t('FRIENDREQUEST')} (${user?._friendRequests?.length || 0})`} />
            <Spacer isBasic />
          </>
        )}
      </View>
    );
  };

  const renderFriendItem = ({item, index}) => (
    <FriendRenderDetail Detail={item} key={index} type={activeTab} onRefresh={refreshData} />
  );

  const renderEmptyState = () => (
    <Wrapper marginHorizontalBase alignItemsCenter justifyContentCenter style={{marginTop: responsiveHeight(20)}}>
      <Text isMedium isBoldFont alignTextCenter>
        {activeTab === 'friends' ? t('NOFRIENDS') : t('NOFRIENDREQUESTS')}
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

  return (
    <Wrapper flex={1} backgroundColor={colors.appBgColor1}>
      <Spacer isStatusBarHeigt />
      <StatusBars.Dark />
      <FlatList
        data={activeTab === 'friends' ? friends : friendRequests}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<RenderFlatListHeader />}
        renderItem={({item, index}) => (
          <FriendRenderDetail Detail={item} key={index} type={activeTab} onRefresh={refreshData} />
        )}
        ListEmptyComponent={loading ? renderLoadingState : renderEmptyState}
        ListFooterComponent={<Spacer height={responsiveHeight(12)} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {/* Options ConTainer */}
      {OptionShown ? (
        <Wrapper
          paddingHorizontalBase
          paddingVerticalBase
          backgroundColor={colors.appBgColor1}
          isAbsolute
          style={{
            top: responsiveHeight(12),
            right: responsiveWidth(9.5),
            zIndex: 3,
            borderRadius: responsiveWidth(3),
            // Allow content-driven height and make wider for small devices
            minHeight: responsiveHeight(12),
            width: responsiveWidth(55),
            maxWidth: responsiveWidth(80),
            ...appStyles.shadowDark,
          }}>
          <View>
            <Text
              isSmall
              isRegularFont
              onPress={() => {
                setOptionShown(!OptionShown);
                navigate(routes.inviteFriends);
              }}>
              {t('INVITEFRIENDS')}
            </Text>
            <Spacer isSmall />
            <Text
              isSmall
              isRegularFont
              onPress={() => {
                setOptionShown(!OptionShown);
                navigate(routes.blockedUser);
              }}>
              {t('BLOCKEDUSER')}{' '}
              <Text isSmall isRegularFont isPrimaryColor>
                ({user?._blockList?.length || 0})
              </Text>
            </Text>
            <Spacer isSmall />
          </View>
        </Wrapper>
      ) : null}
      {/* to Close that option Container */}
      {OptionShown ? (
        <Wrapper
          isAbsoluteFill
          style={{
            height: responsiveHeight(110),
            top: 0,
            left: 0,
            zIndex: 1,
          }}>
          <Pressable
            style={{flex: 1}}
            onPress={() => {
              setOptionShown(!OptionShown);
            }}
          />
        </Wrapper>
      ) : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  BadgeMainContainer: {
    height: scale(8),
    width: scale(8),
    top: scale(5),
    left: scale(39),
    backgroundColor: colors.appBgColor1,
    borderRadius: responsiveWidth(100),
    //padding: scale(1.5),
    //justifyContent: 'center',
    //alignItems: 'center',
  },
  BadgeInnerContainer: {
    flex: 1,
    margin: scale(1.1),
    // alignSelf: 'center',
    //left: scale(0.06),
    backgroundColor: '#13C634',
    borderRadius: responsiveWidth(100),
  },
});
