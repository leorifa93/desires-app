import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Text, Wrapper, Icons } from '../../components';
import { colors, appStyles, responsiveWidth, responsiveHeight } from '../../services';
import { scale } from 'react-native-size-matters';
import callMinutesService from '../../services/callMinutesService';
import firestore from '@react-native-firebase/firestore';

const CALL_MINUTES_PACKAGES = [
  { id: 1, minutes: 10, coinsPrice: 10, isChecked: false },
  { id: 2, minutes: 30, coinsPrice: 25, isChecked: false },
  { id: 3, minutes: 60, coinsPrice: 45, isChecked: false },
  { id: 4, minutes: 120, coinsPrice: 80, isChecked: false },
];

export default function CallMinutesShopModal({ visible, onClose, onSuccess }) {
  const { t } = useTranslation();
  const user = useSelector(state => state.auth.user);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);

  const availableCoins = user?.availableCoins || 0;
  const availableMinutes = callMinutesService.getAvailableMinutes(user);

  const selectPackage = (pkg) => {
    setSelectedPackage(pkg);
  };

  const buyMinutes = async () => {
    console.log('CallMinutesShop: buyMinutes called');
    console.log('CallMinutesShop: selectedPackage:', selectedPackage);
    
    if (!selectedPackage) {
      console.log('CallMinutesShop: No package selected!');
      Alert.alert(t('ERROR'), 'Please select a package');
      return;
    }

    // Check if user has enough coins
    if (availableCoins < selectedPackage.coinsPrice) {
      // Navigate to coins shop
      Alert.alert(
        t('NOT_ENOUGH_COINS_TITLE'),
        t('NOT_ENOUGH_COINS_MESSAGE'),
        [
          {
            text: t('BUY_COINS'),
            onPress: () => {
              onClose();
              // Navigate to coins shop
              const { navigate } = require('../../navigation/rootNavigation');
              const { routes } = require('../../services/constants');
              navigate(routes.buyCoins);
            },
          },
          {
            text: t('CANCEL'),
            style: 'cancel',
          },
        ]
      );
      return;
    }

    setLoading(true);

    try {
      // Deduct coins and add minutes
      const firestore = require('@react-native-firebase/firestore').default;
      
      console.log('CallMinutesShop: Starting transaction for user:', user.id);
      console.log('CallMinutesShop: Package:', selectedPackage);
      
      await firestore().runTransaction(async (transaction) => {
        const userRef = firestore().collection('Users').doc(user.id);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const currentCoins = userData.availableCoins || 0;
        const currentMinutes = userData.availableCallMinutes || 0;

        console.log('CallMinutesShop: Current coins:', currentCoins);
        console.log('CallMinutesShop: Current minutes:', currentMinutes);
        console.log('CallMinutesShop: Package price:', selectedPackage.coinsPrice);

        if (currentCoins < selectedPackage.coinsPrice) {
          throw new Error('Not enough coins');
        }

        const newCoins = currentCoins - selectedPackage.coinsPrice;
        const newMinutes = (typeof currentMinutes === 'string' ? parseInt(currentMinutes) : currentMinutes) + selectedPackage.minutes;

        console.log('CallMinutesShop: New coins:', newCoins);
        console.log('CallMinutesShop: New minutes:', newMinutes);

        transaction.update(userRef, {
          availableCoins: newCoins,
          availableCallMinutes: newMinutes,
        });

        // Add to wallet history
        const walletRef = firestore().collection('wallet').doc();
        transaction.set(walletRef, {
          createdOn: Date.now(),
          activity: 'BOUGHT_CALL_MINUTES',
          isRevenue: true,
          userId: user.id,
          amount: selectedPackage.minutes,
          coinsPrice: selectedPackage.coinsPrice,
        });
      });

      console.log('CallMinutesShop: Transaction completed successfully!');
      console.log('CallMinutesShop: Purchased', selectedPackage.minutes, 'minutes for', selectedPackage.coinsPrice, 'coins');
      
      // Add history record to Wallet collection (like old project)
      try {
        const history = {
          createdOn: Date.now(),
          activity: 'BOUGHTFREEMINUTES', // Same as old project: CoinActivity.BoughtFreeMinutes
          isRevenue: false, // This is an expense (coins spent)
          userId: user.id,
          amount: selectedPackage.coinsPrice, // Amount of COINS spent (not minutes)
        };
        
        await firestore().collection('Wallet').add(history);
        console.log('CallMinutesShop: History record added to Wallet collection');
      } catch (error) {
        console.error('CallMinutesShop: Failed to add history record:', error);
        // Don't fail the whole purchase if history fails
      }
      
      // Redux will be automatically updated by the user snapshot listener in auth.js
      
      // Show success message
      Alert.alert(
        t('SUCCESS'),
        `${selectedPackage.minutes} ${t('MINUTES')} ${t('ADDED')}`,
        [{ text: 'OK' }]
      );
      
      if (onSuccess) {
        onSuccess(selectedPackage.minutes);
      }
      
      onClose();
    } catch (error) {
      console.error('CallMinutesShop: Error purchasing minutes:', error);
      console.error('CallMinutesShop: Error details:', error.message);
      Alert.alert(t('ERROR'), t('PURCHASE_ERROR') + '\n' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.modalContent}>
          {/* Header */}
          <Wrapper
            flexDirectionRow
            alignItemsCenter
            justifyContentSpaceBetween
            marginHorizontalBase
            style={{ paddingTop: scale(15) }}
          >
            <Text isMediumFont style={styles.title}>
              {t('BUY_CALL_MINUTES')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </Wrapper>

          {/* Balance Info */}
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceText}>
              {t('AVAILABLE_COINS')}: <Text isBoldFont>{availableCoins}</Text> Coins
            </Text>
            <Text style={styles.balanceText}>
              {t('AVAILABLE_CALL_MINUTES')}: <Text isBoldFont>{availableMinutes}</Text> {t('MINUTES')}
            </Text>
          </View>

          {/* Info Text */}
          <View style={{ paddingHorizontal: scale(20), paddingVertical: scale(10) }}>
            <Text isSmall isRegularFont style={{ textAlign: 'center', color: colors.appTextColor3 }}>
              {t('CALL_MINUTES_INFO')}
            </Text>
          </View>

          {/* Packages */}
          <ScrollView style={styles.packagesContainer}>
            {CALL_MINUTES_PACKAGES.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageItem,
                  selectedPackage?.id === pkg.id && styles.packageItemSelected,
                ]}
                onPress={() => selectPackage(pkg)}
              >
                <View style={styles.packageInfo}>
                  <Text isMediumFont style={styles.packageMinutes}>
                    {pkg.minutes} {t('MINUTES')}
                  </Text>
                  <Text isSmall style={styles.packagePrice}>
                    {pkg.coinsPrice} Coins
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    selectedPackage?.id === pkg.id && styles.checkboxSelected,
                  ]}
                >
                  {selectedPackage?.id === pkg.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Buy Button */}
          {selectedPackage && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.buyButton,
                  loading && styles.buyButtonDisabled,
                ]}
                onPress={buyMinutes}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text isMediumFont style={styles.buyButtonText}>
                    {selectedPackage.coinsPrice} Coins {t('REDEEM')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.appBgColor1,
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    maxHeight: '80%',
  },
  title: {
    fontSize: scale(20),
    color: colors.appPrimaryColor,
    fontWeight: 'bold',
  },
  balanceContainer: {
    alignItems: 'center',
    paddingVertical: scale(15),
    marginHorizontal: scale(20),
    marginTop: scale(10),
    backgroundColor: colors.appBgColor2,
    borderRadius: scale(10),
  },
  balanceText: {
    fontSize: scale(14),
    color: colors.appTextColor2,
    marginVertical: scale(3),
  },
  packagesContainer: {
    paddingHorizontal: scale(20),
    maxHeight: responsiveHeight(40),
  },
  packageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(15),
    marginVertical: scale(8),
    borderRadius: scale(10),
    borderWidth: 2,
    borderColor: colors.appBgColor3,
    backgroundColor: colors.appBgColor2,
  },
  packageItemSelected: {
    borderColor: colors.appPrimaryColor,
    backgroundColor: 'rgba(198, 19, 35, 0.1)',
  },
  packageInfo: {
    flex: 1,
  },
  packageMinutes: {
    fontSize: scale(16),
    color: colors.appTextColor1,
  },
  packagePrice: {
    fontSize: scale(14),
    color: colors.appTextColor3,
    marginTop: scale(3),
  },
  checkbox: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: colors.appTextColor3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.appPrimaryColor,
    borderColor: colors.appPrimaryColor,
  },
  checkmark: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  buttonContainer: {
    padding: scale(20),
    paddingBottom: scale(30),
  },
  buyButton: {
    backgroundColor: colors.appPrimaryColor,
    padding: scale(15),
    borderRadius: scale(10),
    alignItems: 'center',
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: scale(16),
  },
  closeButton: {
    width: scale(30),
    height: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: scale(30),
    color: colors.appTextColor2,
    lineHeight: scale(30),
  },
});

