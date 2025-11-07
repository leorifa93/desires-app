import React, { useState, useEffect, useRef } from 'react';
import {
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  View,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  Wrapper,
  Headers,
  Text,
  Spacer,
  Images,
  Icons,
} from '../../../components';
import {
  colors,
  responsiveWidth,
  fontSizes,
  appFonts,
  appIcons,
} from '../../../services';
import { scale } from 'react-native-size-matters';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { navigate } from '../../../navigation/rootNavigation';
import { routes } from '../../../services/constants';
import algoliasearch from 'algoliasearch/lite';
import Svg, { Path, Circle } from 'react-native-svg';

const ALGOLIA_APP_ID = '31Z41D9XBM';
const ALGOLIA_API_KEY = '428f4e96bcad9ab5952c394413f5b2f2';

// Search Icon Component
const SearchIcon = ({ size = 24, color = '#272829' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 20C15.9706 20 20 15.9706 20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.9299 20.6898C19.4599 22.2898 20.6699 22.4498 21.5999 21.0498C22.4499 19.7698 21.8899 18.7198 20.3499 18.7198C19.2099 18.7098 18.5699 19.5998 18.9299 20.6898Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Close Circle Icon Component
const CloseCircleIcon = ({ size = 24, color = '#272829' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} opacity="0.2" />
    <Path
      d="M15 9L9 15M9 9L15 15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Chevron Forward Icon Component
const ChevronForwardIcon = ({ size = 24, color = '#272829' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Sad Face Icon Component
const SadFaceIcon = ({ size = 24, color = '#272829' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke={color} 
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 15C8 15 9.5 13 12 13C14.5 13 16 15 16 15"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="9" cy="9" r="1" fill={color} />
    <Circle cx="15" cy="9" r="1" fill={color} />
  </Svg>
);

const UserSearch = () => {
  const { t } = useTranslation();
  const me = useSelector(state => state.auth.user);
  const [searchString, setSearchString] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [maxPages, setMaxPages] = useState(0);
  const searchTimeoutRef = useRef(null);
  const searchClientRef = useRef(null);
  const indexRef = useRef(null);

  useEffect(() => {
    // Initialize Algolia client
    searchClientRef.current = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
    indexRef.current = searchClientRef.current.initIndex('dexxire');
    
    // Note: setSettings is not needed on client-side in Algolia v4
    // Settings should be configured in Algolia dashboard or via admin API
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const search = async (page = 0) => {
    if (!searchString.trim() || !indexRef.current || !me) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      
      console.log('=== SEARCH STARTING ===');
      console.log('My ID:', me.id);
      console.log('My Gender:', me.gender);
      console.log('My genderLookingFor:', me.genderLookingFor);
      console.log('Is Admin:', me.isAdmin);
      
      // Algolia v4 API - search only in username field, not in location/city
      const response = await indexRef.current.search(searchString, {
        page: page,
        hitsPerPage: 20,
        restrictSearchableAttributes: ['username'],
      });

      console.log('Total results from Algolia:', response.hits.length);

      // Filter users based on MY gender preferences only (not bidirectional)
      const filteredUsers = response.hits.filter(user => {
        // Don't show myself in results
        if (user.objectID === me.id || user.id === me.id) {
          console.log('❌ Filtered out (myself):', user.username);
          return false;
        }
        
        // Admin sees all users
        if (me.isAdmin) {
          console.log('✅ Admin - showing all:', user.username);
          return true;
        }
        
        // Ensure genderLookingFor is an array
        if (!Array.isArray(me.genderLookingFor) || me.genderLookingFor.length === 0) {
          console.log('⚠️ genderLookingFor is empty or not an array!');
          return false;
        }
        
        // Convert user.gender to number if it's a string
        const userGender = typeof user.gender === 'string' ? parseInt(user.gender, 10) : user.gender;
        
        // Check if user's gender is in my preferences
        const matches = me.genderLookingFor.includes(userGender);
        
        console.log(matches ? '✅' : '❌', 'User:', user.username, 
                    '| Gender:', userGender, 
                    '| Looking for:', me.genderLookingFor,
                    '| Match:', matches);
        
        return matches;
      });
      
      console.log('Filtered results:', filteredUsers.length);
      console.log('=== SEARCH DONE ===');

      if (page === 0) {
        setSearchResults(filteredUsers);
      } else {
        // Merge results and remove duplicates by objectID or id
        setSearchResults(prev => {
          const newUsers = filteredUsers.filter(newUser => {
            const newUserId = newUser.objectID || newUser.id;
            return !prev.some(existingUser => 
              (existingUser.objectID || existingUser.id) === newUserId
            );
          });
          return [...prev, ...newUsers];
        });
      }
      
      setMaxPages(response.nbPages);
      setCurrentPage(response.page);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text) => {
    setSearchString(text);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (text.trim()) {
        search(0);
      } else {
        setSearchResults([]);
        setCurrentPage(0);
        setMaxPages(0);
      }
    }, 300);
  };

  const loadMore = () => {
    if (currentPage < maxPages - 1 && !loading) {
      search(currentPage + 1);
    }
  };

  const showProfile = (user) => {
    // Algolia uses objectID, but we need to use 'id' for our app
    const userId = user.id || user.objectID;
    navigate(routes.userProfile, {
      userId: userId,
      visiterProfile: user,
    });
  };

  const renderUserItem = ({ item }) => {
    const profileImage = item.profilePictures?.thumbnails?.small || item.profilePictures?.small;
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => showProfile(item)}>
        <Images.Round
          source={
            profileImage
              ? { uri: profileImage }
              : require('../../../assets/images/no-image.png')
          }
          size={scale(56)}
        />
        <View style={styles.userInfo}>
          <Text
            style={styles.username}>
            {item.username || 'Unknown'}
          </Text>
          {item.location?.location && (
            <Text
              style={styles.location}
              numberOfLines={1}>
              {item.location.location}
            </Text>
          )}
        </View>
        <ChevronForwardIcon
          size={scale(24)}
          color={colors.appTextColor2}
        />
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    if (!searchString.trim()) {
      return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.emptyContainer}>
            <SearchIcon
              size={scale(64)}
              color={colors.appTextColor3}
              style={{ opacity: 0.5 }}
            />
            <Spacer isSmall />
            <Text
              style={styles.emptyText}>
              {t('SEARCHFORUSERS') || 'Search for users by username'}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      );
    }
    
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.emptyContainer}>
          <SadFaceIcon
            size={scale(64)}
            color={colors.appTextColor3}
            style={{ opacity: 0.5 }}
          />
          <Spacer isSmall />
          <Text
            style={styles.emptyText}>
            {t('NOUSERFOUND') || 'No users found'}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const renderFooter = () => {
    if (!loading || currentPage === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.appPrimaryColor} />
      </View>
    );
  };

  return (
    <Wrapper isMain backgroundColor={colors.appBgColor1}>
      <Headers.Primary showBackArrow title={t('SEARCH') || 'Search'} />
      <Spacer isSmall />
      
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <SearchIcon
          size={scale(20)}
          color={colors.appTextColor2}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t('SEARCHBYUSERNAME') || 'Search by username...'}
          placeholderTextColor={colors.appTextColor3}
          value={searchString}
          onChangeText={handleSearchChange}
          autoFocus={true}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchString.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchString('');
              setSearchResults([]);
            }}
            style={styles.clearButton}>
            <CloseCircleIcon
              size={scale(20)}
              color={colors.appTextColor2}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading indicator for initial search */}
      {loading && currentPage === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.appPrimaryColor} />
        </View>
      )}

      {/* Results List */}
      <FlatList
        data={searchResults}
        renderItem={renderUserItem}
        keyExtractor={(item, index) => {
          // Use objectID from Algolia first, then id, then index
          const key = item.objectID || item.id || `user-${index}`;
          return `${key}-${index}`; // Ensure uniqueness by combining with index
        }}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          searchResults.length === 0 ? styles.emptyListContent : styles.listContent
        }
      />
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.appBgColor2,
    marginHorizontal: responsiveWidth(4),
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    height: scale(48),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.regular,
    fontFamily: appFonts.appTextRegular,
    color: colors.appTextColor1,
    padding: 0,
  },
  clearButton: {
    padding: scale(4),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: scale(8),
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(10),
  },
  emptyText: {
    fontSize: fontSizes.regular,
    fontFamily: appFonts.appTextRegular,
    color: colors.appTextColor2,
    textAlign: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.appBorderColor2,
  },
  userInfo: {
    flex: 1,
    marginLeft: scale(12),
  },
  username: {
    fontSize: fontSizes.medium,
    fontFamily: appFonts.appTextMedium,
    color: colors.appTextColor1,
  },
  footerLoader: {
    paddingVertical: scale(20),
    alignItems: 'center',
  },
});

export default UserSearch;

