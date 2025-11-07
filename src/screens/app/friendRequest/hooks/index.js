import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../../../../store/actions/auth';
import { getUsersByIds, acceptFriendRequest, rejectFriendRequest } from '../../../../services/firebaseUtilities/user';
import firestore from '@react-native-firebase/firestore';
import {
  appImages,
  appStyles,
  colors,
  fontSizes,
  responsiveHeight,
  responsiveWidth,
} from '../../../../services';
import { scale } from 'react-native-size-matters';
import {
  Icons,
  Images,
  Lines,
  Spacer,
  Text,
  Wrapper,
} from '../../../../components';
import { useTranslation } from 'react-i18next';
import { navigate } from '../../../../navigation/rootNavigation';
import { routes } from '../../../../services';

export function useHooks() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    loadFriendRequests();
  }, [user?.id, user?._friendRequests]);

  const loadFriendRequests = async () => {
    try {
      setLoading(true);
      if (user?._friendRequests && user._friendRequests.length > 0) {
        const requestsData = await getUsersByIds(user._friendRequests);
        setFriendRequests(requestsData);
      } else {
        setFriendRequests([]);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
      setFriendRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // loadFriendRequests function removed - now handled by real-time snapshot

  const handleAcceptRequest = async (requestUser) => {
    try {
      setProcessing(prev => ({ ...prev, [requestUser.id]: 'accepting' }));
      
      await acceptFriendRequest(requestUser, user);
      
      // Simply filter out the accepted request from the list
      setFriendRequests(prev => prev.filter(req => req.id !== requestUser.id));
      
      // Update Redux for badge updates
      const updatedFriendRequests = user._friendRequests?.filter(id => id !== requestUser.id) || [];
      const updatedFriendsList = [...(user._friendsList || []), requestUser.id];
      const updatedUser = {
        ...user,
        _friendRequests: updatedFriendRequests,
        _friendsList: updatedFriendsList
      };
      dispatch(setUser(updatedUser));
      
      console.log('Friend request accepted and filtered from list');
      
      Alert.alert(
        t('SUCCESS') || 'Success',
        t('FRIEND_REQUEST_ACCEPTED') || 'Friend request accepted!',
        [
          {
            text: t('OK') || 'OK',
            onPress: () => {
              // Force reload friend requests to ensure UI is updated
              loadFriendRequests();
              // Navigate to friends tab to show the new friend
              navigate(routes.friends, { activeTab: 'friends' });
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert(
        t('ERROR') || 'Error',
        t('FRIEND_REQUEST_ACCEPT_FAILED') || 'Failed to accept friend request'
      );
    } finally {
      setProcessing(prev => ({ ...prev, [requestUser.id]: null }));
    }
  };

  const handleRejectRequest = async (requestUser) => {
    try {
      setProcessing(prev => ({ ...prev, [requestUser.id]: 'rejecting' }));
      
      await rejectFriendRequest(requestUser, user);
      
      // Simply filter out the rejected request from the list
      setFriendRequests(prev => prev.filter(req => req.id !== requestUser.id));
      
      // Update Redux for badge updates
      const updatedFriendRequests = user._friendRequests?.filter(id => id !== requestUser.id) || [];
      const updatedUser = {
        ...user,
        _friendRequests: updatedFriendRequests
      };
      dispatch(setUser(updatedUser));
      
      console.log('Friend request rejected and filtered from list');
      
      // Show success message
      Alert.alert(
        t('SUCCESS') || 'Success',
        t('FRIEND_REQUEST_REJECTED') || 'Friend request rejected'
      );
      
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      Alert.alert(
        t('ERROR') || 'Error',
        t('FRIEND_REQUEST_REJECT_FAILED') || 'Failed to reject friend request'
      );
    } finally {
      setProcessing(prev => ({ ...prev, [requestUser.id]: null }));
    }
  };

  const FriendRenderDetail = ({ Detail }) => {
    const styles = StyleSheet.create({
      BadgeMainContainer: {
        bottom: scale(2),
        right: scale(2),
        borderRadius: responsiveWidth(100),
        borderWidth: 2,
        borderColor: colors.appBgColor1,
        backgroundColor: colors.appOnlineColor,
        height: scale(16),
        width: scale(16),
        justifyContent: 'center',
        alignItems: 'center',
        padding: scale(18),
        zIndex: 2,
      },
    });

    const isProcessing = processing[Detail?.id];

    return (
      <View style={{ flex: 1 }}>
        <Wrapper
          flexDirectionRow
          marginHorizontalBase
          alignItemsCenter>
          {/* Image */}
          <Wrapper>
            <Images.Round 
              source={Detail?.profilePictures?.thumbnails?.big ? 
                { uri: Detail.profilePictures.thumbnails.big } : 
                appImages.image4
              } 
              size={scale(48)} 
            />
            {/* Badge */}
            {Detail?.ShowOnline ? (
              <Wrapper isAbsolute style={styles.BadgeMainContainer}>
                <Wrapper style={styles.BadgeInnerContainer} />
              </Wrapper>
            ) : null}
          </Wrapper>
          
          {/* Text Name And Info */}
          <Wrapper
            marginHorizontalSmall
            style={{ width: responsiveWidth(45) }}>
            <Text isRegular isBoldFont>
              {Detail?.username || Detail?.name}, {Detail?.age}
            </Text>
            <Text isSmall isRegularFont isTextColor2>
              {Detail?.currentLocation?.city || Detail?.location} - {Detail?.distance}km
            </Text>
          </Wrapper>
          
          {/* Action Buttons */}
          <Wrapper
            flex={1}
            style={{ height: responsiveHeight(4) }}>
            <Wrapper flexDirectionRow justifyContentSpaceAround>
              <TouchableOpacity
                onPress={() => handleAcceptRequest(Detail)}
                disabled={isProcessing}
                style={{ opacity: isProcessing === 'accepting' ? 0.5 : 1 }}>
                <Icons.WithText
                  direction={'row-reverse'}
                  iconName={'checkmark-outline'}
                  iconType={'ionicon'}
                  tintColor={colors.appOnlineColor}
                  iconSize={scale(18)}
                  title={isProcessing === 'accepting' ? t('ACCEPTING') || 'Accepting...' : t('ACCEPT') || 'Accept'}
                  titleStyle={{
                    color: colors.appOnlineColor,
                    fontSize: fontSizes.small,
                    fontFamily: appStyles.fontMedium,
                  }}
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleRejectRequest(Detail)}
                disabled={isProcessing}
                style={{ opacity: isProcessing === 'rejecting' ? 0.5 : 1 }}>
            <Icons.WithText
              direction={'row-reverse'}
              iconName={'close-outline'}
              iconType={'ionicon'}
              tintColor={colors.appBorderColor1}
              iconSize={scale(18)}
                  title={isProcessing === 'rejecting' ? t('REJECTING') || 'Rejecting...' : t('REJECT') || 'Reject'}
              titleStyle={{
                    color: colors.appBorderColor1,
                fontSize: fontSizes.small,
                    fontFamily: appStyles.fontMedium,
              }}
            />
              </TouchableOpacity>
            </Wrapper>
          </Wrapper>
        </Wrapper>
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
  };

  const data = friendRequests;

  return { FriendRenderDetail, data, loading, loadFriendRequests };
}