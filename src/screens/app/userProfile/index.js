import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Alert,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import React, {Fragment, useEffect, useState, useRef, useMemo} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Buttons,
  Icons,
  Images,
  Labels,
  Lines,
  Modals,
  ScrollViews,
  Spacer,
  StatusBars,
  Text,
  Wrapper,
} from '../../../components';
import {
  MessageIcon,
  HeartIcon,
  AddFriendIcon,
  RequestSentIcon,
  FriendsIcon,
  EditIcon,
  LocationIcon,
} from '../../../components/icons/ProfileIcons';
import {useHooks} from './hooks';
import {
  appIcons,
  appImages,
  calcDistance,
  colors,
  fontSizes,
  getUserDetail,
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
  routes,
  sizes,
  getApprovedImageSource,
  getApprovedPublicImageSource,
  getApprovedPrivateImageSource,
  useImagePicker,
} from '../../../services';
import {color, Icon} from '@rneui/base';
import {scale} from 'react-native-size-matters';
import {goBack, navigate} from '../../../navigation/rootNavigation';
import {useSelector} from 'react-redux';
import {getDocumentById} from '../../../services/firebaseUtilities';
import {useTranslation} from 'react-i18next';
import firestore from '@react-native-firebase/firestore';

const Index = ({route}) => {
  const visiterProfile = route?.params?.visiterProfile
    ? route?.params?.visiterProfile
    : false;
  const userId = route?.params?.userId;
  const [user, setUser] = useState();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const me = useSelector(state => state.auth.user);
  const [distance, setDistance] = useState('0 km');
  const [showFullImage, setShowFullImage] = useState(false);
  const [showPrivateImages, setShowPrivateImages] = useState(false);
  const [currentPrivateImageIndex, setCurrentPrivateImageIndex] = useState(0);
  const {t} = useTranslation();
  const scrollViewRef = useRef(null);

  // Prefer original image if available
  const getPreferredImageUri = pic => {
    if (!pic) return null;
    return (
      pic.original ||
      pic.url ||
      pic.uri ||
      (pic.thumbnails &&
        (pic.thumbnails.big ||
          pic.thumbnails.medium ||
          pic.thumbnails.small)) ||
      null
    );
  };

  // Get all images (profile picture + public album) - Memoized with approval logic
  const allImages = useMemo(() => {
    if (!user) return [];

    const images = [];

    // Add main profile picture with approval check
    const mainImageSource = getApprovedImageSource(user.profilePictures, user.gender, me?.id, user?.id);
    if (mainImageSource) {
      images.push({
        uri: mainImageSource,
        type: 'profile',
      });
    }

    // Add public album images with approval check
    if (user.publicAlbum && Array.isArray(user.publicAlbum)) {
      user.publicAlbum.forEach(pic => {
        const publicImageSource = getApprovedPublicImageSource(pic, user.gender, me?.id, user?.id);
        if (publicImageSource) {
          images.push({
            uri: publicImageSource,
            type: 'public',
          });
        }
      });
    }


    // Show uploading indicator if public pictures are still uploading
    if (user.publicPicturesUploading) {
      images.push({
        uri: null,
        type: 'uploading',
        uploading: true,
      });
    }

    return images;
  }, [user?.profilePictures, user?.publicAlbum, user?.publicPicturesUploading, user?.gender, user?.id, me?.id]);

  const getAllImages = () => allImages;

  // Get private images separately
  const getPrivateImages = useMemo(() => {
    // Check access directly (don't rely on canSeePrivateGallery which might not be updated yet)
    const hasAccess = user && me && (
      me.id === user.id ||  // Own profile
      me.isAdmin ||         // Admin
      canSeePrivateGallery  // Other checks from hook
    );
    
    if (!hasAccess || !user || !user.privateAlbum || !Array.isArray(user.privateAlbum)) {
      return [];
    }
    
    const images = user.privateAlbum.map(pic => {
      const imageSource = getApprovedPrivateImageSource(pic, user.gender, me?.id, user?.id, me?.isAdmin, canSeePrivateGallery);
      
      // Check if it's a URI string or a require() object
      const isString = typeof imageSource === 'string';
      
      return {
        uri: isString ? imageSource : null,
        source: isString ? null : imageSource, // For require() objects
        type: 'private'
      };
    }).filter(img => img.uri || img.source); // Keep images with either URI or source
    
    return images;
  }, [user, canSeePrivateGallery, me?.id, me?.isAdmin]);

  const getUser = async () => {
    try {
      console.log('getUser called with userId:', userId);
      const u = await getDocumentById({collection: 'Users', id: userId});
      console.log('User loaded:', {username: u?.username, id: u?.id});
      
      // Check if user exists
      if (!u || !u.id || !u.username) {
        Alert.alert(
          t('ERROR'),
          t('USERNOTFOUND') || 'User not found',
          [
            {
              text: 'OK',
              onPress: () => goBack(),
            }
          ]
        );
        return;
      }
      
      setUser(u);
      updateDistance(u);
    } catch (err) {
      console.log('Error loading user:', err.message);
      Alert.alert(
        t('ERROR'),
        t('ERRORLOADINGUSER') || 'Error loading user',
        [
          {
            text: 'OK',
            onPress: () => goBack(),
          }
        ]
      );
    }
  };

  const updateDistance = (targetUser = user) => {
    try {
      // Get locations from currentLocation (like old project)
      // All locations are stored in user.currentLocation, not in location.currentLocation
      const myLocation = me?.currentLocation;
      const targetLocation = targetUser?.currentLocation;

      if (!myLocation || !targetLocation) return;
      
      const dis = Number(
        calcDistance(
          myLocation.lat,
          myLocation.lng,
          targetLocation.lat,
          targetLocation.lng,
          5,
        ),
      );
      const distanceType =
        me?._settings?.units?.distanceType === 'Mi' ? 'Mi' : 'Km';
      const distanceValue = distanceType === 'Mi' ? dis * 0.621371 : dis;
      setDistance(
        distanceValue > 99
          ? `>99${distanceType}`
          : (distanceValue > 0 ? distanceValue.toFixed(1) : distanceValue) +
              distanceType,
      );
    } catch (e) {
      // noop
    }
  };

  useEffect(() => {
    console.log('UserProfile useEffect:', {
      visiterProfile,
      userId,
      me: me?.username,
    });

    if (!visiterProfile) {
      if (me) {
        console.log('Setting user to me:', me.username);
        setUser(me);
      }
    } else {
      console.log('Getting user with ID:', userId);
      getUser();
    }
  }, [me, visiterProfile]);

  // Recompute distance immediately when units or locations change
  // Only watch currentLocation (like old project)
  useEffect(() => {
    updateDistance();
  }, [
    me?._settings?.units?.distanceType,
    me?.currentLocation?.lat,
    me?.currentLocation?.lng,
    user?.currentLocation?.lat,
    user?.currentLocation?.lng,
  ]);

  // Scroll to current image when modal opens
  useEffect(() => {
    if (showFullImage && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollTo({
          x: currentImageIndex * Dimensions.get('window').width,
          animated: false,
        });
      }, 100);
    }
  }, [showFullImage, currentImageIndex]);

  const {
    userAboutData,
    userInterestsData,
    userLifestyleData,
    userMoreInfoData,
    userBrandsData,
    RequestAndRevokeData,
    EditProfileModal,
    handleEditProfileModal,
    //
    AddToFavorite,
    AddToFriends,
    handleToggleAddToFavorite,
    handleToggleAddToFriends,
    // Private Gallery
    canSeePrivateGallery,
    hasRequestedAccess,
    handleUpgradeToVip,
  } = useHooks(user);

  // Send request for private gallery access
  const handleSendPrivateGalleryRequest = async () => {
    if (!me?.id || !user?.id || hasRequestedAccess) return;

    try {
      // Update local user object first
      const updatedUser = {
        ...user,
        _privateGalleryRequests: [...(user._privateGalleryRequests || []), me.id],
      };

      // Update in Firestore
      await firestore()
        .collection('Users')
        .doc(user.id)
        .update({
          _privateGalleryRequests: updatedUser._privateGalleryRequests,
        });

      // Update local state
      setUser(updatedUser);

      // Send notification
      try {
        // Import notification utilities
        const {calculateBadge, sendPushNotification, getTranslationsForLanguage} = require('../../../services/notificationUtilities');
        
        // Get translations for user's language
        const userLang = user._settings?.currentLang || 'en';
        const translations = await getTranslationsForLanguage(userLang, ['REQUESTPRIVATEGALLERY']);
        
        // Calculate badge
        const badge = await calculateBadge(updatedUser);
        
        // Send notification
        await sendPushNotification(
          updatedUser,
          {
            body: me.username + translations['REQUESTPRIVATEGALLERY'],
            badge: badge.toString(),
          },
          'privateGalleryRequest',
          {
            userId: me.id,
            type: 'PRIVATEGALLERYREQUEST',
            queryType: 'REQUESTS',
          }
        );
        
        console.log('Private gallery request notification sent');
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }

      Alert.alert(t('SUCCESS'), t('REQUEST_SENT'));
    } catch (error) {
      console.error('Error sending private gallery request:', error);
      Alert.alert(t('ERROR'), t('SOMETHING_WENT_WRONG'));
    }
  };

  // Revoke/withdraw private gallery request
  const handleRevokePrivateGalleryRequest = async () => {
    if (!me?.id || !user?.id || !hasRequestedAccess) return;

    try {
      // Remove me.id from user's _privateGalleryRequests
      const updatedRequests = (user._privateGalleryRequests || []).filter(id => id !== me.id);
      const updatedUser = {
        ...user,
        _privateGalleryRequests: updatedRequests,
      };

      // Update in Firestore
      await firestore()
        .collection('Users')
        .doc(user.id)
        .update({
          _privateGalleryRequests: updatedRequests,
        });

      // Update local state
      setUser(updatedUser);

      Alert.alert(t('SUCCESS'), t('REQUEST_REVOKED') || 'Request revoked');
    } catch (error) {
      console.error('Error revoking private gallery request:', error);
      Alert.alert(t('ERROR'), t('SOMETHING_WENT_WRONG'));
    }
  };

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <Wrapper isMain>
        <StatusBars.Light />
        <Wrapper style={styles.ProfileShownMainContainer}>
          <Text>Loading...</Text>
        </Wrapper>
      </Wrapper>
    );
  }

  return (
    <SafeAreaView style={{backgroundColor: colors.appBgColor1, flex: 1}}>
      <StatusBars.Dark />
      <ScrollView>
        <Wrapper isMain>
          <ScrollViews.WithKeyboardAvoidingView>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setShowFullImage(true)}
              style={{flex: 1}}>
              <ImageBackground
                source={
                  getAllImages()[currentImageIndex]?.uri ? 
                    (typeof getAllImages()[currentImageIndex].uri === 'string' ? 
                      {uri: getAllImages()[currentImageIndex].uri} : 
                      getAllImages()[currentImageIndex].uri
                    ) : 
                    null
                }
                style={styles.ProfileShownMainContainer}
                imageStyle={styles.ProfileImageStyle}
                resizeMode="cover"
                defaultSource={null}>
                {/* Loading Indicator */}
                {!getAllImages()[currentImageIndex]?.uri && (
                  <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: colors.appBgColor2,
                  }}>
                    <ActivityIndicator size="large" color={colors.appPrimaryColor} />
                  </View>
                )}
                {/* Image Slider Overlay */}
                {getAllImages().length > 1 && (
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={event => {
                      const index = Math.round(
                        event.nativeEvent.contentOffset.x /
                          Dimensions.get('window').width,
                      );
                      setCurrentImageIndex(index);
                    }}
                    style={styles.ImageSliderOverlay}
                    removeClippedSubviews={true}>
                    {getAllImages().map((image, index) => (
                      <View key={index} style={styles.ImageSlide} />
                    ))}
                  </ScrollView>
                )}

                <Spacer isTiny />
                {/* Header Buttons */}
                <Wrapper style={styles.HeaderConatiner}>
                  <TouchableOpacity
                    style={{
                      borderRadius: responsiveWidth(100),
                      borderWidth: 1,
                      borderColor: colors.appBorderColor2,
                      padding: responsiveWidth(2),
                      backgroundColor: colors.appBgColor1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: scale(48),
                      height: scale(48),
                    }}
                    onPress={goBack}>
                    <Text
                      style={{
                        fontSize: scale(20),
                        color: colors.appPrimaryColor,
                        fontWeight: 'bold',
                      }}>
                      ←
                    </Text>
                  </TouchableOpacity>

                  {visiterProfile ? (
                    <TouchableOpacity
                      style={{
                        borderRadius: responsiveWidth(100),
                        borderWidth: 1,
                        borderColor: colors.appBorderColor2,
                        padding: responsiveWidth(2),
                        backgroundColor: colors.appBgColor1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: scale(48),
                        height: scale(48),
                      }}
                      onPress={() => {
                        handleToggleAddToFavorite();
                      }}>
                      <HeartIcon
                        size={responsiveWidth(6)}
                        color={colors.appPrimaryColor}
                        filled={AddToFavorite}
                      />
                    </TouchableOpacity>
                  ) : null}
                </Wrapper>
              </ImageBackground>
            </TouchableOpacity>
          </ScrollViews.WithKeyboardAvoidingView>
          
          {/* Details Container */}
            <Wrapper style={styles.MainContainerOfShownDetail}>
              {/* Image Indicators - Top of white area */}
              {getAllImages().length > 1 && (
                <Wrapper style={styles.TopImageIndicators}>
                  {getAllImages().map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setCurrentImageIndex(index)}
                      style={[
                        styles.ImageIndicator,
                        {
                          backgroundColor:
                            index === currentImageIndex
                              ? colors.appPrimaryColor
                              : colors.appBorderColor2,
                        },
                      ]}
                    />
                  ))}
                </Wrapper>
              )}

              {/* Name and Profession */}
              <Wrapper
                marginHorizontalBase
                marginVerticalBase
                flexDirectionRow
                alignItemsCenter
                justifyContentSpaceBetween>
                <View style={{width: responsiveWidth(70)}}>
                  <Text isSmallTitle isBoldFont>
                    {user?.username}
                  </Text>
                  <Spacer isSmall />
                  <Text isRegular isRegularFont isTextColor2>
                    {user && me
                      ? (() => {
                          // Fallback to me (current user) if viewing own profile and user data is incomplete
                          const displayUser = (user.id === me.id && (!user.gender || !user.birthday)) ? me : user;
                          
                          return getUserDetail(
                            'gender',
                            displayUser,
                            me._settings?.currentLang || 'en',
                            t,
                          ) +
                          ', ' +
                          getUserDetail(
                            'birthday',
                            displayUser,
                            me._settings?.currentLang || 'en',
                            t,
                          );
                        })()
                      : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    borderRadius: responsiveWidth(100),
                    borderWidth: 1,
                    borderColor: colors.appBorderColor2,
                    padding: responsiveWidth(2),
                    backgroundColor: colors.appBgColor1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: scale(48),
                    height: scale(48),
                  }}
                  onPress={() => {
                    if (visiterProfile) {
                      // Message button - always navigate to chat
                      navigate(routes.chatScreen, { otherUserId: user?.id });
                    } else {
                      handleEditProfileModal();
                    }
                  }}>
                  {!visiterProfile ? (
                    <EditIcon
                      size={responsiveWidth(6)}
                      color={colors.appPrimaryColor}
                    />
                  ) : (
                    <MessageIcon
                      size={responsiveWidth(6)}
                      color={colors.appPrimaryColor}
                    />
                  )}
                </TouchableOpacity>
              </Wrapper>

              {/* Friendship Buttons - only show for visitor profile */}
              {visiterProfile && (
                <Wrapper
                  marginHorizontalBase
                  marginVerticalBase
                  flexDirectionRow
                  alignItemsCenter
                  justifyContentSpaceBetween>
                  <View style={{width: responsiveWidth(70)}}>
                    <Text isLarge isBoldFont>
                      {t('FRIENDSHIP')}
                    </Text>
                    <Spacer isSmall />
                    <Text isRegular isRegularFont isTextColor2>
                      {(() => {
                        if (!user || !me) {
                          return t('ADD_FRIEND');
                        }

                        const isFriend = me._friendsList?.includes(user.id);
                        const sentRequest = me._sentFriendRequests?.includes(
                          user.id,
                        );
                        const gotRequest = user._friendRequests?.includes(
                          me.id,
                        );

                        if (isFriend) return t('FRIENDS');
                        if (sentRequest) return t('REQUEST_SENT');
                        if (gotRequest) return t('ACCEPT_REQUEST');
                        return t('ADD_FRIEND');
                      })()}
                    </Text>
                  </View>

                  {/* Friend Request Button */}
                  <TouchableOpacity
                    style={{
                      borderRadius: responsiveWidth(100),
                      borderWidth: 1,
                      borderColor: colors.appBorderColor2,
                      padding: responsiveWidth(2),
                      backgroundColor: colors.appBgColor1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: scale(48),
                      height: scale(48),
                    }}
                    onPress={() => {
                      handleToggleAddToFriends();
                    }}>
                    {(() => {
                      if (!user || !me) {
                        return (
                          <AddFriendIcon
                            size={responsiveWidth(6)}
                            color={colors.appPrimaryColor}
                          />
                        );
                      }

                      const isFriend = me._friendsList?.includes(user.id);
                      const sentRequest = me._sentFriendRequests?.includes(
                        user.id,
                      );
                      const gotRequest = user._friendRequests?.includes(me.id);

                      if (isFriend) {
                        return (
                          <FriendsIcon
                            size={responsiveWidth(6)}
                            color={colors.appPrimaryColor}
                          />
                        );
                      } else if (sentRequest) {
                        return (
                          <RequestSentIcon
                            size={responsiveWidth(6)}
                            color={colors.appPrimaryColor}
                          />
                        );
                      } else if (gotRequest) {
                        return (
                          <AddFriendIcon
                            size={responsiveWidth(6)}
                            color={colors.appPrimaryColor}
                          />
                        );
                      } else {
                        return (
                          <AddFriendIcon
                            size={responsiveWidth(6)}
                            color={colors.appPrimaryColor}
                          />
                        );
                      }
                    })()}
                  </TouchableOpacity>
                </Wrapper>
              )}

              {/* Locaton  */}
              <Wrapper
                marginHorizontalBase
                marginVerticalBase
                flexDirectionRow
                alignItemsCenter
                justifyContentSpaceBetween>
                <View style={{width: responsiveWidth(70)}}>
                  <Text isLarge isBoldFont>
                    {t('LOCATION')}
                  </Text>
                  <Spacer isSmall />
                  <Text isRegular isRegularFont isTextColor2>
                    {user?.currentLocation?.city || t('UNKNOWN')}
                  </Text>
                </View>
                {/* Only show distance for other users, not for own profile */}
                {visiterProfile && (
                  <Wrapper
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      paddingHorizontal: responsiveWidth(2),
                      paddingVertical: responsiveWidth(3),
                      borderRadius: 150,
                      borderColor: colors.appBorderColor2,
                      marginRight: responsiveWidth(3),
                    }}>
                    <LocationIcon size={scale(14)} color={colors.appTextColor2} />
                    <Text
                      style={{
                        color: colors.appTextColor2,
                        fontSize: scale(12),
                        marginLeft: responsiveWidth(2),
                      }}>
                      {distance}
                    </Text>
                  </Wrapper>
                )}
              </Wrapper>
              
              {/* Private Gallery Section - Always visible */}
              <Fragment>
                <Spacer isDoubleBase />
                
                {/* Own Profile: Show Requests/Releases and Upload Button */}
                {me?.id === user?.id && (
                    <Fragment>
                  <PersonalInfoReperisentor
                    Tittle={t('PRIVATEGALLERY')}
                    Data={RequestAndRevokeData}
                  />
                  <Spacer isDoubleBase />
                      
                      {(!user?.privateAlbum || user?.privateAlbum?.length === 0) && (
                  <MessageWithActionButton
                    Message={t('NOPICTURES')}
                    ButtonTittle={t('UPLOADPICTURES')}
                          onPress={handleEditProfileModal}
                        />
                      )}
                    </Fragment>
                  )}
                  
                  {/* Visitor Profile: Show Gallery or Permission Info */}
                  {me?.id !== user?.id && (
                    <Fragment>
                      <Wrapper marginHorizontalBase>
                        <Text isMediumTitle>{t('PRIVATEGALLERY')}</Text>
                        <Spacer isBase />
                        
                        {/* Show upgrade card for non-VIP members (exclude admins and users with gallery access) */}
                        {![3, 5, 6].includes(me?.membership) && !me?.isAdmin && !canSeePrivateGallery && (
                          <Fragment>
                            <Wrapper 
                              backgroundColor={colors.appPrimaryColor}
                              style={{
                                borderRadius: 20,
                                paddingVertical: 24,
                                paddingHorizontal: 20,
                                marginBottom: 16,
                                shadowColor: colors.appPrimaryColor,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 5,
                              }}>
                              <Text isRegular style={{color: '#fff', lineHeight: 22}} textAlignCenter>
                                {me?.membership === 4 
                                  ? t('PHANTOMRIVATEGALLERYINFO') 
                                  : t('VIPRIVATEGALLERYINFO')}
                              </Text>
                              <Spacer isBase />
                              <Buttons.Colored
                                text={t('UPGRADE')}
                                onPress={handleUpgradeToVip}
                                buttonStyle={{
                                  backgroundColor: '#fff',
                                  borderRadius: 12,
                                }}
                                textStyle={{color: colors.appPrimaryColor}}
                              />
                            </Wrapper>
                            
                            <Wrapper flexDirectionRow alignItemsCenter style={{marginVertical: 20}}>
                              <Wrapper flex={1} height={1} backgroundColor={colors.appBorderColor2} style={{opacity: 0.5}} />
                              <Text isSmall isTextColor2 style={{marginHorizontal: 16, opacity: 0.7}}>
                                {t('OR')}
                              </Text>
                              <Wrapper flex={1} height={1} backgroundColor={colors.appBorderColor2} style={{opacity: 0.5}} />
                            </Wrapper>
                          </Fragment>
                        )}
                        
                        {/* Info text and request button - always visible if no access */}
                        {!canSeePrivateGallery && (
                          <Fragment>
                            <Wrapper 
                              backgroundColor={colors.appBgColor2}
                              style={{
                                borderRadius: 16,
                                paddingVertical: 16,
                                paddingHorizontal: 16,
                                marginBottom: 16,
                              }}>
                              <Text isRegular isTextColor2 textAlignCenter style={{lineHeight: 20}}>
                                {t('PRIVATEIMAGESNOPERMISSION')}
                              </Text>
                            </Wrapper>
                            
                            {hasRequestedAccess ? (
                              <Buttons.Colored
                                text={t('REVOKEREQUEST')}
                                onPress={handleRevokePrivateGalleryRequest}
                                buttonStyle={{
                                  backgroundColor: colors.appTextColor3,
                                  borderRadius: 12,
                                }}
                              />
                            ) : (
                              <Buttons.Colored
                                text={t('SENDREQUEST')}
                                onPress={handleSendPrivateGalleryRequest}
                                buttonStyle={{
                                  backgroundColor: colors.appPrimaryColor,
                                  borderRadius: 12,
                                }}
                              />
                            )}
                          </Fragment>
                        )}
                      </Wrapper>
                    </Fragment>
                  )}
                  
                  {/* Show private gallery images if user has permission */}
                  {canSeePrivateGallery && user && (
                    <Wrapper marginHorizontalBase marginTopBase>
                      {user.privateAlbum && Array.isArray(user.privateAlbum) && user.privateAlbum.length > 0 ? (
                        <Wrapper flexDirectionRow style={{flexWrap: 'wrap', gap: scale(8)}}>
                          {user.privateAlbum.map((picture, index) => {
                            // Use approval check for thumbnails too
                            const thumbnailSource = getApprovedPrivateImageSource(
                              picture, 
                              user.gender, 
                              me?.id, 
                              user?.id, 
                              me?.isAdmin,
                              canSeePrivateGallery
                            );
                            
                            // Calculate width for 3 columns: (screen width - margins - gaps) / 3
                            // marginHorizontalBase = responsiveWidth(5) * 2 = 10% total
                            // 2 gaps of scale(8) = scale(16) total
                            const screenWidth = Dimensions.get('window').width;
                            const horizontalMargins = responsiveWidth(10); // 5% on each side
                            const totalGaps = scale(16); // 2 gaps of scale(8)
                            const imageWidth = (screenWidth - horizontalMargins - totalGaps) / 3;
                            
                            return (
                              <TouchableOpacity
                                key={index}
                                onPress={() => {
                                  // Set the current private image index and show private images viewer
                                  setCurrentPrivateImageIndex(index);
                                  setShowPrivateImages(true);
                                }}
                                style={{
                                  width: imageWidth,
                                  aspectRatio: 3 / 4,
                                  borderRadius: scale(8),
                                  overflow: 'hidden',
                                }}>
                                <Image
                                  source={typeof thumbnailSource === 'string' ? {uri: thumbnailSource} : thumbnailSource}
                                  style={{width: '100%', height: '100%'}}
                                  resizeMode="cover"
                                />
                              </TouchableOpacity>
                            );
                          })}
                        </Wrapper>
                      ) : (
                        <Wrapper 
                          backgroundColor={colors.appBgColor2}
                          style={{
                            borderRadius: 16,
                            paddingVertical: 20,
                            paddingHorizontal: 16,
                          }}>
                          <Text isRegular isTextColor2 textAlignCenter style={{lineHeight: 20}}>
                            {t('NOPRIVATEGALLERYYET')}
                          </Text>
                        </Wrapper>
                      )}
                    </Wrapper>
                  )}
                </Fragment>
              
              <Spacer />
              <PersonalInfoReperisentor
                Tittle={t('ABOUTME_SINGLE_LINE')}
                Data={userAboutData}
              />
              <Spacer isDoubleBase />
              {(() => {
                if (!user?.languages || !Array.isArray(user.languages) || user.languages.length === 0) return null;
                
                const languageData = user.languages
                  .map(lang => {
                    // Handle both string and object formats
                    let langKey = '';
                    if (typeof lang === 'string') {
                      langKey = lang;
                    } else if (typeof lang === 'object' && lang !== null) {
                      langKey = lang.key || lang.value || lang.label || '';
                    }
                    
                    if (!langKey) return null;
                    
                    // Translate language name
                    return {
                      Label: String(t(langKey) || langKey),
                      Value: '' // Kein Level, nur Sprachname
                    };
                  })
                  .filter(Boolean); // Remove null entries
                
                if (languageData.length === 0) return null;
                
                return (
                  <Fragment>
                    <PersonalInfoReperisentor
                      Tittle={t('LANGUAGE')}
                      Data={languageData}
                    />
                    <Spacer isDoubleBase />
                  </Fragment>
                );
              })()}
              {user?.details?.moreinfo?.length > 0 && (
                <Fragment>
                  <PersonalInfoReperisentor
                    Tittle={t('INFOS')}
                    Data={userMoreInfoData}
                  />
                  <Spacer isDoubleBase />
                </Fragment>
              )}
              {user?.details?.lifestyle?.length > 0 && (
                <Fragment>
                  <PersonalInfoReperisentor
                    Tittle={t('LIFESTYLE')}
                    Data={userLifestyleData}
                  />
                  <Spacer isDoubleBase />
                </Fragment>
              )}
              {user?.details?.interests?.length > 0 && (
                <Fragment>
                  <PersonalInfoReperisentor
                    Tittle={t('INTERESTS')}
                    Data={userInterestsData}
                  />
                  <Spacer isDoubleBase />
                </Fragment>
              )}
              {user?.details?.brands?.length > 0 && (
                <Fragment>
                  <PersonalInfoReperisentor
                    Tittle={t('BRANDS')}
                    Data={userBrandsData}
                  />
                  <Spacer isDoubleBase />
                </Fragment>
              )}
            </Wrapper>
          <Modals.EditProfile
            visible={EditProfileModal}
            toggle={handleEditProfileModal}
          />

          {/* Full Image Modal */}
          {showFullImage && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'black',
                zIndex: 1000,
              }}>
              {/* Close Button */}
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 50,
                  right: 20,
                  zIndex: 1001,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => setShowFullImage(false)}>
                <Text
                  style={{
                    color: 'white',
                    fontSize: 20,
                    fontWeight: 'bold',
                  }}>
                  ✕
                </Text>
              </TouchableOpacity>

              {/* Image Slider */}
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={event => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x /
                      Dimensions.get('window').width,
                  );
                  setCurrentImageIndex(index);
                }}
                style={{
                  flex: 1,
                }}>
                {getAllImages().map((image, index) => (
                  <View
                    key={index}
                    style={{
                      width: Dimensions.get('window').width,
                      height: Dimensions.get('window').height,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    {image.uploading ? (
                      <Wrapper alignItemsCenter>
                        <ActivityIndicator
                          size="large"
                          color={colors.appPrimaryColor}
                        />
                        <Spacer height={responsiveHeight(2)} />
                        <Text isMedium alignTextCenter>
                          {t('UPLOADING_PUBLIC_PICTURES')}
                        </Text>
                        <Text isSmall isTextColor2 alignTextCenter>
                          {t('UPLOADING_PUBLIC_PICTURES_DESCRIPTION')}
                        </Text>
                      </Wrapper>
                    ) : (
                      <Image
                        source={{uri: image.uri}}
                        style={{
                          width: Dimensions.get('window').width,
                          height: Dimensions.get('window').height,
                          resizeMode: 'contain',
                        }}
                      />
                    )}
                  </View>
                ))}
              </ScrollView>

              {/* Image indicators */}
              {getAllImages().length > 1 && (
                <View
                  style={{
                    flexDirection: 'row',
                    position: 'absolute',
                    bottom: 50,
                    alignSelf: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 15,
                  }}>
                  {getAllImages().map((_, index) => (
                    <View
                      key={index}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor:
                          index === currentImageIndex
                            ? 'white'
                            : 'rgba(255,255,255,0.5)',
                        marginHorizontal: 4,
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Private Images Modal */}
          <Modal
            visible={showPrivateImages}
            transparent={false}
            animationType="fade"
            statusBarTranslucent={false}
            onRequestClose={() => setShowPrivateImages(false)}>
            <StatusBar barStyle="light-content" backgroundColor="black" />
            <View style={{flex: 1, backgroundColor: 'black'}}>
              {/* Header */}
              <View
                style={{
                  paddingTop: Platform.OS === 'ios' ? 60 : 20,
                  paddingHorizontal: 20,
                  paddingBottom: 15,
                  backgroundColor: 'black',
                  alignItems: 'flex-end',
                }}>
                <TouchableOpacity
                  onPress={() => {
                    console.log('Closing private images viewer');
                    setShowPrivateImages(false);
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text style={{color: 'white', fontSize: 30, fontWeight: '300'}}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Private Images ScrollView */}
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={event => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width,
                  );
                  setCurrentPrivateImageIndex(index);
                }}
                contentOffset={{x: currentPrivateImageIndex * Dimensions.get('window').width, y: 0}}
                style={{flex: 1}}>
                {getPrivateImages.map((image, index) => {
                  return (
                    <View
                      key={index}
                      style={{
                        width: Dimensions.get('window').width,
                        height: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'black',
                      }}>
                      {(image.uri || image.source) ? (
                        <Image
                          source={image.uri ? {uri: image.uri} : image.source}
                          style={{
                            width: Dimensions.get('window').width,
                            height: '100%',
                          }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={{color: 'white'}}>{t('IMAGE_NOT_AVAILABLE')}</Text>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              {/* Private Image indicators */}
              {getPrivateImages.length > 1 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    backgroundColor: 'black',
                    paddingHorizontal: 10,
                    paddingVertical: 15,
                    paddingBottom: Platform.OS === 'ios' ? 40 : 15,
                  }}>
                  {getPrivateImages.map((_, index) => (
                    <View
                      key={index}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor:
                          index === currentPrivateImageIndex
                            ? 'white'
                            : 'rgba(255,255,255,0.5)',
                        marginHorizontal: 4,
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          </Modal>
        </Wrapper>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  ProfileShownMainContainer: {
    height: responsiveHeight(62),
    resizeMode: 'stretch',
    overflow: 'hidden',
  },
  ProfileImageStyle: {
    // Hero look: full width cover with top focus (no top crop)
    resizeMode: 'cover',
    top: 0,
  },
  ImageSliderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ImageSlide: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  TopImageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: responsiveWidth(1.5),
    paddingTop: responsiveHeight(1),
    paddingBottom: responsiveHeight(0.5),
  },
  ImageIndicator: {
    width: responsiveWidth(2.5),
    height: responsiveWidth(2.5),
    borderRadius: responsiveWidth(50),
  },
  HeaderConatiner: {
    marginHorizontal: sizes.baseMargin,
    marginTop: sizes.statusBarHeight,
    //paddingVertical: sizes.baseMargin,
    // backgroundColor: 'red',
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',
  },
  MainContainerOfShownDetail: {
    flex: 1,
    top: -responsiveHeight(7),
    backgroundColor: colors.appBgColor1,
    //backgroundColor: 'blue',
    borderRadius: responsiveWidth(8),
  },
});

const MessageWithActionButton = React.memo(
  ({Message, ButtonTittle, onPress}) => {
    return (
      <Wrapper
        paddingVerticalSmall
        //paddingHorizontalSmall
        marginHorizontalBase
        backgroundColor={'#FFDDDE'}
        style={{borderRadius: responsiveWidth(5)}}>
        <Text
          alignTextCenter
          isPrimaryColor
          isRegularFont
          style={{fontSize: responsiveFontSize(13)}}>
          {Message}
        </Text>
        <Spacer />
        <Buttons.Colored text={ButtonTittle} onPress={onPress} />
      </Wrapper>
    );
  },
);

const PersonalInfoReperisentor = React.memo(({Tittle, Data}) => {
  if (!Data || !Array.isArray(Data) || Data.length === 0) return null;
  
  return (
    <Wrapper marginHorizontalBase>
      {/* Tittle */}
      <Text isBoldFont isLarge>
        {Tittle}
      </Text>
      <Spacer isBasic />
      <Wrapper
        flexDirectionRow
        style={{
          flexWrap: 'wrap',
          gap: scale(8),
        }}>
        {Data.filter(item => item && item.Label).map((item, index) => {
            // Force line break before chest to keep chest, waist, hips together
            const isChest = ['chest', 'Brust', 'Busen'].some(
              keyword => item?.Label?.toLowerCase().includes(keyword.toLowerCase())
            );
            
            return (
              <Fragment key={index}>
                {isChest && <View style={{ width: '100%', height: 0 }} />}
                <Pressable onPress={item?.onPress}>
                  <Wrapper
                    flexDirectionRow
                    alignItemsCenter
                    style={{
                  borderWidth: item?.isHighlighted ? 2 : 1,
                  borderRadius: 150,
                  borderColor: item?.isHighlighted ? colors.appPrimaryColor : colors.appBorderColor2,
                  backgroundColor: item?.isHighlighted ? `${colors.appPrimaryColor}15` : 'transparent',
                  paddingHorizontal: scale(6),
                  paddingVertical: scale(4),
                  maxWidth: '100%',
                  shadowColor: item?.isHighlighted ? colors.appPrimaryColor : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: item?.isHighlighted ? 0.3 : 0,
                  shadowRadius: 4,
                  elevation: item?.isHighlighted ? 3 : 0,
                }}>
                <Text
                  isRegularFont
                  isTextColor2
                  numberOfLines={2}
                  style={{flexShrink: 1, fontWeight: item?.isHighlighted ? 'bold' : 'normal', fontSize: scale(11)}}>
                  {String(item?.Label || '')}
                </Text>
                {(item?.Value !== undefined && item?.Value !== null && String(item?.Value).trim() !== '') && (
                  <>
                    <Wrapper style={{ marginHorizontal: scale(4) }}>
                      <Lines.Horizontal
                        width={1}
                        height={responsiveHeight(1.5)}
                        color={item?.isHighlighted ? colors.appPrimaryColor : colors.appBorderColor2}
                      />
                    </Wrapper>
                    <Text
                      isRegularFont
                      isPrimaryColor
                      numberOfLines={2}
                      style={{flexShrink: 1, fontWeight: item?.isHighlighted ? 'bold' : 'normal', fontSize: scale(11)}}>
                      {String(item?.Value)}
                    </Text>
                  </>
                )}
              </Wrapper>
            </Pressable>
              </Fragment>
            );
          })}
      </Wrapper>
    </Wrapper>
  );
});
