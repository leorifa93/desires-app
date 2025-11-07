import React, {useState, useEffect} from 'react';
import {Alert, ScrollView, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import firestore from '@react-native-firebase/firestore';
import {colors} from '../../../../services/utilities/colors';
import {routes} from '../../../../services/constants';
import {responsiveHeight, responsiveWidth} from '../../../../services/utilities/responsive';
import {Wrapper, Text, StatusBars, Headers} from '../../../../components';
import {Spacer} from '../../../../components';

export default function BackendSellHistory() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistories();
  }, []);

  const loadHistories = async () => {
    try {
      setLoading(true);
      console.log('Loading sell histories...');
      
      // Get all coin activities from Wallet collection (like in old project)
      const historiesSnapshot = await firestore()
        .collection('Wallet')
        .where('activity', 'in', ['BOUGHTCOINS', 'SUBSCRIPTION'])
        .orderBy('createdOn', 'desc')
        .limit(50)
        .get();

      const historiesData = [];
      
      for (const doc of historiesSnapshot.docs) {
        const history = doc.data();
        history.id = doc.id;
        
        // Get user data for each history entry
        if (history.userId) {
          try {
            const userDoc = await firestore().collection('Users').doc(history.userId).get();
            if (userDoc.exists) {
              history.user = userDoc.data();
              history.user.id = userDoc.id;
            }
          } catch (error) {
            console.error('Error loading user for history:', history.userId, error);
          }
        }
        
        historiesData.push(history);
      }
      
      console.log('Loaded histories:', historiesData.length);
      setHistories(historiesData);
    } catch (error) {
      console.error('Error loading histories:', error);
      Alert.alert(t('ERROR'), t('ERROR_LOADING_DATA'));
    } finally {
      setLoading(false);
    }
  };

  const showProfile = (userId) => {
    if (userId) {
      console.log('Navigating to profile with userId:', userId);
      navigation.navigate(routes.userProfile, {
        visiterProfile: true, 
        userId: userId
      });
    } else {
      console.log('No userId provided for profile navigation');
    }
  };

  const getDollarPrice = (history) => {
    if (history.activity !== 'BOUGHTCOINS') {
      if (typeof history.price === 'number') {
        const priceInDollars = history.price / 1000;
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(priceInDollars);
      }
      return history.price;
    } else {
      return getCoinPrice(history.amount);
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
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(p.price);
      }
    }

    return 0;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      // Firestore Timestamp object
      date = new Date(timestamp.seconds * 1000);
    } else {
      // Regular date
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ', ' + date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityText = (history) => {
    let activityText = t(history.activity) || history.activity;
    
    if (history.payload?.subtype) {
      activityText += ' | ' + history.payload.subtype;
    }
    
    return activityText;
  };

  const renderHistoryItem = (history, index) => {
    const isRevenue = history.isRevenue;
    
    return (
      <TouchableOpacity
        key={history.id || index}
        onPress={() => showProfile(history.userId)}
        style={{
          flexDirection: 'row',
          backgroundColor: isRevenue ? 'rgba(76, 175, 80, 0.1)' : 'rgba(198, 19, 35, 0.1)',
          paddingVertical: responsiveHeight(1.5),
          paddingHorizontal: responsiveWidth(2),
          marginVertical: responsiveHeight(0.5),
          borderRadius: responsiveWidth(2),
          borderLeftWidth: 4,
          borderLeftColor: isRevenue ? '#4CAF50' : '#C61323',
        }}>
        
        {/* Date */}
        <Wrapper style={{flex: 1, minWidth: responsiveWidth(20)}}>
          <Text style={{fontSize: 12, color: colors.appTextColor2}}>
            {formatDate(history.createdOn)}
          </Text>
        </Wrapper>
        
        {/* Activity */}
        <Wrapper style={{flex: 1.5, minWidth: responsiveWidth(25)}}>
          <Text style={{fontSize: 12, color: colors.appTextColor1}}>
            {getActivityText(history)}
          </Text>
        </Wrapper>
        
        {/* Revenue/Output */}
        <Wrapper style={{flex: 1, minWidth: responsiveWidth(20), alignItems: 'center'}}>
          <Text style={{
            fontSize: 12, 
            fontWeight: 'bold',
            color: isRevenue ? '#4CAF50' : '#C61323'
          }}>
            {getDollarPrice(history)}
          </Text>
        </Wrapper>
        
        {/* Provider */}
        <Wrapper style={{flex: 1, minWidth: responsiveWidth(20)}}>
          <Text style={{fontSize: 12, color: colors.appTextColor2}}>
            {t(history.provider) || history.provider || 'N/A'}
          </Text>
        </Wrapper>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <Wrapper isMain>
        <StatusBars.Dark />
        <Headers.Primary
          showBackArrow
          title={t('SELLHISTORY')}
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
        title={t('SELLHISTORY')}
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Wrapper marginHorizontalBase>
          {/* Header */}
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
          }}>
            <Wrapper style={{flex: 1, minWidth: responsiveWidth(20)}}>
              <Text isBoldFont style={{fontSize: 14, color: colors.appTextColor1}}>
                {t('DATE')}
              </Text>
            </Wrapper>
            <Wrapper style={{flex: 1.5, minWidth: responsiveWidth(25)}}>
              <Text isBoldFont style={{fontSize: 14, color: colors.appTextColor1}}>
                {t('ACTIVITY')}
              </Text>
            </Wrapper>
            <Wrapper style={{flex: 1, minWidth: responsiveWidth(20), alignItems: 'center'}}>
              <Text isBoldFont style={{fontSize: 14, color: colors.appTextColor1}}>
                {t('REVENUEOUTPUT')}
              </Text>
            </Wrapper>
            <Wrapper style={{flex: 1, minWidth: responsiveWidth(20)}}>
              <Text isBoldFont style={{fontSize: 14, color: colors.appTextColor1}}>
                {t('PROVIDER')}
              </Text>
            </Wrapper>
          </Wrapper>

          {/* History Items */}
          {histories.length > 0 ? (
            histories.map((history, index) => renderHistoryItem(history, index))
          ) : (
            <Wrapper justifyContentCenter alignItemsCenter style={{marginTop: responsiveHeight(20)}}>
              <Text isMedium isBoldFont alignTextCenter>
                {t('NO_HISTORIES')}
              </Text>
            </Wrapper>
          )}
        </Wrapper>
      </ScrollView>
    </Wrapper>
  );
} 