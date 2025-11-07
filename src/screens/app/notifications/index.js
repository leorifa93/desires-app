import React, { useState, useEffect } from 'react';
import { FlatList, View, TouchableOpacity, Alert } from 'react-native';
import { Headers, Spacer, Text, Wrapper, Images } from '../../../components';
import { colors, responsiveHeight, responsiveWidth, appIcons } from '../../../services';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../../../store/actions/auth';
import { useTranslation } from 'react-i18next';
import firestore from '@react-native-firebase/firestore';
import { Membership } from '../../../constants/User';
import { navigate } from '../../../navigation/rootNavigation';
import { routes } from '../../../services';
import { serializeFirestoreData } from '../../../utils/serializeFirestoreData';
import badgeService from '../../../services/badgeService';

export default function Notifications() {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    if (user?.id) {
      console.log('Notifications - User status:', { 
        membership: user.membership, 
        isAdmin: user.isAdmin,
        canSeeProfile: ![Membership.Standard, Membership.Silver].includes(user.membership) || user.isAdmin
      });
      getLikes();
    }
  }, [user]);

  const getLikes = async () => {
    try {
      setLoading(true);
      
      // Get likes from Firestore like in old project
      const likesSnapshot = await firestore()
        .collection('Likes')
        .doc(user.id)
        .collection('Users')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const likesData = likesSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Like doc data:', data);
        return {
          id: doc.id,
          ...data,
          doc: doc
        };
      });

      console.log('Likes data:', likesData);
      console.log('First like:', likesData[0]);
      setLikes(likesData);
    } catch (error) {
      console.error('Error getting likes:', error);
      Alert.alert(t('ERROR'), t('FAILED_TO_LOAD_LIKES'));
    } finally {
      setLoading(false);
    }
  };

  const showProfile = async (like) => {
    console.log('showProfile called with:', like);
    
    try {
      // Check if like has valid sentFrom data
      if (!like || !like.sentFrom || !like.sentFrom.id) {
        console.error('Invalid like data:', like);
        Alert.alert(t('ERROR'), t('INVALID_LIKE_DATA'));
        return;
      }

      // Check permissions like in old project - but also allow admins
      if (![Membership.Standard, Membership.Silver].includes(user.membership) || user.isAdmin) {
        // Premium members can see who liked them
        console.log('Premium user - showing profile');
        
        // Update badge and navigate to profile
        console.log('Like clicked successfully:', like.sentFrom.id);
        console.log('Like seen status:', like.seen);
        
        // Only update badge if like hasn't been seen yet
        const shouldUpdateBadge = !like.seen;
        
        try {
          // Update badge count in Redux only if not seen
          if (shouldUpdateBadge && user && user._badges) {
            const newBadges = {
              ...user._badges,
              likes: Math.max(0, (user._badges.likes || 0) - 1)
            };
            
            console.log('Updating badge from:', user._badges.likes, 'to:', newBadges.likes);
            
            const updatedUser = {
              ...user,
              _badges: newBadges
            };
            
            // Serialize the user data before dispatching
            const serializedUser = serializeFirestoreData(updatedUser);
            
            dispatch(setUser({
              user: serializedUser,
              dataLoaded: true
            }));
            
            // Update app icon badge
            try {
              badgeService.updateBadge(serializedUser);
            } catch (error) {
              console.error('Error updating badge:', error);
            }
          } else if (!shouldUpdateBadge) {
            console.log('Like already seen, skipping badge update');
          }
          
          // Mark as seen in Firestore immediately (only if not already seen)
          if (shouldUpdateBadge) {
            await firestore()
              .collection('Likes')
              .doc(user.id)
              .collection('Users')
              .doc(like.sentFrom.id)
              .update({ seen: true });
          }
          
          // Update local state to mark as seen immediately
          setLikes(prevLikes => 
            prevLikes.map(item => 
              item.id === like.id ? { ...item, seen: true } : item
            )
          );
          
          // Navigate to profile
          navigate(routes.userProfile, { userId: like.sentFrom.id, visiterProfile: true });
          
        } catch (error) {
          console.error('Error updating like:', error);
          Alert.alert(t('ERROR'), t('FAILED_TO_UPDATE_LIKE'));
        }

      } else {
        // Standard/Silver members cannot see who liked them - show upgrade alert
        console.log('Standard user - showing upgrade alert');
        Alert.alert(
          t('GETLIKEDABOINFORMATION'),
          '',
          [
            {
              text: t('UPGRADE'),
              onPress: () => {
                navigate(routes.subscription);
              }
            },
            {
              text: t('CANCEL'),
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('showProfile error:', error);
      Alert.alert(t('ERROR'), t('SOMETHING_WENT_WRONG'));
    }
  };

  const renderLikeItem = ({ item: like }) => {
    // Safety checks
    if (!like || !user) {
      return null;
    }
    
    const canSeeProfile = ![Membership.Standard, Membership.Silver].includes(user.membership) || user.isAdmin;
    
    return (
      <TouchableOpacity
        onPress={() => {
          console.log('Like item pressed:', like.id);
          try {
            showProfile(like);
          } catch (error) {
            console.error('Touch error:', error);
            Alert.alert(t('ERROR'), t('FAILED_TO_OPEN_PROFILE'));
          }
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: responsiveWidth(4),
          paddingVertical: responsiveHeight(2),
          backgroundColor: like.seen ? 'transparent' : colors.appPrimaryColor + '10',
          borderBottomWidth: 1,
          borderBottomColor: colors.appBorderColor2,
        }}
      >
        {/* Avatar */}
        <View style={{ marginRight: responsiveWidth(3) }}>
          {canSeeProfile && like.sentFrom ? (
            <Images.Round
              source={{ uri: like.sentFrom?.profilePictures?.thumbnails?.small }}
              size={responsiveWidth(12)}
              fallbackSource={{ uri: 'https://via.placeholder.com/100/cccccc/666666?text=?' }}
            />
          ) : (
            // Blurred avatar for Standard/Silver members or missing data
            <View
              style={{
                width: responsiveWidth(12),
                height: responsiveWidth(12),
                borderRadius: responsiveWidth(6),
                backgroundColor: colors.appBorderColor2,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: 0.3,
              }}
            >
              <Text style={{ fontSize: responsiveWidth(6), color: colors.appTextColor2 }}>
                👤
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {canSeeProfile && like.sentFrom && (
            <Text
              isRegular
              style={{
                fontSize: responsiveWidth(4),
                color: colors.appTextColor1,
                marginBottom: responsiveHeight(0.5),
              }}
            >
              {like.sentFrom.username || 'Unknown User'}
            </Text>
          )}
          <Text
            isSmall
            style={{
              color: colors.appTextColor2,
            }}
          >
            {t('SENTYOUALIKE')}
          </Text>
        </View>

        {/* Time */}
        <Text
          isSmall
          style={{
            color: colors.appTextColor2,
            fontSize: responsiveWidth(3),
          }}
        >
          {formatTimeAgo(like.createdAt)}
        </Text>
      </TouchableOpacity>
    );
  };

  const formatTimeAgo = (timestamp) => {
    try {
      if (!timestamp) return '';
      
      // Handle Firestore Timestamp
      const time = timestamp.toDate ? timestamp.toDate().getTime() : timestamp;
      
      const now = Date.now();
      const diff = now - time;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  return (
    <Wrapper isMain>
      <Headers.Primary
        showBackArrow
        headerTitle={
          <Text
            alignTextCenter
            isSmallTitle
            style={{
              fontSize: responsiveWidth(4.5),
            }}
          >
            {t('LIKES')}
          </Text>
        }
      />
      
      {loading ? (
        <Wrapper isCenter flex={1}>
          <Text>Loading...</Text>
        </Wrapper>
      ) : likes.length === 0 ? (
        <Wrapper isCenter flex={1}>
          <Text
            alignTextCenter
            isRegular
            style={{
              color: colors.appTextColor2,
              marginHorizontal: responsiveWidth(8),
            }}
          >
            {t('NO_LIKES_YET')}
          </Text>
        </Wrapper>
      ) : (
        <FlatList
          data={likes}
          renderItem={renderLikeItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: responsiveHeight(1),
          }}
        />
      )}
    </Wrapper>
  );
}
