import React, {useState, useEffect} from 'react';
import {
  Buttons,
  Cards,
  Headers,
  Spacer,
  StatusBars,
  Text,
  Wrapper,
} from '../../../components';
import {scale, verticalScale} from 'react-native-size-matters';
import {responsiveWidth, sizes, colors, appStyles, responsiveHeight} from '../../../services';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {goBack, navigate} from '../../../navigation/rootNavigation';
import {Alert, ScrollView, TouchableOpacity, View} from 'react-native';
import firestore from '@react-native-firebase/firestore';
// CoinActivity values defined locally since the enum file doesn't exist
const CoinActivity = {
  BoughtCoins: 'BOUGHTCOINS',
  Subscription: 'SUBSCRIPTION'
};

export default function Index() {
  const {t} = useTranslation();
  const user = useSelector(state => state.auth.user);
  
  const [selectedRange, setSelectedRange] = useState('today');
  const [totalUsers, setTotalUsers] = useState(0);
  const [signOutCount, setSignOutCount] = useState(0);
  const [deletionCount, setDeletionCount] = useState(0);
  const [pendingImageReviews, setPendingImageReviews] = useState(0);
  const [salesVolume, setSalesVolume] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const timeRanges = [
    {value: 'today', label: t('TODAY')},
    {value: '24h', label: '24h'},
    {value: '7d', label: t('7_DAYS')},
    {value: '30d', label: t('30_DAYS')},
    {value: 'total', label: t('TOTAL')},
  ];

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, selectedRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);

    try {
      const now = Date.now();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartMillis = todayStart.getTime();

      // For collections that use Number timestamps (like ImageProofQueue, DeactivatedUserHistory, DeletedUserHistory)
      const timePeriodsNumber = {
        'today': todayStartMillis,
        '24h': now - 24 * 60 * 60 * 1000,
        '7d': now - 7 * 24 * 60 * 60 * 1000,
        '30d': now - 30 * 24 * 60 * 60 * 1000,
      };

      // For collections that use Firestore Timestamps (like Users)
      const timePeriodsTimestamp = {
        'today': firestore.Timestamp.fromDate(todayStart),
        '24h': firestore.Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
        '7d': firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        '30d': firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      };

      const selectedStartTimeNumber = selectedRange === 'total' ? null : (timePeriodsNumber[selectedRange] || null);
      const selectedStartTimeTimestamp = selectedRange === 'total' ? null : (timePeriodsTimestamp[selectedRange] || null);

      console.log('Loading dashboard data for range:', selectedRange, 'startTimeNumber:', selectedStartTimeNumber, 'startTimeTimestamp:', selectedStartTimeTimestamp);

      // Users uses Firestore Timestamp
      const totalUsersCount = await getCount('Users', 'createdOn', selectedStartTimeTimestamp, 'timestamp');
      // These collections use Number timestamps
      const signOutCountValue = await getCount('DeactivatedUserHistory', 'createdAt', selectedStartTimeNumber, 'number');
      const deletionCountValue = await getCount('DeletedUserHistory', 'createdAt', selectedStartTimeNumber, 'number');
      const pendingImageReviewsValue = await getCount('ImageProofQueue', 'uploadAt', selectedStartTimeNumber, 'number');
      const salesVolumeValue = await getSalesVolume(selectedStartTimeNumber);

      console.log('Dashboard data loaded:', {
        totalUsers: totalUsersCount,
        signOutCount: signOutCountValue,
        deletionCount: deletionCountValue,
        pendingImageReviews: pendingImageReviewsValue,
        salesVolume: salesVolumeValue
      });

      setTotalUsers(totalUsersCount);
      setSignOutCount(signOutCountValue);
      setDeletionCount(deletionCountValue);
      setPendingImageReviews(pendingImageReviewsValue);
      setSalesVolume(salesVolumeValue);

      // Fallback: If any value is undefined or null, set it to 0
      if (totalUsersCount === undefined || totalUsersCount === null) setTotalUsers(0);
      if (signOutCountValue === undefined || signOutCountValue === null) setSignOutCount(0);
      if (deletionCountValue === undefined || deletionCountValue === null) setDeletionCount(0);
      if (pendingImageReviewsValue === undefined || pendingImageReviewsValue === null) setPendingImageReviews(0);
      if (salesVolumeValue === undefined || salesVolumeValue === null) setSalesVolume('0.00$');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert(t('ERROR'), t('ERROR_LOADING_DASHBOARD'));
    } finally {
      setIsLoading(false);
    }
  };

  const getCount = async (collectionName, field, startTime, timeType = 'timestamp') => {
    try {
      console.log(`Getting count for ${collectionName}, field: ${field}, startTime: ${startTime}, timeType: ${timeType}`);
      let query = firestore().collection(collectionName);
      
      // Build query conditions
      if (collectionName === 'Users') {
        // For Users collection, we need to handle both time filter and status filter
        if (startTime) {
          query = query.where(field, '>=', startTime).where('status', '!=', 4);
          console.log(`Added time filter: ${field} >= ${startTime} and status != 4`);
        } else {
          query = query.where('status', '!=', 4);
          console.log('Added Users status filter: status != 4 (no time filter)');
        }
      } else {
        // For other collections, just add time filter if provided
        if (startTime) {
          // Convert Number timestamp to Firestore Timestamp if needed, or use as-is for number fields
          const filterValue = timeType === 'number' ? startTime : startTime;
          query = query.where(field, '>=', filterValue);
          console.log(`Added time filter: ${field} >= ${filterValue} (type: ${timeType})`);
        }
      }
      
      const snapshot = await query.get();
      const count = snapshot.size;
      console.log(`Collection ${collectionName} count: ${count}`);
      return count;
    } catch (error) {
      console.error(`Error getting count for ${collectionName}:`, error);
      console.error('Error details:', error.message, error.code);
      return 0;
    }
  };

  const getSalesVolume = async (startTime) => {
    try {
      console.log('Getting sales volume, startTime:', startTime);
      let query = firestore().collection('Wallet');
      
      if (startTime) {
        // Wallet uses Number timestamps
        query = query.where('createdOn', '>=', startTime);
        console.log('Added time filter: createdOn >=', startTime, '(number)');
      }
      
      query = query.where('activity', 'in', [CoinActivity.BoughtCoins, CoinActivity.Subscription]);
      console.log('Added activity filter for:', [CoinActivity.BoughtCoins, CoinActivity.Subscription]);
      
      const snapshot = await query.get();
      console.log('Wallet collection snapshot size:', snapshot.size);
      let totalPrice = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('Wallet document:', { id: doc.id, activity: data.activity, price: data.price, amount: data.amount });
        
        if (data.price && data.activity !== CoinActivity.BoughtCoins) {
          if (typeof data.price === 'number') {
            data.price = data.price / 1000;
            data.price = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(data.price);
          }

          const numericPrice = parseFloat(data.price.replace('$', '').replace(',', '.'));
          if (!isNaN(numericPrice)) {
            totalPrice += numericPrice;
            console.log('Added price:', numericPrice, 'total now:', totalPrice);
          }
        } else {
          const coinPrice = getCoinPrice(data.amount);
          totalPrice += coinPrice;
          console.log('Added coin price:', coinPrice, 'for amount:', data.amount, 'total now:', totalPrice);
        }
      });

      const result = totalPrice.toFixed(2) + '$';
      console.log('Final sales volume result:', result);
      return result;
    } catch (error) {
      console.error('Error getting sales volume:', error);
      return '0.00$';
    }
  };

  const getCoinPrice = (amount) => {
    const packages = [
      { amount: 1, price: 2.90, pricePerCoin: "2.90", isChecked: false, productKey: '1_Coin' },
      { amount: 5, price: 9, pricePerCoin: "1.80", isChecked: false, productKey: '5_Coins' },
      { amount: 10, price: 19, pricePerCoin: "1.90", isChecked: false, productKey: '10_Coins' },
      { amount: 20, price: 29, pricePerCoin: "1.50", isChecked: false, productKey: '20Coins' },
      { amount: 30, price: 39, pricePerCoin: "1.30", isChecked: false, productKey: '30Coins' },
      { amount: 50, price: 69, pricePerCoin: "1.40", isChecked: false, productKey: '50Coins' },
      { amount: 100, price: 119, pricePerCoin: "1.20", isChecked: false, productKey: '100Coins' },
      { amount: 200, price: 199, pricePerCoin: "1.00", isChecked: false, productKey: '200Coins' },
      { amount: 300, price: 269, pricePerCoin: "0.90", isChecked: false, productKey: '300Coins' },
      { amount: 500, price: 399, pricePerCoin: "0.80", isChecked: false, productKey: '500Coins' },
    ];

    for (let p of packages) {
      if (amount === p.amount) {
        return p.price;
      }
    }

    return 0;
  };

  const show = (page) => {
    navigate(`backend-${page}`);
  };

  const renderTimeRangeSelector = () => (
    <Wrapper marginVerticalBase>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Wrapper flexDirectionRow>
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range.value}
              onPress={() => setSelectedRange(range.value)}
              style={{
                paddingHorizontal: responsiveWidth(4),
                paddingVertical: responsiveHeight(1.5),
                marginHorizontal: responsiveWidth(1),
                borderRadius: responsiveWidth(2),
                backgroundColor: selectedRange === range.value ? colors.appPrimaryColor : colors.appBorderColor2,
              }}>
              <Text
                style={{
                  color: selectedRange === range.value ? colors.appBgColor1 : colors.appTextColor1,
                  fontSize: 14,
                  fontWeight: selectedRange === range.value ? 'bold' : 'normal',
                }}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Wrapper>
      </ScrollView>
    </Wrapper>
  );

  const renderStatCard = (title, value, icon = null) => (
    <Wrapper
      style={{
        backgroundColor: colors.appBgColor1,
        borderRadius: responsiveWidth(3),
        padding: responsiveWidth(4),
        margin: responsiveWidth(2),
        shadowColor: colors.appTextColor1,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        minWidth: responsiveWidth(40),
      }}>
      <Text isSmall isTextColor2 style={{marginBottom: responsiveHeight(1)}}>
        {title}
      </Text>
      <Text isBoldFont style={{fontSize: 24, color: colors.appPrimaryColor}}>
        {value}
      </Text>
    </Wrapper>
  );

  const renderMenuButton = (title, onPress) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.appBgColor1,
        padding: responsiveWidth(4),
        margin: responsiveWidth(2),
        borderRadius: responsiveWidth(2),
        borderWidth: 1,
        borderColor: colors.appBorderColor2,
      }}>
      <Text isRegular isRegularFont style={{textAlign: 'center'}}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Wrapper isMain>
      <StatusBars.Dark />
      <Headers.Primary showBackArrow title={t('BACKEND')} />
      
      {isLoading && (
        <Wrapper
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: colors.appPrimaryColor,
            zIndex: 1000,
          }}
        />
      )}
      
      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
        <Wrapper marginHorizontalBase>
          <Text isBoldFont style={{fontSize: 24, marginBottom: responsiveHeight(2)}}>
            {t('WELCOME_TO_DASHBOARD')}
          </Text>
          
          {renderTimeRangeSelector()}
          
          {/* Statistics Section */}
          <Wrapper>
            <Text isBoldFont style={{fontSize: 18, marginBottom: responsiveHeight(2)}}>
              {t('STATISTICS') || 'Statistics'}
            </Text>
            

            
            {/* Statistics in a horizontal scrollable layout */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{paddingRight: responsiveWidth(4)}}
              style={{marginBottom: responsiveHeight(2)}}>
              <Wrapper style={{marginRight: responsiveWidth(2)}}>
                {renderStatCard(t('TOTAL_USERS'), totalUsers || 0)}
              </Wrapper>
              <Wrapper style={{marginRight: responsiveWidth(2)}}>
                {renderStatCard(t('SIGNOUTS_BY_SUPPORT'), signOutCount || 0)}
              </Wrapper>
              <Wrapper style={{marginRight: responsiveWidth(2)}}>
                {renderStatCard(t('SIGNOUTS_BY_USER'), deletionCount || 0)}
              </Wrapper>
              <Wrapper style={{marginRight: responsiveWidth(2)}}>
                {renderStatCard(t('PENDING_IMAGE_REVIEWS'), pendingImageReviews || 0)}
              </Wrapper>
              <Wrapper style={{marginRight: responsiveWidth(2)}}>
                {renderStatCard(t('SALES_VOLUME'), salesVolume || '0.00$')}
              </Wrapper>
            </ScrollView>
          </Wrapper>
          
          <Spacer isDoubleBase />
          
          {/* Menu Buttons */}
          <Text isBoldFont style={{fontSize: 18, marginBottom: responsiveHeight(2)}}>
            {t('ADMIN_FUNCTIONS')}
          </Text>
          
          {renderMenuButton(t('IMAGEPROOF'), () => show('image-proof'))}
          {renderMenuButton(t('SELLHISTORY'), () => show('sell-history'))}
          {renderMenuButton(t('ALLUSERS'), () => show('all-users'))}
          {renderMenuButton('Dexxire Chats', () => show('demo-chats'))}
        </Wrapper>
      </ScrollView>
    </Wrapper>
  );
} 