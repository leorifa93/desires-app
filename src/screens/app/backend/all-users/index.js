import React, {useState, useEffect} from 'react';
import {Alert, ScrollView, TouchableOpacity, TextInput} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import firestore from '@react-native-firebase/firestore';
import {colors} from '../../../../services/utilities/colors';
import {routes} from '../../../../services/constants';
import {responsiveHeight, responsiveWidth} from '../../../../services/utilities/responsive';
import {Wrapper, Text, StatusBars, Headers, Icons} from '../../../../components';
import {Spacer} from '../../../../components';

export default function BackendAllUsers() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchString, setSearchString] = useState('');
  const [lastDoc, setLastDoc] = useState(null);
  const [sort, setSort] = useState('username');
  const [sortDirection, setSortDirection] = useState('asc');
  const [activeFilters, setActiveFilters] = useState([]);
  const [membershipFilters, setMembershipFilters] = useState([]);
  const [genderFilters, setGenderFilters] = useState([]);
  const [location, setLocation] = useState({});
  const [searchedFriends, setSearchedFriends] = useState([]);
  const [maxPages, setMaxPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Filter definitions (like in old project)
  const filters = [
    { key: 'membership', value: 1, title: 'Gold', opr: '==' },
    { key: 'membership', value: 2, title: 'VIP', opr: '==' },
    { key: 'membership', value: 0, title: 'Standard', opr: '==' },
    { key: 'membership', value: 3, title: 'Stealth', opr: '==' },
    { key: 'gender', value: 2, title: 'Weiblich', opr: '==' },
    { key: 'gender', value: 1, title: 'Männlich', opr: '==' },
    { key: 'gender', value: 3, title: 'Transsexual', opr: '==' }
  ];

  useEffect(() => {
    // Only load users when sort changes, not on every search
    loadUsers();
  }, [sort, sortDirection]);

  useEffect(() => {
    // Cleanup search timeout on unmount
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const loadUsers = async (offset = null) => {
    try {
      setLoading(true);
      console.log('Loading users with searchString:', searchString, 'searchedFriends:', searchedFriends);
      
      let query = firestore().collection('Users');
      
      // Simple search implementation
      if (searchString && searchString.trim()) {
        // For now, just get all users and filter locally
        const allUsersSnapshot = await query.get();
        const filteredUsers = [];
        
        allUsersSnapshot.docs.forEach(doc => {
          const user = doc.data();
          const searchLower = searchString.toLowerCase();
          
          if (
            user.username?.toLowerCase().includes(searchLower) ||
            doc.id.includes(searchLower) ||
            user.currentLocation?.city?.toLowerCase().includes(searchLower)
          ) {
            user.id = doc.id;
            user.doc = doc;
            filteredUsers.push(user);
          }
        });
        
        // Apply other filters
        let finalUsers = filteredUsers;
        
        if (membershipFilters.length > 0) {
          finalUsers = finalUsers.filter(user => membershipFilters.includes(user.membership));
        }
        
        if (genderFilters.length > 0) {
          finalUsers = finalUsers.filter(user => genderFilters.includes(user.gender));
        }
        
        if (location?.hash) {
          finalUsers = finalUsers.filter(user => user.currentLocation?.hash === location.hash);
        }
        
        // Apply sorting
        finalUsers.sort((a, b) => {
          const aValue = a[sort] || '';
          const bValue = b[sort] || '';
          if (sortDirection === 'desc') {
            return bValue > aValue ? 1 : -1;
          }
          return aValue > bValue ? 1 : -1;
        });
        
        // Apply pagination
        const startIndex = offset ? 40 : 0;
        const endIndex = startIndex + 40;
        const paginatedUsers = finalUsers.slice(startIndex, endIndex);
        
        if (!offset) {
          setUsers(paginatedUsers);
        } else {
          setUsers(prevUsers => [...prevUsers, ...paginatedUsers]);
        }
        
        if (finalUsers.length > 40) {
          setLastDoc({ hasMore: true });
        } else {
          setLastDoc(null);
        }
        
        console.log('Loaded filtered users:', paginatedUsers.length, 'of', finalUsers.length);
      } else {
        // No search - use original filter approach
        // Apply filters
        activeFilters.forEach(filter => {
          if (filter.opr === 'in') {
            query = query.where(filter.key, 'in', filter.value);
          } else if (filter.opr === '==') {
            query = query.where(filter.key, '==', filter.value);
          }
        });
        
        // Apply sorting
        query = query.orderBy(sort, sortDirection === 'desc' ? 'desc' : 'asc');
        
        // Apply pagination
        if (offset) {
          query = query.startAfter(offset);
        }
        
        query = query.limit(40);
        
        const usersSnapshot = await query.get();
        const usersData = [];
        
        usersSnapshot.docs.forEach((doc, index) => {
          const user = doc.data();
          user.id = doc.id;
          user.doc = doc; // For pagination
          usersData.push(user);
        });
        
        if (!offset) {
          setUsers(usersData);
        } else {
          setUsers(prevUsers => [...prevUsers, ...usersData]);
        }
        
        if (usersData.length > 1) {
          setLastDoc(usersData[usersData.length - 1].doc);
        }
        
        console.log('Loaded users:', usersData.length);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert(t('ERROR'), t('ERROR_LOADING_DATA'));
    } finally {
      setLoading(false);
    }
  };

  const onSearch = () => {
    console.log('onSearch called with searchString:', searchString);
    
    if (searchString.trim()) {
      console.log('Starting search for:', searchString.trim());
      setSearchedFriends([]);
      setCurrentPage(0);
      setMaxPages(0);
      // Don't call search() - just update searchedFriends and let loadUsers handle it
      setSearchedFriends([searchString.trim()]); // Simple approach for now
    } else {
      console.log('Clearing search');
      setSearchedFriends([]);
      setCurrentPage(0);
      setMaxPages(0);
    }
  };

  const search = async (page = 0) => {
    // Simplified search - just update searchedFriends
    console.log('Search called for page:', page);
    // For now, we'll just use the searchString directly
  };

  const handleSearchChange = (text) => {
    setSearchString(text);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for automatic search (500ms delay)
    const timeout = setTimeout(() => {
      if (text.trim()) {
        console.log('Auto-search triggered for:', text.trim());
        setSearchedFriends([]);
        setCurrentPage(0);
        setMaxPages(0);
        // Just update searchedFriends and let loadUsers handle the rest
        setSearchedFriends([text.trim()]);
      } else {
        console.log('Clearing search results');
        setSearchedFriends([]);
        setCurrentPage(0);
        setMaxPages(0);
        // Clear search and reload all users
        loadUsers();
      }
    }, 500);
    
    setSearchTimeout(timeout);
  };

  const isActive = (filter) => {
    if (filter.key === 'membership') {
      return membershipFilters.includes(filter.value);
    } else if (filter.key === 'gender') {
      return genderFilters.includes(filter.value);
    }
    return false;
  };

  const toggle = (filter) => {
    // Set loading immediately when filter is toggled
    setLoading(true);
    
    if (filter.key === 'membership') {
      if (membershipFilters.includes(filter.value)) {
        setMembershipFilters(prev => prev.filter(f => f !== filter.value));
      } else {
        setMembershipFilters(prev => [...prev, filter.value]);
      }
    } else if (filter.key === 'gender') {
      if (genderFilters.includes(filter.value)) {
        setGenderFilters(prev => prev.filter(f => f !== filter.value));
      } else {
        setGenderFilters(prev => [...prev, filter.value]);
      }
    }
    
    // Reset pagination when filters change
    setLastDoc(null);
    updateActiveFilters();
  };

  const updateActiveFilters = () => {
    const newFilters = [];
    
    if (membershipFilters.length > 0) {
      newFilters.push({key: 'membership', opr: 'in', value: membershipFilters});
    }
    
    if (genderFilters.length > 0) {
      newFilters.push({key: 'gender', opr: 'in', value: genderFilters});
    }
    
    if (location?.hash) {
      newFilters.push({key: 'currentLocation.hash', opr: '==', value: location.hash});
    }
    
    console.log('Updating filters:', {
      membershipFilters,
      genderFilters,
      location,
      newFilters
    });
    
    setActiveFilters(newFilters);
    
    // Load users with new filters immediately (no delay)
    loadUsers();
  };

  const clearAllFilters = () => {
    setMembershipFilters([]);
    setGenderFilters([]);
    setLocation({});
    setActiveFilters([]);
    setLastDoc(null);
    loadUsers();
  };

  const getMembership = (membership) => {
    if (membership === 0) return 'Standard';
    else if (membership === 1) return 'Gold';
    else if (membership === 2) return 'VIP';
    else if (membership === 3) return 'Stealth';
    return 'Standard';
  };

  const getGender = (gender) => {
    if (gender === 1) return 'Männlich';
    else if (gender === 2) return 'Weiblich';
    else if (gender === 3) return 'Transsexual';
    return 'Unbekannt';
  };

  const showProfile = (user) => {
    navigation.navigate(routes.userProfile, {
      visiterProfile: true, 
      userId: user.id
    });
  };

  const editProfile = (user) => {
    navigation.navigate('EditUserProfile', {user: user});
  };

  const sortBy = (newSort) => {
    if (sort === newSort) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(newSort);
      setSortDirection('asc');
    }
  };

  const loadMore = () => {
    if (lastDoc && users.length >= 20) {
      loadUsers(lastDoc);
    }
  };

  const loadMoreSearch = () => {
    if (currentPage < maxPages - 1) {
      search(currentPage + 1);
    }
  };

  const showLocations = async () => {
    try {
      // For now, we'll use a simple location picker
      // In a real implementation, you would integrate Google Places API
      Alert.prompt(
        'Standort auswählen',
        'Geben Sie eine Stadt ein:',
        [
          {
            text: 'Abbrechen',
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: (cityName) => {
              if (cityName && cityName.trim()) {
                // Simulate location data like in old project
                const mockLocation = {
                  location: cityName.trim(),
                  placeId: `mock_${Date.now()}`,
                  lat: 52.5200, // Default Berlin coordinates
                  lng: 13.4050,
                };
                
                // Generate random location within 5km radius (like old project)
                const randomLat = mockLocation.lat + (Math.random() - 0.5) * 0.05; // ~5km
                const randomLng = mockLocation.lng + (Math.random() - 0.5) * 0.05;
                
                // Simple geohash calculation (in real app, use geofire-common)
                const hash = `${randomLat.toFixed(4)}_${randomLng.toFixed(4)}`;
                
                setLocation({
                  location: mockLocation.location,
                  placeId: mockLocation.placeId,
                  hash: hash,
                  lat: randomLat,
                  lng: randomLng,
                });
                
                console.log('Location set:', {
                  location: mockLocation.location,
                  hash: hash,
                  lat: randomLat,
                  lng: randomLng,
                });
                
                // Update filters and reload users
                updateActiveFilters();
              }
            },
          },
        ],
        'plain-text',
        ''
      );
    } catch (error) {
      console.error('Error showing locations:', error);
      Alert.alert('Fehler', 'Standort konnte nicht ausgewählt werden');
    }
  };

  const renderUserItem = (user, index) => {
    return (
      <Wrapper
        key={user.id || index}
        style={{
          flexDirection: 'row',
          backgroundColor: colors.appBgColor1,
          paddingVertical: responsiveHeight(1.5),
          paddingHorizontal: responsiveWidth(2),
          marginVertical: responsiveHeight(0.5),
          borderRadius: responsiveWidth(2),
          shadowColor: colors.appTextColor1,
          shadowOffset: {width: 0, height: 1},
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}>
        
        {/* Username */}
        <Wrapper style={{flex: 1, minWidth: responsiveWidth(20)}}>
          <Text style={{fontSize: 12, color: colors.appTextColor1}}>
            {user.username || 'Unbekannt'}
          </Text>
        </Wrapper>
        
        {/* Membership */}
        <Wrapper style={{flex: 1, minWidth: responsiveWidth(20)}}>
          <Text style={{fontSize: 12, color: colors.appTextColor2}}>
            {getMembership(user.membership)}
          </Text>
        </Wrapper>
        
        {/* Gender */}
        <Wrapper style={{flex: 1, minWidth: responsiveWidth(20)}}>
          <Text style={{fontSize: 12, color: colors.appTextColor2}}>
            {getGender(user.gender)}
          </Text>
        </Wrapper>
        
        {/* Actions */}
        <Wrapper style={{flex: 1.5, minWidth: responsiveWidth(30), flexDirection: 'row', gap: responsiveWidth(1)}}>
          <TouchableOpacity
            onPress={() => showProfile(user)}
            style={{
              backgroundColor: '#007bff',
              paddingHorizontal: responsiveWidth(2),
              paddingVertical: responsiveHeight(0.8),
              borderRadius: responsiveWidth(1),
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: responsiveWidth(12),
            }}>
            <Text style={{color: '#ffffff', fontSize: 10, fontWeight: 'bold'}}>
              {t('PROFILE')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => editProfile(user)}
            style={{
              backgroundColor: '#28a745',
              paddingHorizontal: responsiveWidth(2),
              paddingVertical: responsiveHeight(0.8),
              borderRadius: responsiveWidth(1),
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: responsiveWidth(12),
            }}>
            <Text style={{color: '#ffffff', fontSize: 10, fontWeight: 'bold'}}>
              {t('EDIT')}
            </Text>
          </TouchableOpacity>
        </Wrapper>
      </Wrapper>
    );
  };

  if (loading && users.length === 0) {
    return (
      <Wrapper isMain>
        <StatusBars.Dark />
        <Headers.Primary
          showBackArrow
          title={t('ALLUSERS')}
        />
        <Wrapper flex={1} justifyContentCenter alignItemsCenter>
          <Text>{t('LOADING')}...</Text>
        </Wrapper>
      </Wrapper>
    );
  }

  return (
    <Wrapper isMain>
      <StatusBars.Dark />
      <Headers.Primary
        showBackArrow
        title={t('ALLUSERS')}
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Wrapper marginHorizontalBase>
          {/* Search Bar */}
          <Wrapper style={{
            backgroundColor: colors.appBgColor1,
            borderRadius: responsiveWidth(2),
            padding: responsiveWidth(2),
            marginBottom: responsiveHeight(2),
          }}>
            <Wrapper style={{flexDirection: 'row', alignItems: 'center'}}>
              <TextInput
                placeholder={t('SEARCH_USERS')}
                value={searchString}
                onChangeText={handleSearchChange}
                onSubmitEditing={onSearch}
                style={{
                  flex: 1,
                  height: responsiveHeight(5),
                  fontSize: 16,
                  color: colors.appTextColor1,
                  paddingHorizontal: responsiveWidth(2),
                }}
              />
              <TouchableOpacity
                onPress={onSearch}
                style={{
                  backgroundColor: colors.appPrimaryColor,
                  paddingHorizontal: responsiveWidth(3),
                  paddingVertical: responsiveHeight(1.5),
                  borderRadius: responsiveWidth(2),
                  marginLeft: responsiveWidth(2),
                }}>
                <Text style={{
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 'bold'
                }}>
                  Suchen
                </Text>
              </TouchableOpacity>
            </Wrapper>
          </Wrapper>

          {/* Filters */}
          <Wrapper style={{marginBottom: responsiveHeight(2)}}>
            <Text isBoldFont style={{fontSize: 16, marginBottom: responsiveHeight(1)}}>
              {t('FILTERS')}
            </Text>
            <Wrapper style={{flexDirection: 'row', flexWrap: 'wrap', gap: responsiveWidth(1)}}>
              {filters.map((filter, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggle(filter)}
                  style={{
                    backgroundColor: isActive(filter) ? colors.appPrimaryColor : colors.appBgColor1,
                    paddingHorizontal: responsiveWidth(3),
                    paddingVertical: responsiveHeight(1),
                    borderRadius: responsiveWidth(2),
                    borderWidth: 1,
                    borderColor: isActive(filter) ? colors.appPrimaryColor : colors.appTextColor2,
                  }}>
                  <Text style={{
                    color: isActive(filter) ? '#ffffff' : colors.appTextColor1,
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    {filter.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </Wrapper>
            
            {/* Clear All Filters Button */}
            {(membershipFilters.length > 0 || genderFilters.length > 0 || location?.hash) && (
              <TouchableOpacity
                onPress={clearAllFilters}
                style={{
                  backgroundColor: '#dc3545',
                  paddingHorizontal: responsiveWidth(3),
                  paddingVertical: responsiveHeight(1),
                  borderRadius: responsiveWidth(2),
                  marginTop: responsiveHeight(1),
                  alignSelf: 'flex-start',
                }}>
                <Text style={{
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}>
                  Alle Filter löschen
                </Text>
              </TouchableOpacity>
            )}
          </Wrapper>

          {/* Location Filter */}
          <Wrapper style={{marginBottom: responsiveHeight(2)}}>
            <Text isBoldFont style={{fontSize: 16, marginBottom: responsiveHeight(1)}}>
              {t('LOCATION')}
            </Text>
            <TouchableOpacity
              onPress={showLocations}
              style={{
                backgroundColor: colors.appBgColor1,
                paddingHorizontal: responsiveWidth(3),
                paddingVertical: responsiveHeight(1),
                borderRadius: responsiveWidth(2),
                borderWidth: 1,
                borderColor: colors.appTextColor2,
              }}>
              <Text style={{color: colors.appTextColor1, fontSize: 12}}>
                {location?.location || t('SELECT_LOCATION')}
              </Text>
            </TouchableOpacity>
          </Wrapper>

          {/* Sort Headers */}
          <Wrapper style={{
            flexDirection: 'row',
            backgroundColor: colors.appBgColor1,
            paddingVertical: responsiveHeight(1.5),
            paddingHorizontal: responsiveWidth(2),
            marginBottom: responsiveHeight(1),
            borderRadius: responsiveWidth(2),
            shadowColor: colors.appTextColor1,
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
            alignItems: 'center',
            minHeight: responsiveHeight(6),
          }}>
            <TouchableOpacity
              onPress={() => sortBy('username')}
              style={{
                flex: 1, 
                minWidth: responsiveWidth(20), 
                flexDirection: 'row', 
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: responsiveHeight(4),
              }}>
              <Text isBoldFont style={{fontSize: 11, color: colors.appTextColor1}}>
                {t('NAME')}
              </Text>
              {sort === 'username' && (
                <Text style={{color: colors.appTextColor2, fontSize: 10, marginLeft: responsiveWidth(1)}}>
                  {sortDirection === 'desc' ? '↓' : '↑'}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => sortBy('membership')}
              style={{
                flex: 1, 
                minWidth: responsiveWidth(20), 
                flexDirection: 'row', 
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: responsiveHeight(4),
              }}>
              <Text isBoldFont style={{fontSize: 11, color: colors.appTextColor1}}>
                {t('MEMBERSHIP')}
              </Text>
              {sort === 'membership' && (
                <Text style={{color: colors.appTextColor2, fontSize: 10, marginLeft: responsiveWidth(1)}}>
                  {sortDirection === 'desc' ? '↓' : '↑'}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => sortBy('gender')}
              style={{
                flex: 1, 
                minWidth: responsiveWidth(20), 
                flexDirection: 'row', 
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: responsiveHeight(4),
              }}>
              <Text isBoldFont style={{fontSize: 12, color: colors.appTextColor1}}>
                {t('GENDER')}
              </Text>
              {sort === 'gender' && (
                <Text style={{color: colors.appTextColor2, fontSize: 10, marginLeft: responsiveWidth(1)}}>
                  {sortDirection === 'desc' ? '↓' : '↑'}
                </Text>
              )}
            </TouchableOpacity>
            
            <Wrapper style={{
              flex: 1.5, 
              minWidth: responsiveWidth(30),
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: responsiveHeight(4),
            }}>
              <Text isBoldFont style={{fontSize: 12, color: colors.appTextColor1}}>
                {t('ACTIONS')}
              </Text>
            </Wrapper>
          </Wrapper>

          {/* Users List */}
          {loading ? (
            <Wrapper justifyContentCenter alignItemsCenter style={{marginTop: responsiveHeight(20)}}>
              <Text isMedium isBoldFont alignTextCenter>
                {t('LOADING')}...
              </Text>
            </Wrapper>
          ) : users.length > 0 ? (
            users.map((user, index) => renderUserItem(user, index))
          ) : (
            <Wrapper justifyContentCenter alignItemsCenter style={{marginTop: responsiveHeight(20)}}>
              <Text isMedium isBoldFont alignTextCenter>
                {t('NO_USERS_FOUND')}
              </Text>
            </Wrapper>
          )}

          {/* Load More */}
          {searchString && searchedFriends.length > 0 ? (
            // Search pagination
            currentPage < maxPages - 1 && (
              <TouchableOpacity
                onPress={loadMoreSearch}
                style={{
                  backgroundColor: colors.appPrimaryColor,
                  paddingHorizontal: responsiveWidth(4),
                  paddingVertical: responsiveHeight(2),
                  borderRadius: responsiveWidth(2),
                  marginTop: responsiveHeight(2),
                  alignItems: 'center',
                }}>
                <Text style={{color: '#ffffff', fontSize: 14, fontWeight: 'bold'}}>
                  Mehr Suchergebnisse laden ({currentPage + 1}/{maxPages})
                </Text>
              </TouchableOpacity>
            )
          ) : (
            // Regular pagination
            users.length >= 20 && lastDoc && (
              <TouchableOpacity
                onPress={loadMore}
                style={{
                  backgroundColor: colors.appPrimaryColor,
                  paddingHorizontal: responsiveWidth(4),
                  paddingVertical: responsiveHeight(2),
                  borderRadius: responsiveWidth(2),
                  marginTop: responsiveHeight(2),
                  alignItems: 'center',
                }}>
                <Text style={{color: '#ffffff', fontSize: 14, fontWeight: 'bold'}}>
                  {t('LOAD_MORE')}
                </Text>
              </TouchableOpacity>
            )
          )}
        </Wrapper>
      </ScrollView>
    </Wrapper>
  );
} 