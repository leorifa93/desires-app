import React, { Component, useEffect, useState, useCallback, useRef } from 'react';
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  RefreshControl,
  Platform,
} from 'react-native';
import {
  Wrapper,
  Text,
  Images,
  Spacer,
  Icons,
  Buttons,
  ScrollViews,
  HeaderHome,
  Headers,
  Cards,
  Modals,
  Labels,
  TextInputs,
  Sliders,
} from '../../../components';
import { useHooks } from './hooks';
import {
  api,
  appIcons,
  appImages,
  calcDistance,
  colors,
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
  getApprovedImageSource,
  routes,
  sizes,
  fontSizes,
} from '../../../services';
import { Card, Icon } from '@rneui/base';
import { scale, verticalScale } from 'react-native-size-matters';
import { navigate } from '../../../navigation/rootNavigation';
import { getDocuments } from '../../../services/firebaseUtilities';
import { getCurrentUser, getUsersByDistance, getStandardUsers } from '../../../services/firebaseUtilities/user';
import { useSelector, useDispatch } from 'react-redux';
import MapView, { Marker } from 'react-native-maps';
import { Membership, STATUS_ACTIVE, Gender } from '../../../constants/User';
import { Alert } from 'react-native';
import { Modals as CustomModals } from '../../../components';
import { useTranslation } from 'react-i18next';
import firestore from '@react-native-firebase/firestore';
import { setUser } from '../../../store/actions/auth';
import { serializeFirestoreData } from '../../../utils/serializeFirestoreData';
import { geohashForLocation } from 'geofire-common';
import Geolocation from '@react-native-community/geolocation';
import locationService from '../../../services/locationService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const { height, width } = Dimensions.get('window');

// Helper function to detect if device is a tablet
const isTablet = () => {
  const aspectRatio = height / width;
  return (
    (Platform.OS === 'ios' && Platform.isPad) ||
    (Platform.OS === 'android' && width >= 600) ||
    (aspectRatio < 1.6 && width >= 600)
  );
};

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

// Helper function to get city name from coordinates using reverse geocoding
const getCityFromCoordinates = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyBxdsntNvOw3i8qUwDC_rqpEDOMvlQJgIQ&language=en`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const addressComponents = result.address_components;
      
      // Try multiple approaches to get a good city name
      let city = '';
      let state = '';
      let country = '';
      
      for (const component of addressComponents) {
        if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('administrative_area_level_2')) {
          city = city || component.long_name; // Use district if no locality
        } else if (component.types.includes('sublocality')) {
          city = city || component.long_name; // Use sublocality if no locality
        } else if (component.types.includes('administrative_area_level_1')) {
          state = component.long_name;
        } else if (component.types.includes('country')) {
          country = component.long_name;
        }
      }
      
      // Return the best available combination
      if (city && state) {
        return `${city}, ${state}`;
      } else if (city) {
        return city;
      } else if (state) {
        return state;
      } else {
        // Extract city name from formatted address
        const parts = result.formatted_address.split(',');
        const firstPart = parts[0]?.trim();
        if (firstPart && firstPart.length > 0) {
          return firstPart;
        }
        return result.formatted_address;
      }
    }
    
    // If no results, try a different approach
    console.log('No geocoding results, trying alternative approach');
    return `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
  }
};

