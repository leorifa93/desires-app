import React, { useRef, useState, useEffect, useCallback } from 'react';
import {Wrapper, Headers, Cards, Icons, Text} from '../../../components';
import {useHooks} from './hooks';
import Swiper from 'react-native-deck-swiper';
import {appIcons, appSvgs, colors, responsiveWidth, responsiveHeight, sizes, calcDistance, routes} from '../../../services';
import {scale, verticalScale} from 'react-native-size-matters';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import { getUsersByDistance } from '../../../services/firebaseUtilities/user';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { navigationRef } from '../../../navigation/rootNavigation';

const SwiperComponent = React.memo(
  ({
    swiperRef,
    SwipeDeckData,
    currentCardIndex,
    setSwipeTrun,
    onSwipedAll,
    onSwiping,
    renderCard,
    onSwiped,
    onSwipedLeft,
    onSwipedRight,
  }) => {
    return (
      <Swiper
        ref={swiperRef}
        cardHorizontalMargin={sizes.baseMargin}
        cardVerticalMargin={responsiveHeight(2)}
        containerStyle={{ marginTop: responsiveHeight(12) }}
        cards={SwipeDeckData}
        verticalSwipe={false}
        stackSize={3}
        onSwiped={onSwiped}
        onSwipedLeft={onSwipedLeft}
        onSwipedRight={onSwipedRight}
        overlayLabels={{
          left: {
            element: (
              <LinearGradient
                colors={['rgba(34, 24, 49, 0)', colors.appPrimaryColor + 90]}
                start={{x: 0, y: 0}}
                end={{x: 0, y: 1}}
                style={{
                  flex: 1,
                  width: responsiveWidth(90),
                  borderRadius: responsiveWidth(5),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Icons.Svg svg={appSvgs.like} size={scale(150)} />
              </LinearGradient>
            ),
            style: {
              wrapper: {
                flex: 1,
                height: verticalScale(420),
                alignItems: 'center',
                justifyContent: 'center',
              },
            },
          },
          right: {
            element: (
              <Icons.Svg svg={appSvgs.dislike} size={scale(150)} />
            ),
            style: {
              wrapper: {
                flex: 1,
                height: verticalScale(420),
                alignItems: 'center',
                justifyContent: 'center',
              },
            },
          },
        }}
        onSwipedAll={onSwipedAll}
        onSwiping={onSwiping}
        stackSeparation={-scale(10)}
        stackScale={5}
        backgroundColor={colors.transparent}
        renderCard={renderCard}
      />
    );
  },
);

export default function Index() {
  const swiperRef = useRef(null);
  const { t } = useTranslation();
  const isSwipingRef = useRef(false);
  const {
    TopRightButtonsData,
    RenderEmptyList,
    SwipeDeckData,
    setSwipeDeckData,
    updateSwipeDeckData,
    SwipeTrun,
    setSwipeTrun,
    currentCardIndex,
    setCurrentCardIndex,
    fetchSwipeData
  } = useHooks();
  const user = useSelector(state => state.auth.user);
  
  // State variables like in old project
  const [users, setUsers] = useState([]);
  const [likes, setLikes] = useState([]);
  const [usedIds, setUsedIds] = useState([]);
  const [snapshot, setSnapshot] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [likesReceivedCount, setLikesReceivedCount] = useState(0);
  const [isDeckReady, setIsDeckReady] = useState(false);
  const isLoadingUsersRef = useRef(false);
  const deckReadyRef = useRef(false);

  useEffect(() => {
    if (user) {
      // Clear users first to prevent showing old profiles
      setUsers([]);
      setUsedIds([]);
      setIsDeckReady(false); // Reset deck ready state
      deckReadyRef.current = false; // Reset deck ready ref
      // Initialize like data and get users like in old project
      // Use longer timeout to ensure state is completely cleared before loading
      setTimeout(() => {
        getLikesAndUsers();
      }, 200); // Longer delay to ensure clean state
    }
  }, [user?.id]); // Only reload when user ID changes (initial load)

  // Reload users when location changes
  useEffect(() => {
    if (user && user.currentLocation) {
      console.log('Hot or Not: Location changed, reloading users...');
      console.log('Hot or Not: User currentLocation:', user?.currentLocation);
      console.log('Hot or Not: User location:', user?.location);
      console.log('Hot or Not: Location type:', user?.location?.type);
      
      // Clear current users and reload
      setUsers([]);
      getLikesAndUsers();
    }
  }, [
    user?.currentLocation?.lat, 
    user?.currentLocation?.lng
  ]);

  // Batch sync - only update when loading is complete to prevent nacheinander loading
  useEffect(() => {
    if (users.length > 0 && !loading && !isLoadingUsersRef.current && !deckReadyRef.current) {
      console.log('Hot or Not: Syncing users with SwipeDeckData, users count:', users.length);
      
      // Use longer timeout to ensure all state updates are complete
      setTimeout(() => {
        updateSwipeDeckData(users, usedIds);
        // Mark deck as ready after timeout
        console.log('Hot or Not: Setting deck as ready');
        setIsDeckReady(true);
        deckReadyRef.current = true; // Prevent multiple executions
      }, 500); // Longer timeout to ensure all updates are complete
    }
  }, [users.length, loading]); // ONLY depend on users.length and loading, NOT usedIds

  // Badge: live count of received likes (like tab badge) - from subcollection
  useEffect(() => {
    if (!user?.id) return;
    const unsub = firestore()
      .collection('Likes')
      .doc(user.id)
      .collection('Users')
      .where('isLike', '==', false) // isLike: false means it's a like received (not sent)
      .onSnapshot((snap) => {
        setLikesReceivedCount(snap.size || 0);
      }, () => {});
    return () => unsub();
  }, [user?.id]);

  const getLikesAndUsers = async () => {
    try {
      // Get likes from subcollection like in old project: Likes/{userId}/SentTo/{targetUserId}
      const senderCol = firestore().collection('Likes').doc(user.id).collection('SentTo');
      const sentToSnap = await senderCol.get().catch(() => ({ docs: [] }));
      
      // Extract target user IDs from subcollection (like in old project)
      const sentToIds = sentToSnap.docs.map(d => d.id); // d.id is the targetUserId
      setUsedIds(sentToIds);
      
      // Now get users
      getUsers();
    } catch (error) {
      console.error('Fehler beim Abrufen der Likes:', error);
      // If likes fail, still try to get users
      getUsers();
    }
  };

  // Realtime: keep usedIds in sync from subcollection like in old project
  // DISABLED: This causes multiple useEffect triggers and additional cards
  // useEffect(() => {
  //   if (!user?.id) return;
  //   const senderCol = firestore().collection('Likes').doc(user.id).collection('SentTo');
  //   const unsub = senderCol.onSnapshot((snap) => {
  //     const sentToIds = snap.docs.map(d => d.id); // d.id is the targetUserId
  //     setUsedIds(sentToIds);
  //   }, (error) => {
  //     console.error('Error listening to likes subcollection:', error);
  //   });
  //   return () => unsub();
  // }, [user?.id]);

  const getUsers = async () => {
    // Prevent multiple simultaneous loads
    if (isLoadingUsersRef.current) {
      console.log('Hot or Not: getUsers already in progress, skipping...');
      return;
    }
    
    isLoadingUsersRef.current = true;
    setLoading(true);

    // Get distance from user settings or use default
    const distance = user?._settings?.perimeterValue || 50; // Default 50km

    try {
      let allUsers = [];

      // Always use currentLocation (like old project)
      const baseLocation = user?.currentLocation;
      
      if (baseLocation?.lat && baseLocation?.lng) {
        console.log('Hot or Not: Using base location:', baseLocation);
        // Load ALL nearby users by distance using geohash bounds
        const nearby = await getUsersByDistance(baseLocation, distance);
        allUsers = nearby.map(u => ({ id: u.id, ...u }));
      }

      // Fallback: top boosted/premium users if no location-based results
      if (!allUsers || allUsers.length === 0) {
        const snap = await firestore()
          .collection('Users')
          .where('status', '==', 1)
          .orderBy('membership', 'desc')
          .orderBy('lastBoostAt', 'desc')
          .limit(100) // Load more users at once
          .get();
        allUsers = snap.docs.map(doc => ({ id: doc.id, doc, ...doc.data() }));
      }

      const getId = u => u?.id || u?.userId || u?.uid;
      // Filter like in old project + strict de-dupe against usedIds and current users
      const filteredUsers = allUsers.filter(u =>
        !usedIds.includes(getId(u)) &&
        !users.some(ex => getId(ex) === getId(u)) &&
        (user?.genderLookingFor?.includes?.(u.gender) ?? true) &&
        (u.status === 'active' || u.status === 1) &&
        ![4, 5, 6].includes(u.membership) &&
        (u.profilePictures?.original || u.profilePictures?.thumbnails?.big)
      );

      // Always append new users (simplified approach)
      setUsers(prev => {
        const newUsers = [...prev, ...filteredUsers];
        console.log(`Loaded ${filteredUsers.length} additional users for Hot or Not, total: ${newUsers.length}`);
        return newUsers;
      });
      
      // Use setTimeout to ensure setUsers is complete before setting loading to false
      setTimeout(() => {
        setLoading(false);
        isLoadingUsersRef.current = false;
      }, 100);
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzer:', error);
      setLoading(false);
      isLoadingUsersRef.current = false;
    }
  };

  const handleSwipedAll = () => {
    console.log('Hot or Not: All cards swiped, loading more users...');
    setSwipeDeckData([]);
    setCurrentCardIndex('');
    setIsDeckReady(false); // Reset deck ready state
    deckReadyRef.current = false; // Reset deck ready ref
    // Load more users when all cards are swiped
    getUsers();
  };

  const handleSwiping = () => {
    // Simple swiping handler - no complex logic
    console.log('Hot or Not: User is swiping');
  };

  const handleSwiped = (cardIndex) => {
    console.log('Hot or Not: Card swiped, index:', cardIndex);
  };

  const handleSwipedLeft = (cardIndex) => {
    console.log('Hot or Not: Card swiped left, index:', cardIndex);
    const card = users[cardIndex];
    if (card) {
      handleSwipe('left', cardIndex, card);
    }
  };

  const handleSwipedRight = (cardIndex) => {
    console.log('Hot or Not: Card swiped right, index:', cardIndex);
    const card = users[cardIndex];
    if (card) {
      handleSwipe('right', cardIndex, card);
    }
  };

  const handleSwipe = async (direction, cardIndex, sentTo) => {
    try {
      const getId = u => u?.id || u?.userId || u?.uid;
      const targetId = getId(sentTo);
      
      // Mark as swiping to prevent state changes
      isSwipingRef.current = true;
      
      // Mark as used but don't remove from array - let Swiper handle the display
      setUsedIds(prev => (prev.includes(targetId) ? prev : [...prev, targetId]));

      if (direction === 'left') {
        // Like - check if user has likes available
        if (user?.likesAvailableCount > 0 || ![0, 5].includes(user?.membership)) {
          // Decrease available likes
          if (user.likesAvailableCount > 0) {
            user.likesAvailableCount--;
            // Update user in Firestore
            await firestore().collection('Users').doc(user.id).update({
              likesAvailableCount: user.likesAvailableCount
            });
          }

          // Add to likes subcollection like in old project: Likes/{userId}/SentTo/{targetUserId}
          await firestore().collection('Likes').doc(user.id).collection('SentTo').doc(targetId).set({
            createdOn: firestore.FieldValue.serverTimestamp(),
            isLike: true,
          }, { merge: true });

          // Also save for the other user's notification: Likes/{targetUserId}/Users/{userId}
          await firestore().collection('Likes').doc(targetId).collection('Users').doc(user.id).set({
            sentFrom: {
              id: user.id,
              username: user.username,
              profilePictures: user.profilePictures
            },
            createdAt: firestore.FieldValue.serverTimestamp(),
            seen: false,
            isLike: false
          }, { merge: true });
        } else {
          // No likes available - show upgrade message
          Alert.alert(
            t('NOCOINSANYMORELIKES'),
            '',
            [
              {
                text: t('UPGRADE'),
                onPress: () => {
                  navigationRef.current?.navigate(routes.subscription);
                }
              },
              {
                text: t('CANCEL'),
                style: 'cancel'
              }
            ]
          );
        }
      } else {
        // Dislike (persist in subcollection so it won't reappear)
        await firestore().collection('Likes').doc(user.id).collection('SentTo').doc(targetId).set({
          createdOn: firestore.FieldValue.serverTimestamp(),
          isLike: false,
        }, { merge: true });

        // Also save for the other user: Likes/{targetUserId}/Users/{userId}
        await firestore().collection('Likes').doc(targetId).collection('Users').doc(user.id).set({
          sentFrom: {
            id: user.id,
            username: user.username,
            profilePictures: user.profilePictures
          },
          createdAt: firestore.FieldValue.serverTimestamp(),
          seen: false,
          isLike: false
        }, { merge: true });
      }
      
      // Reset swiping flag after a delay to allow UI to settle
      setTimeout(() => {
        isSwipingRef.current = false;
        // No auto-loading during swipe - only when all cards are gone
      }, 500);
      
    } catch (error) {
      console.error('Fehler beim Behandeln des Swipes:', error);
      isSwipingRef.current = false;
    }
  };

  const renderCard = useCallback((card, cardIndex) => {
    // Skip cards that have already been swiped
    const cardId = card.id || card.userId || card.uid;
    if (usedIds.includes(cardId)) {
      return null;
    }

    // Calculate distance string like on Home/UserProfile
    let distanceStr = '';
    try {
      const base = user?.currentLocation;
      if (base && card?.currentLocation) {
        const km = Number(
          calcDistance(
            base.lat,
            base.lng,
            card.currentLocation.lat,
            card.currentLocation.lng,
            5
          )
        );
        const unit = user?._settings?.units?.distanceType === 'Mi' ? 'Mi' : 'Km';
        const val = unit === 'Mi' ? km * 0.621371 : km;
        distanceStr = val > 99 ? `>99${unit}` : `${val > 0 ? val.toFixed(1) : val}${unit}`;
      }
    } catch {}
    return (
      <Cards.Profile
        DeckSwiper
        key={card.id || card.userId || card.uid || cardIndex}
        CardImage={card.profilePictures?.thumbnails?.big}
        username={card.username}
        city={card.currentLocation?.city}
        distance={distanceStr}
        isVip={card.membership === 3}
        isGold={card.membership === 2}
        onPress={() => navigationRef.current?.navigate(routes.userProfile, { visiterProfile: true, userId: card.id || card.userId || card.uid })}
        onPressHot={() => {
          console.log('Hot or Not: Like button pressed');
          swiperRef.current?.swipeLeft();
        }}
        onPressNot={() => {
          console.log('Hot or Not: Dislike button pressed');
          swiperRef.current?.swipeRight();
        }}
        CardSwipeToHot={currentCardIndex === cardIndex && SwipeTrun === 1}
      />
    );
  }, [user, usedIds]);

  return (
    <Wrapper flex={1} backgroundColor={colors.appBgColor1}>
      <Headers.Common
        Title={!(users?.length >= 1) && 'Hot or Not'}
        RightButtons={[{
          ...TopRightButtonsData[2],
          badgeValue: Number(user?._badges?.likes || 0)
        }]}
        NoProfile
        MainBackgroundColor={colors.appBgColor1}
      />
      
      {/* Removed debug info */}
      
      {loading && (!Array.isArray(users) || users.length === 0) && (
        <Wrapper marginHorizontalBase style={{marginBottom: responsiveHeight(2)}}>
          <Text style={{color: 'blue', fontSize: 14, textAlign: 'center'}}>
            Lädt Benutzer...
          </Text>
        </Wrapper>
      )}
      
      {Array.isArray(SwipeDeckData) && SwipeDeckData.length > 0 && isDeckReady ? (
        <SwiperComponent
          swiperRef={swiperRef}
          SwipeDeckData={SwipeDeckData}
          currentCardIndex={currentCardIndex}
          setSwipeTrun={setSwipeTrun}
          onSwipedAll={handleSwipedAll}
          onSwiping={handleSwiping}
          onSwipedLeft={handleSwipedLeft}
          onSwipedRight={handleSwipedRight}
          onSwiped={handleSwiped}
          renderCard={renderCard}
        />
      ) : (
        <RenderEmptyList onRefresh={() => {
          setUsers([]);
          setLastDoc(null);
          setUsedIds([]);
          setIsDeckReady(false);
          deckReadyRef.current = false;
          getUsers();
        }} />
      )}
    </Wrapper>
  );
}
