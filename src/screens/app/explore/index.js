import React, { useEffect, useState, useRef, memo, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Wrapper,
  Text,
  Headers,
  Spacer,
  Icons,
  Modals,
  Buttons,
  StatusBars,
} from '../../../components';
import { useHooks } from './hooks';
import { ActivityIndicator, ImageBackground, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import {
  api,
  appIcons,
  appStyles,
  colors,
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
  sizes,
} from '../../../services';
import { scale } from 'react-native-size-matters';
import MapView, { Marker } from 'react-native-maps';
import { MapStyling } from '../../../services/utilities/assets/mapStyling';
import { useDispatch, useSelector } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import { setUser } from '../../../store/actions';
import { Round } from '../../../components/images';
import { PlusSvgIcon, MinusSvgIcon } from '../../../components/icons/ProfileIcons';
import { getUsersByDistance, calculateDistance } from '../../../services/firebaseUtilities/map';
import { Membership, STATUS_ACTIVE } from '../../../constants/User';
import { navigate } from '../../../navigation/rootNavigation';
import { routes } from '../../../services';
import { useTranslation } from 'react-i18next';

export default function Index() {
  const { t } = useTranslation();
  const { TopRightButtonsData, SearchModal, HandleSearchModal } = useHooks();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false); // Start with false, will be set to true when loading starts
  const [currentZoom, setCurrentZoom] = useState(0.0922); // Zoom level state
  const [mapRegion, setMapRegion] = useState(null); // Stable map region
  const [showInfoText, setShowInfoText] = useState(false); // State for info text visibility
  const [selectedLocation, setSelectedLocation] = useState(null); // Temporary location before applying
  const user = useSelector((state) => state.auth.user);
  const mapRef = useRef(null);
  const dispatch = useDispatch();
  const isLoadingRef = useRef(false); // Prevent multiple simultaneous loads
  
  // Aktualisiere den Location-Button mit der korrekten Funktion
  const updatedTopRightButtonsData = TopRightButtonsData.map(button => {
    if (button.IconName === appIcons.Location) {
      return { ...button, onPress: handleSearch };
    }
    return button;
  });

  // Helper function to calculate age from birthday
  const getAge = (birthday) => {
    if (!birthday) return 0;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const loadUsers = async () => {
    if (!user) return;
    
    // Prevent multiple parallel loadUsers calls
    if (isLoadingRef.current) {
      console.log('loadUsers already in progress, skipping...');
      return;
    }
    
    isLoadingRef.current = true;
    
    console.log('Loading users...');
    console.log('User location type:', user?.location?.type);
    console.log('User location:', user?.location);
    
    // Don't show loading overlay - just load in background
    // setLoading(true);
    
    try {
      // Build query filters based on the old project logic
      const queryFilter = [
        {
          key: '_settings.showInDiscover',
          opr: '==',
          value: true
        }
      ];

      // Add gender filter if user has specific preferences
      if (user.genderLookingFor && user.genderLookingFor.length < 3) {
        queryFilter.push({
          key: 'gender',
          opr: 'in',
          value: user.genderLookingFor
        });
      }

      // Get users by distance (5km radius for better performance on Android)
      // Always use currentLocation (like old project)
      const baseLocation = user?.currentLocation;
      console.log('Using base location:', baseLocation);
      
      const usersByDistance = await getUsersByDistance(
        baseLocation,
        5, // 5km radius for faster loading
        queryFilter,
        null, // no custom order
        50 // Limit to 50 users for performance
      );

      console.log('Users found by distance:', usersByDistance.length);

      // Filter users based on the old project logic
      const filteredUsers = usersByDistance.filter((u) => {
        const age = getAge(u.birthday);
        const fakeAge = u.fakeAge || age;
        
        return (
          u.genderLookingFor?.includes(user.gender) &&
          u.status === STATUS_ACTIVE &&
          u.id !== user.id &&
          !([Membership.Silver, Membership.Phantom, Membership.Celebrity].includes(u.membership))
        );
      });

      // Sort by distance from the active baseLocation
      const activeBase = user?.currentLocation;
      const sortedUsers = filteredUsers.sort((a, b) => {
        const aDistance = calculateDistance(
          activeBase.lat,
          activeBase.lng,
          a.currentLocation.lat,
          a.currentLocation.lng
        );
        const bDistance = calculateDistance(
          activeBase.lat,
          activeBase.lng,
          b.currentLocation.lat,
          b.currentLocation.lng
        );
        return aDistance - bDistance;
      });

      setUsers(sortedUsers);
      console.log('Final filtered users count:', sortedUsers.length);
      
      // Map region is now handled by useEffect, no need to update it here
    } catch (error) {
      console.error('Error loading users for map:', error);
      setUsers([]);
    } finally {
      // setLoading(false); // Don't set loading to false - we're loading in background
      isLoadingRef.current = false;
    }
  };

  const showProfile = (userToShow) => {
    if (!userToShow || !userToShow.id) return;
    
    navigate({ name: routes.userProfile, params: { 
      userId: userToShow.id, 
      visiterProfile: true 
    }});
  };

  // Memoize rendered markers to avoid re-renders
  const userMarkers = useMemo(() => {
    return users.filter(u => u.id !== user.id).slice(0, 30).map((u, index) => (
      <Marker
        key={u.id || index}
        coordinate={{
          latitude: u.currentLocation.lat,
          longitude: u.currentLocation.lng,
        }}
        onPress={() => showProfile(u)}
        zIndex={1}>
        <Round 
          source={{
            uri: u.profilePictures?.thumbnails?.small || 
                 u.profilePictures?.original || 
                 'https://via.placeholder.com/60'
          }} 
          size={scale(44)} 
        />
      </Marker>
    ));
  }, [users, user.id]);

  const handleSearch = () => {
    console.log('handleSearch called!');
    // Prüfe Mitgliedschaftsregel wie im alten Projekt
    if ([Membership.Standard, Membership.Silver].includes(user.membership) && !user.isAdmin) {
      Alert.alert(
        t('FEATURENOTAVAILABLE'),
        t('FEATURENOTAVAILABLE'),
        [
          {
            text: t('UPGRADE'),
            onPress: () => navigate({ name: routes.subscription })
          },
          {
            text: t('CANCEL'),
            style: 'cancel'
          }
        ]
      );
      return;
    }
    
    console.log('Opening search modal...');
    HandleSearchModal();
  };

  // Hide info text when user clicks on settings
  const hideInfoText = async () => {
    try {
      await AsyncStorage.setItem('hasSeenAroundMeInfo', 'true');
      setShowInfoText(false);
    } catch (error) {
      console.error('Error hiding info text:', error);
    }
  };

  const zoomBy = async (delta) => {
    try {
      if (!mapRef.current) {
        return;
      }
      
      // Verwende animateToRegion mit aktueller Position und dynamischen Deltas
      const currentLocation = user?.currentLocation;
      
      const factor = delta > 0 ? 0.7 : 1.4; // Größere Schritte für sichtbare Änderung
      const newLatitudeDelta = Math.max(0.001, Math.min(1, currentZoom * factor));
      const newLongitudeDelta = Math.max(0.001, Math.min(1, currentZoom * factor));
      
      // Update state
      setCurrentZoom(newLatitudeDelta);
      
      mapRef.current.animateToRegion({
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        latitudeDelta: newLatitudeDelta,
        longitudeDelta: newLongitudeDelta,
      }, 300);
      
    } catch (e) {
      console.error('Zoom error:', e);
    }
  };

  const useMyLocation = async () => {
    try {
      if (!user?.id) return;
      await firestore().collection('Users').doc(user.id).update({
        location: {
          type: 'currentLocation',
          currentLocation: user.currentLocation,
        },
      });
      dispatch(setUser({ user: { ...user, location: { type: 'currentLocation', currentLocation: user.currentLocation } }, dataLoaded: true }));
      await loadUsers();
      // Optionally recenter map
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: user.currentLocation.lat,
          longitude: user.currentLocation.lng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }, 250);
      }
    } catch (e) {
      console.error('useMyLocation failed', e);
    }
  };

  // Check if info text should be shown (only first time and when not active)
  useEffect(() => {
    const checkInfoTextVisibility = async () => {
      if (!user?.id) return;
      
      try {
        const hasSeenInfo = await AsyncStorage.getItem('hasSeenAroundMeInfo');
        // Only show if: user hasn't seen it before AND showInDiscover is false
        if (!hasSeenInfo && user?._settings?.showInDiscover === false) {
          setShowInfoText(true);
        } else {
          setShowInfoText(false);
        }
      } catch (error) {
        console.error('Error checking info text visibility:', error);
        setShowInfoText(false);
      }
    };
    
    checkInfoTextVisibility();
  }, [user?.id, user?._settings?.showInDiscover]);

  // Handle user and location changes with debouncing
  useEffect(() => {
    if (!user?.id || !user.currentLocation) return;
    
    console.log('User or location changed, processing...');
    console.log('User currentLocation:', user?.currentLocation);
    console.log('User location:', user?.location);
    console.log('Location type:', user?.location?.type);
    
    const currentLocation = user?.currentLocation;
    const newRegion = {
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    
    console.log('Updating map region to:', newRegion);
    setMapRegion(newRegion);
    
    // Animate to new location if map ref is available
    if (mapRef.current) {
      console.log('Animating map to new location:', currentLocation);
      mapRef.current.animateToRegion(newRegion, 500);
    }
    
    // Check if user can access discover feature and load users
    if (![Membership.Standard, Membership.Silver].includes(user.membership) || user.isAdmin) {
      console.log('Loading users for location...');
      // Load users asynchronously without blocking UI
      setTimeout(() => {
        loadUsers();
      }, 0);
    }
  }, [
    user?.id,
    user?.currentLocation?.lat, 
    user?.currentLocation?.lng
  ]);

  if (!user) {
    console.log('No user found, showing loading...');
    return (
      <Wrapper flex={1} isCenter backgroundColor={colors.appBGColor}>
        <ActivityIndicator size={"large"} color={colors.primaryColor} />
      </Wrapper>
    )
  }

  // Check if user can access discover feature
  const canAccessDiscover = ![Membership.Standard, Membership.Silver].includes(user.membership) || user.isAdmin;
  console.log('User membership:', user.membership);
  console.log('Can access discover:', canAccessDiscover);
  console.log('Map region state:', mapRegion);

  if (!canAccessDiscover) {
    return (
      <Wrapper flex={1} backgroundColor={colors.appBgColor1}>
        <Headers.Common
          MainBackgroundColor={colors.transparent}
          Title={'Around Me'}
        />
        <Wrapper flex={1} isCenter>
          <Wrapper 
            marginHorizontalBase 
            backgroundColor={colors.appBgColor1}
            borderRadius={responsiveWidth(4)}
            paddingVertical={responsiveHeight(4)}
            paddingHorizontal={responsiveWidth(6)}
            style={{ 
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
              maxWidth: responsiveWidth(85),
            }}
          >
            <Icons.Custom 
              icon={appIcons.UpgradeIcon || appIcons.ProfileSetting} 
              size={responsiveWidth(25)} 
              color={colors.primaryColor}
            />
            <Spacer height={responsiveHeight(2)} />
            <Text 
              alignTextCenter 
              isBoldFont 
              style={{ 
                fontSize: responsiveFontSize(20),
                color: colors.textColor1,
                marginBottom: responsiveHeight(1)
              }}
            >
              {t('PREMIUM_FEATURE')}
            </Text>
            <Spacer height={responsiveHeight(1)} />
            <Text 
              alignTextCenter 
              isRegularFont 
              style={{ 
                fontSize: responsiveFontSize(14),
                color: colors.textColor2,
                lineHeight: responsiveFontSize(20),
                paddingHorizontal: responsiveWidth(2)
              }}
            >
              {t('DISCOVER_PREMIUM_DESCRIPTION')}
            </Text>
            <Spacer height={responsiveHeight(3)} />
            <Buttons.Colored
              text={t('UPGRADE_NOW')}
              onPress={() => navigate({ name: routes.subscription })}
              buttonStyle={{
                paddingHorizontal: responsiveWidth(8),
                paddingVertical: responsiveHeight(1.5),
                borderRadius: responsiveWidth(3),
                minWidth: responsiveWidth(60)
              }}
              textStyle={{
                fontSize: responsiveFontSize(16),
                fontWeight: '600'
              }}
            />
          </Wrapper>
        </Wrapper>
      </Wrapper>
    )
  }

  // Show loading indicator over the map instead of blocking the entire component
  const LoadingOverlay = loading ? (
    <Wrapper 
      isAbsolute 
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}>
      <ActivityIndicator size={"large"} color={colors.primaryColor} />
    </Wrapper>
  ) : null;

  return (
      <Wrapper
      //flex={1}
      backgroundColor={colors.transparent}
      style={StyleSheet.absoluteFillObject}>
        {console.log('Rendering MapView...')}
        <MapView
        style={{ flex: 1, overflow: 'visible' }}
        //style={StyleSheet.absoluteFillObject}
        customMapStyle={MapStyling}
        ref={mapRef}
        region={(() => {
          // Default to Berlin if no coordinates available
          const defaultRegion = {
            latitude: 52.5200,
            longitude: 13.4050,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          
          const fallbackRegion = {
            latitude: user?.currentLocation?.lat || 52.5200, 
            longitude: user?.currentLocation?.lng || 13.4050, 
            latitudeDelta: 0.0922, // Zoom level for latitude
            longitudeDelta: 0.0421, // Zoom level for longitude
          };
          
          const finalRegion = mapRegion || fallbackRegion;
          console.log('Map region:', finalRegion);
          
          // Validate coordinates
          if (!finalRegion.latitude || !finalRegion.longitude || 
              isNaN(finalRegion.latitude) || isNaN(finalRegion.longitude)) {
            console.log('Invalid coordinates, using default region');
            return defaultRegion;
          }
          
          return finalRegion;
        })()}>
        {/* Other users markers - memoized for performance */}
        {userMarkers}
        {/* Own marker - render last with higher zIndex to stay on top */}
        <Marker
          coordinate={{
            latitude: user?.currentLocation?.lat || 52.5200,
            longitude: user?.currentLocation?.lng || 13.4050,
          }}
          zIndex={999}
          style={[
            {
              flex: 1,
            },
          ]}>
          <Icons.Custom icon={appIcons.LocationLogo} size={scale(150)} />
        </Marker>
      </MapView>
      <Wrapper isAbsolute flex={1} style={{ width: '100%' }}>
        <Wrapper
          paddingVerticalSmall
          style={[
            appStyles.headerStyle,
            {
              backgroundColor: colors.transparent,
              borderBottomWidth: 0,
              marginTop: sizes.statusBarHeight,
              width: '100%',
            }
          ]}>
          <StatusBars.Dark />
          <Wrapper
            flexDirectionRow
            alignItemsCenter
            marginHorizontalBase
            style={{ width: '100%' }}>
            <Text isSmallTitle style={{ color: colors.appPrimaryColor, marginTop: responsiveHeight(0.5) + 20 }}>
              {t('AROUNDME')}
            </Text>
          </Wrapper>
        </Wrapper>
        
        {/* Absolut positionierter Button */}
        <Wrapper
          isAbsolute
          style={{
            top: sizes.statusBarHeight + responsiveHeight(1) + 20,
            right: responsiveWidth(4),
            zIndex: 9999,
            elevation: 9999, // Für Android
          }}>
          {updatedTopRightButtonsData.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                console.log('Button pressed!', item);
                console.log('Calling handleSearch directly...');
                handleSearch();
              }}
              style={{
                backgroundColor: colors.appBgColor1,
                borderRadius: responsiveWidth(100),
                padding: responsiveWidth(2.5),
                borderWidth: 1,
                borderColor: colors.appBorderColor2,
                zIndex: 9999,
                elevation: 9999,
              }}>
              <Icons.Custom
                icon={item?.IconName}
                size={responsiveWidth(6)}
                color={colors.appTextColor1}
              />
            </TouchableOpacity>
          ))}
        </Wrapper>
        <Spacer isBasic />
        {/* Info message only when discover setting is disabled and first time */}
        {user?._settings?.showInDiscover === false && (
          <Wrapper style={{
            marginHorizontal: sizes.baseMargin,
            width: responsiveWidth(90),
            borderRadius: responsiveWidth(5),
            padding: scale(16),
            backgroundColor: colors.appBgColor1,
            justifyContent: 'center',
          }}>
            <Text
              isMediumFont
              alignTextCenter
              style={{
                fontSize: responsiveFontSize(13),
                color: colors.appTextColor1,
                backgroundColor: colors.appBgColor1,
                borderRadius: responsiveWidth(3),
                padding: scale(10),
                marginBottom: scale(10),
              }}>
              {t('SHOWINDISCOVERINFO')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                hideInfoText();
                navigate({ name: routes.appSetting });
              }}
              activeOpacity={0.8}
              style={{
                backgroundColor: colors.appPrimaryColor,
                borderRadius: responsiveWidth(3),
                padding: scale(12),
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                isMediumFont
                style={{
                  fontSize: responsiveFontSize(14),
                  color: 'white',
                  fontWeight: 'bold',
                }}>
                {t('GO_TO_SETTINGS')}
              </Text>
            </TouchableOpacity>
          </Wrapper>
        )}
      </Wrapper>
      <Wrapper
        isAbsolute
        style={{ right: 10, bottom: scale(150), ...appStyles.shadowExtraDark }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => zoomBy(1)}
          style={{
            backgroundColor: colors.appBgColor1,
            borderRadius: responsiveWidth(100),
            padding: scale(10),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlusSvgIcon size={scale(24)} color={colors.appTextColor1} />
        </TouchableOpacity>
      </Wrapper>
      <Wrapper
        isAbsolute
        style={{ right: 10, bottom: scale(100), ...appStyles.shadowExtraDark }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => zoomBy(-1)}
          style={{
            backgroundColor: colors.appBgColor1,
            borderRadius: responsiveWidth(100),
            padding: scale(10),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MinusSvgIcon size={scale(24)} color={colors.appTextColor1} />
        </TouchableOpacity>
      </Wrapper>

      <Modals.PlacesAutocomplete
        visible={SearchModal}
        toggle={() => {
          setSelectedLocation(null);
          HandleSearchModal();
        }}
        OnMapPage
        onPress={(data, details, locationData) => {
          if (locationData) {
            console.log('Location selected (temporary):', locationData);
            // Store temporarily, don't apply yet
            setSelectedLocation(locationData);
          }
        }}
        selectedLocation={selectedLocation}
        onApply={async () => {
          if (selectedLocation) {
            console.log('Applying location:', selectedLocation);
            
            try {
              // Update user in Firestore - store in currentLocation (like old project)
              await firestore().collection('Users').doc(user.id).update({
                currentLocation: selectedLocation,
                location: { type: 'customLocation' }
              });
              
              // Update Redux state
              dispatch(setUser({ 
                user: { 
                  ...user, 
                  currentLocation: selectedLocation,
                  location: { type: 'customLocation' }
                }, 
                dataLoaded: true 
              }));
              
              console.log('User location updated:', selectedLocation.city);
              
              // Close modal - useEffect will handle loadUsers automatically
              setSelectedLocation(null);
              HandleSearchModal();
            } catch (error) {
              console.error('Error updating user location:', error);
            }
          }
        }}
      />
      {LoadingOverlay}
    </Wrapper>
  );
}
const styles = StyleSheet.create({
  m: {
    overflow: 'visible',
  },
});