export default function Home() {
  const insets = useSafeAreaInsets();
  const {
    renderEmptyList,
    HomeTopRightButtonsData,
    FilterModal,
    FilterModalToggle,
    CardsData,
  } = useHooks();
  const [cardShown, setCardShown] = useState(1);
  const [dataShown, setDataShown] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const me = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const [filterLocation, setFilterLocation] = useState({
    city: '',
    lat: 0,
    lng: 0,
  });
  const [showPlacesModal, setShowPlacesModal] = useState(false);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [showLocationField, setShowLocationField] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [filteredUserIds, setFilteredUserIds] = useState([]);
  const [sortedUsers, setSortedUsers] = useState([]); // Store sorted users array
  const isApplyingFilter = useRef(false); // Track if filter is being applied
  const [filter, setFilter] = useState({
    perimeterValue: 100,
    ageRange: {
      lower: 18,
      upper: 80
    },
    categoryFilter: []
  });
  const destroyAllSnapshots = () => {
    snapshots.forEach(snapshot => snapshot());
    setSnapshots([]);
  };

  // Tracking permission is now requested in App.js immediately when user logs in

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []);

  // Update filterLocation when user location changes
  useEffect(() => {
    if (me && !isApplyingFilter.current) {
      const updateLocation = async () => {
        // Always use currentLocation (like old project)
        // The type is stored separately in location.type
        if (me?.currentLocation?.lat && me?.currentLocation?.lng) {
          setFilterLocation({
            city: me.currentLocation.city || 'Current Location',
            lat: me.currentLocation.lat,
            lng: me.currentLocation.lng,
            hash: me.currentLocation.hash || geohashForLocation([me.currentLocation.lat, me.currentLocation.lng])
          });
        }
      };
      
      updateLocation();
    }
  }, [me?.location, me?.currentLocation]);

  // Load users from sorted array in batches (new approach)
  const loadUsersFromArray = (sortedUsersArray, startIndex, batchSize) => {
    const batchUsers = sortedUsersArray.slice(startIndex, startIndex + batchSize);
    console.log('Loading batch from array:', { startIndex, batchSize, batchUsers: batchUsers.length });
    
    if (batchUsers.length === 0) {
      setLoading(false);
      return;
    }
    
    // Add users to dataShown
    setDataShown(prev => {
      const existingIds = prev.map(u => u.id);
      const newUsers = batchUsers.filter(u => !existingIds.includes(u.id));
      return [...prev, ...newUsers];
    });
    
    setLoading(false);
  };

  // Load users in batches (pagination) - OLD APPROACH
  const loadUsersBatch = (userIds, startIndex, batchSize) => {
    const batchIds = userIds.slice(startIndex, startIndex + batchSize);
    console.log('loadUsersBatch called with:', { userIds: userIds.length, startIndex, batchSize, batchIds: batchIds.length });
    
    if (batchIds.length === 0) {
      console.log('No batch IDs, stopping loading');
      setLoading(false);
      return;
    }

    console.log('Creating query filter with batch IDs:', batchIds);
    const filters = queryFilter.concat({
      key: 'id',
      opr: 'in',
      value: batchIds
    });
    console.log('Final filters:', filters);

    // Use getStandardUsers with id filter (like old project)
    const snapshot = getStandardUsers(
      batchSize,
      filters,
      true, // isOnSnapshot
      (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setDataShown(prev => {
          const existingIds = prev.map(u => u.id);
          const newUsers = users.filter(u => !existingIds.includes(u.id));
          // Preserve server-side order by appending new users as delivered
          const allUsers = [...prev, ...newUsers];
          return allUsers.filter((user) => 
            user.genderLookingFor.includes(me?.gender) && 
            me?.genderLookingFor?.includes(user.gender)
          );
        });
        
        setLoading(false);
      }
    );
    
    // Handle error case
    if (!snapshot) {
        console.error('Failed to create snapshot');
        setLoading(false);
        return;
    }
    
    setSnapshots(prev => [...prev, snapshot]);
  };

  const getUsers = async (isLoadMore = false) => {
    try {
      console.log('getUsers called, isLoadMore:', isLoadMore);
      setLoading(true);
      const user = await getCurrentUser();
      const currentUser = me || user;
      console.log('Current user:', currentUser?.id);
      
      if (!isLoadMore) {
        setDataShown([]);
        setLastDoc(null);
        setHasMore(true);
        setSortedUsers([]); // Reset sorted users array
        destroyAllSnapshots();
      }
      
      if (!currentUser) {
        // For non-logged in users, show basic users
        const queryFilter = [{
          key: 'gender',
          opr: 'in',
          value: [Gender.Female, Gender.Transsexual]
        }];
        
        const users = await getDocuments({
          collection: 'Users',
          filters: queryFilter,
          limit: 20,
          orderBy: [
            { key: 'membership', descending: true }, 
            { key: 'lastBoostAt', descending: true }
          ]
        });
        
        setDataShown(users);
        setLoading(false);
        return;
      }
      
      // Build query filters like in the old app
      const queryFilter = [];
      
      if (filter.categoryFilter && filter.categoryFilter.length > 0) {
        queryFilter.push({
          key: 'categories',
          opr: 'array-contains-any',
          value: filter.categoryFilter.filter(val => typeof (val) !== 'undefined')
        });
      }
      
      // Always use currentLocation (like old project)
      const searchLocation = filterLocation.lat && filterLocation.lng ? filterLocation : currentUser.currentLocation;
      const usersByDistance = await getUsersByDistance(
        searchLocation,
        filter.perimeterValue ? filter.perimeterValue : 100,
        queryFilter
      );
      
      const filteredUsers = [];
      
      for (let user of usersByDistance) {
        let age = getAge(user.birthday);
        if (((filter.ageRange && !user.fakeAge
          ? filter.ageRange.lower <= age && filter.ageRange.upper >= age
          : filter.ageRange.lower <= user.fakeAge && filter.ageRange.upper >= user.fakeAge) || !filter.ageRange)
          && user.genderLookingFor?.includes(currentUser.gender) && user.status === STATUS_ACTIVE 
          && !currentUser._gotBlockedFrom?.includes(user.id) && !currentUser._blockList?.includes(user.id)
          && user.id !== currentUser.id && currentUser.genderLookingFor?.includes(user.gender) 
          && ![Membership.Silver, Membership.Phantom, Membership.Celebrity].includes(user.membership)) {
          filteredUsers.push(user);
        }
      }
      
      console.log('Filtered users:', filteredUsers.length);
      
      if (filteredUsers.length > 0) {
        // Sort all users by membership and lastBoostAt (like old project)
        const sortedUsersArray = filteredUsers.sort((a, b) => {
          // First sort by membership (higher membership first)
          if (a.membership !== b.membership) {
            return (b.membership || 0) - (a.membership || 0);
          }
          // Then sort by lastBoostAt (more recent first)
          return (b.lastBoostAt || 0) - (a.lastBoostAt || 0);
        });
        
      console.log('Sorted users array created:', sortedUsersArray.length, 'users');
      setSortedUsers(sortedUsersArray);
      
      // Load first batch of 20 users from sorted array
      console.log('Loading first batch from sorted array...');
      loadUsersFromArray(sortedUsersArray, 0, 20);
      } else {
        console.log('No users found, stopping loading');
        setLoading(false);
      }
      
    } catch (error) {
      console.error('Error fetching users:', JSON.stringify(error));
      //Alert.alert('Error', 'Failed to load users. Please try again.');
      setLoading(false);
    }
  };

  const loadMore = async () => {
    console.log('loadMore called:', { loading, hasMore, sortedUsers: sortedUsers?.length, dataShown: dataShown.length });
    
    if (loading || !hasMore || !sortedUsers || sortedUsers.length === 0) {
      console.log('LoadMore blocked:', { loading, hasMore, sortedUsers: sortedUsers?.length });
      return;
    }
    
    setLoading(true);
    
    // Load next batch of 20 users from sorted array
    const currentCount = dataShown.length;
    const startIndex = currentCount;
    console.log('Loading more users from array:', { currentCount, startIndex, totalAvailable: sortedUsers.length });
    
    loadUsersFromArray(sortedUsers, startIndex, 20);
    
    // Check if there are more users to load
    if (startIndex + 20 >= sortedUsers.length) {
      console.log('No more users to load, setting hasMore to false');
      setHasMore(false);
    }
  };

  useEffect(() => {
    // Load users immediately when component mounts, even without user data
    getUsers(false);
    
    // Cleanup snapshots on unmount
    return () => {
      destroyAllSnapshots();
    };
  }, []); // Empty dependency array - run only once on mount

  // Update filterLocation when user location changes
  useEffect(() => {
    // Always use currentLocation (like old project)
    if (me?.currentLocation?.city && me?.currentLocation?.lat && me?.currentLocation?.lng) {
      setFilterLocation({
        city: me.currentLocation.city,
        lat: me.currentLocation.lat,
        lng: me.currentLocation.lng,
        hash: me.currentLocation.hash || geohashForLocation([me.currentLocation.lat, me.currentLocation.lng])
      });
      if (dataShown.length > 0) {
        // Small delay to ensure Redux state is updated before calling getUsers
        setTimeout(() => {
          getUsers(false);
        }, 100);
      }
    }
  }, [me?.currentLocation?.lat, me?.currentLocation?.lng]);

  // Reload users when user changes
  useEffect(() => {
    if (me) {
      getUsers(false);
    }
  }, [me?.id, me?.gender, me?.genderLookingFor]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCardShown(() => {
        if (cardShown >= 3) {
          return 1;
        } else {
          return cardShown + 1;
        }
      }); 
    }, 1500);

    return () => clearTimeout(timer);
  }, [dataShown, cardShown]);

  
  useEffect(() => {
    if (showPlacesModal && !canChangeLocation()) {
      setShowPlacesModal(false);
    }
  }, [showPlacesModal, me]);


  const canChangeLocation = () => {
    if (!me || !me.membership) return false;
    return [Membership.Gold, Membership.VIP, Membership.Phantom, Membership.Celebrity].includes(me.membership) || me.isAdmin;
  };

  
  const onMarkerDragEnd = async (e) => {
    if (!canChangeLocation()) {
      Alert.alert(
        t('FEATURENOTAVAILABLE'),
        t('FEATURENOTAVAILABLE'),
        [
          { text: t('CANCEL'), style: 'cancel' },
          { text: t('UPGRADE'), onPress: () => navigate(routes.subscription) },
        ]
      );
      return;
    }
    
    const coordinate = e.nativeEvent.coordinate;
    // Randomize around selected point (5km) like old project
    const randomized = locationService.randomGeoLocation(coordinate.latitude, coordinate.longitude, 5000);
    const newLocation = {
      ...filterLocation,
      lat: randomized.latitude,
      lng: randomized.longitude,
    };
    
    // Get city name from coordinates using reverse geocoding
    try {
      const city = await getCityFromCoordinates(coordinate.latitude, coordinate.longitude);
      newLocation.city = city;
    } catch (error) {
      console.error('Error getting city from coordinates:', error);
      // Show a more user-friendly fallback
      newLocation.city = `Location (${coordinate.latitude.toFixed(2)}, ${coordinate.longitude.toFixed(2)})`;
    }
    
    setFilterLocation(newLocation);
    // Persist as custom location immediately
    try {
      const user = await getCurrentUser();
      if (user && user.id) {
        await firestore()
          .collection('Users')
          .doc(user.id)
          .update({
            location: { type: 'customLocation', currentLocation: newLocation },
          });
        const serializedUser = serializeFirestoreData({ ...me, location: { type: 'customLocation', currentLocation: newLocation } });
        dispatch(setUser({ user: serializedUser, dataLoaded: true }));
      }
    } catch {}
    // Reload users with new location
    setTimeout(() => getUsers(false), 100); // Small delay to ensure state is updated
  };

  
  const onPlaceSelected = async (data, details) => {
    console.log('onPlaceSelected called in home:', data, details);
    if (details?.geometry?.location) {
      // Randomize around selected city (5km)
      const randomized = locationService.randomGeoLocation(details.geometry.location.lat, details.geometry.location.lng, 5000);
      const newLocation = {
        city: data.description,
        lat: randomized.latitude,
        lng: randomized.longitude,
      };
      
      // Update local state and persist as custom location
      setFilterLocation(newLocation);
      setShowPlacesModal(false);
      
      try {
        const user = await getCurrentUser();
        if (user && user.id) {
          await firestore()
            .collection('Users')
            .doc(user.id)
            .update({
              location: { type: 'customLocation', currentLocation: newLocation },
            });
          const serializedUser = serializeFirestoreData({ ...me, location: { type: 'customLocation', currentLocation: newLocation } });
          dispatch(setUser({ user: serializedUser, dataLoaded: true }));
        }
      } catch (error) {
        console.error('Error updating user location:', error);
      }
      
      // Reload users with new location
      setTimeout(() => getUsers(false), 100); // Small delay to ensure state is updated
    } else {
      setShowPlacesModal(false);
    }
  };

 
  const handleCitySearch = () => {
    if (!canChangeLocation()) {
      Alert.alert(
        t('FEATURENOTAVAILABLE'),
        t('FEATURENOTAVAILABLE'),
        [
          { text: t('CANCEL'), style: 'cancel' },
          { text: t('UPGRADE'), onPress: () => navigate(routes.subscription) },
        ]
      );
      return;
    }
    setShowLocationField(true); // Show text field
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCitySearchSubmit = async () => {
    if (searchQuery.trim().length < 3) return;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchQuery)}&types=(cities)&key=AIzaSyBxdsntNvOw3i8qUwDC_rqpEDOMvlQJgIQ&language=en`
      );
      const data = await response.json();
      
      if (data.predictions) {
        setSearchResults(data.predictions);
      }
    } catch (error) {
      console.error('Error searching cities:', error);
    }
  };

  const handleCitySelect = async (place) => {
    try {
      // Get place details
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=geometry,formatted_address&key=AIzaSyBxdsntNvOw3i8qUwDC_rqpEDOMvlQJgIQ`
      );
      const data = await response.json();
      
      if (data.result?.geometry?.location) {
        const lat = data.result.geometry.location.lat;
        const lng = data.result.geometry.location.lng;
        
        // Get city name using geocoding
        let cityName;
        try {
          cityName = await locationService.getCityFromLatLng(lat, lng);
        } catch (error) {
          console.error('Error getting city name:', error);
          cityName = place.description;
        }
        
        // Create location with hash
        const newLocation = {
          lat: lat,
          lng: lng,
          city: cityName,
          hash: geohashForLocation([lat, lng])
        };
        
        // Only update local state (NOT saving to Firestore yet)
        // Location will be saved when user clicks "Apply" button
        setFilterLocation(newLocation);
        setShowCitySearch(false);
        setShowLocationField(false);
        setSearchQuery('');
        setSearchResults([]);
        
        console.log('City selected (not saved yet):', cityName);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  const handleGPSLocation = async () => {
    if (!canChangeLocation()) {
      Alert.alert(
        t('FEATURENOTAVAILABLE'),
        t('FEATURENOTAVAILABLE'),
        [
          { text: t('CANCEL'), style: 'cancel' },
          { text: t('UPGRADE'), onPress: () => navigate(routes.subscription) },
        ]
      );
      return;
    }
    
    try {
      // Use React Native Geolocation directly
      const position = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            resolve(position);
          },
          (error) => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      });
      
      const { latitude, longitude } = position.coords;
      
      // Get city name from coordinates using locationService (like old project)
      let cityName;
      try {
        cityName = await locationService.getCityFromLatLng(latitude, longitude);
      } catch (error) {
        console.error('Error getting city from coordinates:', error);
        cityName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      }
      console.log('GPS Location - Coordinates:', latitude, longitude);
      console.log('GPS Location - City Name:', cityName);
      
      // Create location with hash (like old project)
      const newLocation = {
        lat: latitude,
        lng: longitude,
        city: cityName,
        hash: geohashForLocation([latitude, longitude])
      };
      
      setFilterLocation(newLocation);
      
      // Update directly in currentLocation (like old project)
      // NOT in location.currentLocation, but in user.currentLocation
      if (me?.id) {
        await firestore().collection('Users').doc(me.id).update({
          currentLocation: newLocation,
          location: { 
            type: 'currentLocation'
          }
        });
        
        // Update Redux state
        dispatch(setUser({ 
          user: { 
            ...me, 
            currentLocation: newLocation,
            location: { type: 'currentLocation' } 
          }, 
          dataLoaded: true 
        }));
        
        // Hide text field after GPS selection
        setShowLocationField(false);
      }
    } catch (error) {
      console.error('Error getting GPS location:', error);
      Alert.alert('Error', 'Could not get current location');
    }
  };


  const onMapPress = async (e) => {
    if (!canChangeLocation()) {
      Alert.alert(
        t('FEATURENOTAVAILABLE'),
        t('FEATURENOTAVAILABLE'),
        [
          { text: t('CANCEL'), style: 'cancel' },
          { text: t('UPGRADE'), onPress: () => navigate(routes.subscription) },
        ]
      );
      return;
    }
    
    const coordinate = e.nativeEvent.coordinate;
    const randomized = locationService.randomGeoLocation(coordinate.latitude, coordinate.longitude, 5000);
    
    // Get city name from coordinates using reverse geocoding (like old project)
    let city;
    try {
      city = await locationService.getCityFromLatLng(randomized.latitude, randomized.longitude);
    } catch (error) {
      console.error('Error getting city from coordinates:', error);
      city = `${randomized.latitude.toFixed(2)}, ${randomized.longitude.toFixed(2)}`;
    }
    
    const newLocation = {
      lat: randomized.latitude,
      lng: randomized.longitude,
      city: city,
      hash: geohashForLocation([randomized.latitude, randomized.longitude])
    };
    
    setFilterLocation(newLocation);
    
    // Persist in currentLocation directly (like old project)
    // NOT in location.currentLocation, but in user.currentLocation
    try {
      const user = await getCurrentUser();
      if (user && user.id) {
        await firestore()
          .collection('Users')
          .doc(user.id)
          .update({
            currentLocation: newLocation,
            location: { type: 'customLocation' }
          });
        const serializedUser = serializeFirestoreData({ 
          ...me, 
          currentLocation: newLocation,
          location: { type: 'customLocation' } 
        });
        dispatch(setUser({ user: serializedUser, dataLoaded: true }));
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const clearFilters = async () => {
    const originalLocation = {
      lat: me?.currentLocation?.lat || 0,
      lng: me?.currentLocation?.lng || 0,
      city: me?.currentLocation?.city || '',
      hash: me?.currentLocation?.hash || geohashForLocation([me?.currentLocation?.lat || 0, me?.currentLocation?.lng || 0])
    };
    
    // Update local state and reload users
    setFilterLocation(originalLocation);
    
    FilterModalToggle();
    
    // Reload users with original location
    setTimeout(() => getUsers(false), 100);
  };

  const applyFilter = async () => {
    // Save the current filterLocation to the user profile
    try {
      isApplyingFilter.current = true; // Prevent useEffect from overwriting filterLocation
      
      const user = await getCurrentUser();
      if (user && user.id) {
        // Ensure filterLocation has hash
        const locationWithHash = {
          ...filterLocation,
          hash: filterLocation.hash || geohashForLocation([filterLocation.lat, filterLocation.lng])
        };
        
        await firestore()
          .collection('Users')
          .doc(user.id)
          .update({
            currentLocation: locationWithHash,
            location: {
              type: 'customLocation'
            }
          });
        
        // Update Redux state
        const serializedUser = serializeFirestoreData({ 
          ...me, 
          currentLocation: locationWithHash, 
          location: { type: 'customLocation' } 
        });
        dispatch(setUser({ 
          user: serializedUser, 
          dataLoaded: true 
        }));
        
        console.log('Filter applied with new location:', locationWithHash.city || `${locationWithHash.lat.toFixed(2)}, ${locationWithHash.lng.toFixed(2)}`);
        
        // Close modal first
        FilterModalToggle();
        
        // Reload users with new location after Redux state is updated
        // Use a longer timeout to ensure Redux state propagation
        setTimeout(() => {
          console.log('Reloading users with new search location...');
          getUsers(false);
          
          // Reset the flag after getUsers is called
          setTimeout(() => {
            isApplyingFilter.current = false;
          }, 500);
        }, 300);
      }
    } catch (error) {
      console.error('Error saving location:', error);
      isApplyingFilter.current = false; // Reset flag on error
      Alert.alert(t('ERROR'), t('ERROR_UPDATING_LOCATION'));
    }
  };

  const reloadUsers = async () => {
    await getUsers(false);
  };

  // Pull-to-Refresh Handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Reload users from scratch
      await getUsers(false);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [getUsers]);

  const { t } = useTranslation();

  // Dynamische Distance-Unit (km/mi)
  const distanceType = me?._settings?.units?.distanceType === 'Mi' ? 'mi' : 'km';

  // Group data for tablet layout
  const getGroupedData = () => {
    if (!isTablet()) {
      return dataShown.map(item => ({ type: 'single', items: [item] }));
    }

    const grouped = [];
    let currentGroup = [];

    dataShown.forEach((item) => {
      // VIP and Gold users get their own row
      if (item.membership === Membership.VIP || item.membership === Membership.Gold) {
        // Push any pending non-VIP/Gold group first
        if (currentGroup.length > 0) {
          grouped.push({ type: 'grid', items: currentGroup });
          currentGroup = [];
        }
        // Add VIP/Gold as single row
        grouped.push({ type: 'single', items: [item] });
      } else {
        // Add to current group
        currentGroup.push(item);
        // When we have 3 non-VIP/Gold users, create a grid row
        if (currentGroup.length === 3) {
          grouped.push({ type: 'grid', items: currentGroup });
          currentGroup = [];
        }
      }
    });

    // Add remaining items
    if (currentGroup.length > 0) {
      grouped.push({ type: 'grid', items: currentGroup });
    }

    return grouped;
  };

  const renderGridRow = ({ items, me }) => {
    return (
      <View style={styles.gridRow}>
        {items.map((item, index) => (
          <View key={item.id} style={styles.gridItem}>
            <ProfileCardItem item={item} index={index} me={me} isTabletGrid={true} />
          </View>
        ))}
        {/* Fill empty slots to maintain grid alignment */}
        {items.length < 3 && Array.from({ length: 3 - items.length }).map((_, index) => (
          <View key={`empty-${index}`} style={styles.gridItem} />
        ))}
      </View>
    );
  };

  return (
    <Wrapper isMain style={{ paddingTop: Math.max(insets.top * 0.5, 6) }}>
      <Headers.Common RightButtons={HomeTopRightButtonsData} />
      <FlatList
        data={getGroupedData()}
        renderItem={({ item, index }) => {
          if (item.type === 'single') {
            return <ProfileCardItem item={item.items[0]} index={index} me={me} isTabletGrid={false} />;
          } else {
            return renderGridRow({ items: item.items, me });
          }
        }}
        ItemSeparatorComponent={<Spacer isMedium />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.appPrimaryColor}
            colors={[colors.appPrimaryColor]}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={100}
        initialNumToRender={3}
        windowSize={5}
        disableVirtualization={false}
        ListFooterComponent={
          <>
            {loading && hasMore && (
              <Wrapper marginHorizontalBase style={{marginBottom: responsiveHeight(2)}}>
                <Text style={{
                  color: colors.appTextColor2,
                  fontSize: responsiveFontSize(3),
                  textAlign: 'center'
                }}>
                  {dataShown.length > 0 ? 'Lädt weitere Benutzer...' : 'Lädt Benutzer...'}
                </Text>
              </Wrapper>
            )}
            {!loading && hasMore && dataShown.length > 0 && (
              <Wrapper marginHorizontalBase style={{marginBottom: responsiveHeight(2)}}>
                <Text style={{
                  color: colors.appTextColor2,
                  fontSize: responsiveFontSize(3),
                  textAlign: 'center'
                }}>
                  Ziehen Sie nach unten, um mehr zu laden
                </Text>
              </Wrapper>
            )}
            <Spacer height={responsiveHeight(10)} />
          </>
        }
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => {
          if (item.type === 'single') {
            return `single-${item.items[0]?.id || index}`;
          } else {
            return `grid-${item.items.map(i => i.id).join('-') || index}`;
          }
        }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        scrollEventThrottle={16}
      />
      {/* Modal of Filter */}
      <Modals.PopupPrimary
        visible={FilterModal}
        isBlur
        scrollEnabled={true}
        children={
          <Wrapper>
            <Wrapper marginHorizontalBase>
              <Wrapper
                flexDirectionRow
                alignItemsCenter
                justifyContentSpaceBetween
              //backgroundColor={'blue'}
              >
                <Wrapper flexDirectionRow alignItemsCenter>
                  <Text style={{
                    fontSize: responsiveFontSize(12.5),
                    marginRight: responsiveWidth(2),
                  }}>
                    🔍
                  </Text>
                  <Text
                    isTinyTitle
                    style={{
                      //backgroundColor: 'red',
                      width: responsiveWidth(50),
                    }}
                    children={t('FILTER')}
                  />
                </Wrapper>
                <TouchableOpacity onPress={FilterModalToggle}>
                  <Text style={{
                    fontSize: responsiveFontSize(15),
                    color: colors.appBGColor,
                  }}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </Wrapper>
              <Spacer isTiny />
              <Text
                isTextColor2
                isRegular
                isRegularFont
                children={t('CHOOSE_FILTER_TO_MATCH_PROFILES')}
              />
            </Wrapper>
            <Spacer isSmall />
            <Sliders.PrimarySlider
              SliderLabel={t('DISTANCE')}
              SliderValue={[filter.perimeterValue]}
              ValueLabel={distanceType}
            />
            <Spacer isSmall />
            <Sliders.PrimarySlider
              SliderLabel={'Age'}
              isMulti
              SliderValue={[filter.ageRange.lower, filter.ageRange.upper]}
            />

            <Labels.Normal Label={filterLocation.city ? `Standort: ${filterLocation.city}` : "Standort"} />
            <Spacer isSmall />
            
            
            {/* Location Field - Only shown when showLocationField is true */}
            {showLocationField && (
              <Wrapper style={{ marginHorizontal: 16, marginTop: 10 }}>
                <TextInputs.Bordered
                  placeholder={t('SEARCHPLACE')}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    
                    // Clear previous timeout
                    if (searchTimeout) {
                      clearTimeout(searchTimeout);
                    }
                    
                    if (text.length >= 3) {
                      // Debounce search by 300ms
                      const timeout = setTimeout(() => {
                        handleCitySearchSubmit(text);
                      }, 300);
                      setSearchTimeout(timeout);
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  autoFocus={true}
                  returnKeyType="search"
                />
                
                {/* Suchergebnisse UNTER dem Suchfeld */}
                {searchResults.length > 0 && (
                  <ScrollView 
                    style={{
                      marginTop: 8,
                      backgroundColor: colors.appBgColor1,
                      borderRadius: 8,
                      maxHeight: 200,
                      borderWidth: 1,
                      borderColor: colors.appBorderColor2,
                    }}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    bounces={false}
                  >
                    {searchResults.map((place, index) => (
                      <TouchableOpacity
                        key={index}
                        style={{
                          padding: 15,
                          borderBottomWidth: index < searchResults.length - 1 ? 1 : 0,
                          borderBottomColor: colors.appBorderColor2,
                        }}
                        onPress={() => handleCitySelect(place)}>
                        <Text style={{ color: colors.appTextColor1, fontSize: fontSizes.medium }}>
                          {place.description}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </Wrapper>
            )}
            
            <Spacer isSmall />
            {/* MapView unter den Filtern */}
            <Wrapper style={{ height: 320, borderRadius: 12, overflow: 'hidden', marginBottom: 16, marginHorizontal: 16 }}>
              {/* Small buttons on map */}
              <Wrapper style={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                zIndex: 1001,
                flexDirection: 'row',
                gap: 8,
              }}>
                <TouchableOpacity
                  onPress={handleCitySearch}
                  style={{
                    backgroundColor: colors.appBgColor1,
                    borderRadius: 20,
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.appBorderColor2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }}>
                  <Icons.Custom
                    icon={appIcons.Search}
                    size={scale(18)}
                    color={colors.appTextColor1}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleGPSLocation}
                  style={{
                    backgroundColor: colors.appBgColor1,
                    borderRadius: 20,
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.appBorderColor2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }}>
                  <Icons.Custom
                    icon={appIcons.LocationLogo1}
                    size={scale(18)}
                    color={colors.appTextColor1}
                  />
                </TouchableOpacity>
              </Wrapper>
              
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: filterLocation.lat || 0,
                  longitude: filterLocation.lng || 0,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                region={{
                  latitude: filterLocation.lat || 0,
                  longitude: filterLocation.lng || 0,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                scrollEnabled={canChangeLocation()}
                zoomEnabled={canChangeLocation()}
                pitchEnabled={canChangeLocation()}
                rotateEnabled={canChangeLocation()}
                onPress={onMapPress}
              >
                <Marker
                  coordinate={{
                    latitude: filterLocation.lat || 0,
                    longitude: filterLocation.lng || 0,
                  }}
                  draggable={canChangeLocation()}
                  onDragEnd={onMarkerDragEnd}
                />
              </MapView>
            </Wrapper>
            <Buttons.Colored
              text={t('APPLY')}
              onPress={applyFilter}
            />
            <Spacer isBasic />
            <Text
              alignTextCenter
              isMedium
              isMediumFont
              children={t('CLEAR')}
              onPress={clearFilters}
            />
            <Spacer isBasic />
          </Wrapper>
        }
      />
      
      {/* City Search Modal */}
      <Modals.PopupPrimary
        visible={showCitySearch}
        toggle={() => {
          setShowCitySearch(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
        title={t('SEARCHPLACE')}
        content={
          <Wrapper>
            <TextInputs.Bordered
              placeholder={t('SEARCHPLACE')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
              returnKeyType="search"
              onSubmitEditing={handleCitySearchSubmit}
            />
            <Spacer isBasic />
            {searchResults.length > 0 && (
              <Wrapper style={{ maxHeight: 300 }}>
                {searchResults.map((place, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{
                      padding: 15,
                      borderBottomWidth: index < searchResults.length - 1 ? 1 : 0,
                      borderBottomColor: colors.appBorderColor2,
                      backgroundColor: colors.appBgColor1,
                    }}
                    onPress={() => handleCitySelect(place)}>
                    <Text style={{ color: colors.appTextColor1, fontSize: fontSizes.medium }}>
                      {place.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Wrapper>
            )}
          </Wrapper>
        }
      />
    </Wrapper>
  );
}

const ProfileCardItem = React.memo(({ item, me, index, isTabletGrid = false }) => {
  const [distance, setDistance] = useState('');
  const [randomBadges, setRandomBadges] = useState([]);

  // Early return if item is null or undefined
  if (!item) {
    return null;
  }

  // Extract random badges from user details that match between users
  useEffect(() => {
    if (item?.details && me?.details && item?.id && me?.id && item?.profilePictures) {
      const matchedBadges = [];
      
      // Check for matching interests
      if (item.details.interests && me.details.interests) {
        item.details.interests.forEach(itemInterest => {
          const itemValue = itemInterest[me?._settings?.currentLang] || itemInterest.en || itemInterest.category;
          const hasMatch = me.details.interests.some(meInterest => {
            const meValue = meInterest[me?._settings?.currentLang] || meInterest.en || meInterest.category;
            return itemValue === meValue;
          });
          if (hasMatch) {
            matchedBadges.push(itemValue);
          }
        });
      }
      
      // Check for matching lifestyle
      if (item.details.lifestyle && me.details.lifestyle) {
        item.details.lifestyle.forEach(itemLifestyle => {
          const itemValue = itemLifestyle[me?._settings?.currentLang] || itemLifestyle.en || itemLifestyle.category;
          const hasMatch = me.details.lifestyle.some(meLifestyle => {
            const meValue = meLifestyle[me?._settings?.currentLang] || meLifestyle.en || meLifestyle.category;
            return itemValue === meValue;
          });
          if (hasMatch) {
            matchedBadges.push(itemValue);
          }
        });
      }
      
      // Check for matching moreinfo
      if (item.details.moreinfo && me.details.moreinfo) {
        item.details.moreinfo.forEach(itemInfo => {
          const itemValue = itemInfo[me?._settings?.currentLang] || itemInfo.en || itemInfo.category;
          const hasMatch = me.details.moreinfo.some(meInfo => {
            const meValue = meInfo[me?._settings?.currentLang] || meInfo.en || meInfo.category;
            return itemValue === meValue;
          });
          if (hasMatch) {
            matchedBadges.push(itemValue);
          }
        });
      }
      
      // Check for matching brands
      if (item.details.brands && me.details.brands) {
        item.details.brands.forEach(itemBrand => {
          const itemValue = itemBrand.value || itemBrand.category;
          const hasMatch = me.details.brands.some(meBrand => {
            const meValue = meBrand.value || meBrand.category;
            return itemValue === meValue;
          });
          if (hasMatch) {
            matchedBadges.push(itemValue);
          }
        });
      }
      
      // Remove duplicates and shuffle, then take 2-3 random matched badges
      const uniqueBadges = [...new Set(matchedBadges)];
      const shuffled = uniqueBadges.sort(() => 0.5 - Math.random());
      
      // Take exactly 2 badges
      const badgeCount = Math.min(2, shuffled.length);
      setRandomBadges(shuffled.slice(0, badgeCount));
    }
  }, [item?.details, me?.details, me?._settings?.currentLang]);

  useEffect(() => {
    if (me && me.id && item?.currentLocation && item?.id && item?.profilePictures) {
      const dis = parseFloat(
        calcDistance(
          me?.currentLocation?.lat || 0,
          me?.currentLocation?.lng || 0,
          item.currentLocation.lat,
          item.currentLocation.lng,
          5
        )
      );

      // Dynamische Distanz-Einheit (km/mi)
      const distanceType = me?._settings?.units?.distanceType === 'Mi' ? 'Mi' : 'Km';
      const distanceValue = me?._settings?.units?.distanceType === 'Mi' ? dis * 0.621371 : dis;
      
      setDistance(distanceValue > 99 ? `>99${distanceType}` : (distanceValue > 0 ? distanceValue.toFixed(1) : distanceValue) + distanceType);
    }
  }, [me?.currentLocation, me?._settings?.units?.distanceType, item?.currentLocation]);

  const handlePress = useCallback(() => {
    if (!item?.id || !item?.profilePictures) return;
    navigate(routes.userProfile, { visiterProfile: true, userId: item.id });
  }, [item?.id, item?.profilePictures]);

  const handlePressPoints = useCallback(() => {
    if (!item?.id || !item?.profilePictures) return;
    // Navigate to photo gallery or show photo modal
    console.log('Points clicked for user:', item.id);
    // TODO: Implement photo gallery navigation
  }, [item?.id, item?.profilePictures]);

  return (
    <View style={isTabletGrid ? {width: '100%'} : {alignItems: 'center'}}>
      <Cards.Profile
        CardImage={getApprovedImageSource(item?.profilePictures, item?.gender, me?.id, item?.id)}
        isVip={item.membership === 3}
        isGold={item.membership === 2}
        isStandard={false}
        username={item.username || ''}
        onPress={handlePress}
        distance={distance}
        city={item.currentLocation?.city || ''}
        badges={randomBadges}
        profilePictures={item?.profilePictures || null}
        publicAlbum={item?.publicAlbum || null}
        onPressPoints={handlePressPoints}
        isTabletGrid={isTabletGrid}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  if (prevProps.item?.id !== nextProps.item?.id) return false;
  if (prevProps.item?.profilePictures?.thumbnails?.big !== nextProps.item?.profilePictures?.thumbnails?.big) return false;
  if (prevProps.item?.membership !== nextProps.item?.membership) return false;
  if (prevProps.item?.username !== nextProps.item?.username) return false;
  if (prevProps.me?.currentLocation?.lat !== nextProps.me?.currentLocation?.lat) return false;
  if (prevProps.me?.currentLocation?.lng !== nextProps.me?.currentLocation?.lng) return false;
  if (prevProps.me?._settings?.units?.distanceType !== nextProps.me?._settings?.units?.distanceType) return false;
  return true;
});


const styles = StyleSheet.create({
  flatListContent: {
    flexGrow: 1,
    //height: responsiveHeight(90),
    justifyContent: 'center', // Centers items vertically inside the FlatList
    alignItems: 'center', // Ensures items are centered horizontally
  },
  centeredItemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: responsiveWidth(3),
    gap: responsiveWidth(1.5),
  },
  gridItem: {
    flex: 1,
    maxWidth: '31%',
  },
  tabletGridCard: {
    width: '100%',
  },
});


