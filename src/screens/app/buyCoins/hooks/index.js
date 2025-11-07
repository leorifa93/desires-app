import {useMemo, useState, useEffect} from 'react';
import {appIcons, purchaseService} from '../../../../services';
import {useTranslation} from 'react-i18next';
import {Alert} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import {setUser} from '../../../../store/reducers/auth';

// Temporäre Product IDs für Fallback
const PRODUCT_IDS = {
  COIN_1: '001_coin',
  COIN_5: '005_coins',
  COIN_10: '010_coins',
  COIN_20: '020_coins',
  COIN_30: '030_coins',
  COIN_50: '050_coins',
  COIN_100: '100_coins',
  COIN_200: '200_coins',
  COIN_300: '300_coins',
  COIN_500: '500_coins',
};

// Helper function to extract coins from product ID
const getCoinsFromProductId = (productId) => {
  const match = productId.match(/^0*(\d+)_coin[s]?$/);
  if (match) return parseInt(match[1], 10);
  return 1; // Default
};

export function useHooks() {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Lade Produkte beim Mount
  useEffect(() => {
    loadProducts();
    
    // Cleanup beim Unmount
    return () => {
      purchaseService.cleanup();
    };
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Versuche echte Produkte vom Store zu laden
      try {
        const storeProducts = await purchaseService.loadProducts();
        if (storeProducts && storeProducts.length > 0) {
          // Echte Produkte vom Store verwenden
          const formattedProducts = storeProducts
            .map(product => ({
              id: product.productId,
              productId: product.productId,
              title: product.title,
              price: product.localizedPrice,
              priceAmount: product.price,
              coins: getCoinsFromProductId(product.productId),
              customIcon: appIcons.DollarCircle,
            }))
            .sort((a, b) => a.coins - b.coins); // Sortiert aufsteigend nach Coins
          setProducts(formattedProducts);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log('Store products not available, using fallback:', error);
      }
      
      // Fallback-Daten für Demo-Zwecke
      const fallbackData = [
        {
          id: PRODUCT_IDS.COIN_1,
          productId: PRODUCT_IDS.COIN_1,
          title: t('COIN_1_TITLE'),
          price: '2.90$',
          priceAmount: 2.90,
          coins: 1,
          customIcon: appIcons.DollarCircle,
        },
        {
          id: PRODUCT_IDS.COIN_5,
          productId: PRODUCT_IDS.COIN_5,
          title: t('COIN_5_TITLE'),
          price: '9.0$',
          priceAmount: 9.0,
          coins: 5,
          customIcon: appIcons.DollarCircle,
        },
        {
          id: PRODUCT_IDS.COIN_10,
          productId: PRODUCT_IDS.COIN_10,
          title: t('COIN_10_TITLE'),
          price: '19.0$',
          priceAmount: 19.0,
          coins: 10,
          customIcon: appIcons.DollarCircle,
        },
        {
          id: PRODUCT_IDS.COIN_20,
          productId: PRODUCT_IDS.COIN_20,
          title: t('COIN_20_TITLE'),
          price: '29.0$',
          priceAmount: 29.0,
          coins: 20,
          customIcon: appIcons.DollarCircle,
        },
        {
          id: PRODUCT_IDS.COIN_30,
          productId: PRODUCT_IDS.COIN_30,
          title: t('COIN_30_TITLE'),
          price: '39.0$',
          priceAmount: 39.0,
          coins: 30,
          customIcon: appIcons.DollarCircle,
        },
        {
          id: PRODUCT_IDS.COIN_50,
          productId: PRODUCT_IDS.COIN_50,
          title: t('COIN_50_TITLE'),
          price: '69.0$',
          priceAmount: 69.0,
          coins: 50,
          customIcon: appIcons.DollarCircle,
        },
        {
          id: PRODUCT_IDS.COIN_100,
          productId: PRODUCT_IDS.COIN_100,
          title: t('COIN_100_TITLE'),
          price: '119.0$',
          priceAmount: 119.0,
          coins: 100,
          customIcon: appIcons.DollarCircle,
        },
        {
          id: PRODUCT_IDS.COIN_200,
          productId: PRODUCT_IDS.COIN_200,
          title: t('COIN_200_TITLE'),
          price: '199.0$',
          priceAmount: 199.0,
          coins: 200,
          customIcon: appIcons.DollarCircle,
        },
        {
          id: PRODUCT_IDS.COIN_300,
          productId: PRODUCT_IDS.COIN_300,
          title: t('COIN_300_TITLE'),
          price: '299.0$',
          priceAmount: 299.0,
          coins: 300,
          customIcon: appIcons.DollarCircle,
        },
        {
          id: PRODUCT_IDS.COIN_500,
          productId: PRODUCT_IDS.COIN_500,
          title: t('COIN_500_TITLE'),
          price: '499.0$',
          priceAmount: 499.0,
          coins: 500,
          customIcon: appIcons.DollarCircle,
        },
      ];

      setProducts(fallbackData);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add coins to user account
  const addCoinsToAccount = async (coinsToAdd, productPrice = null) => {
    try {
      if (!user?.id) {
        console.error('No user ID available');
        return false;
      }

      const currentCoins = Number(user?.availableCoins ?? user?.coins ?? 0);
      const newCoinsTotal = currentCoins + coinsToAdd;

      console.log(`Adding ${coinsToAdd} coins to account. Current: ${currentCoins}, New total: ${newCoinsTotal}`);

      // Update Firestore user
      await firestore().collection('Users').doc(user.id).update({
        availableCoins: newCoinsTotal,
        coins: newCoinsTotal, // Keep both fields for compatibility
      });

      // Add to Wallet history (like in old project)
      const walletEntry = {
        createdOn: Date.now(),
        activity: 'BOUGHTCOINS', // CoinActivity.BoughtCoins from old project
        isRevenue: true,
        userId: user.id,
        amount: coinsToAdd, // Number of coins purchased
      };

      // Add price if available (for real purchases)
      if (productPrice) {
        walletEntry.price = productPrice;
      }

      console.log('Adding wallet history entry:', walletEntry);
      await firestore().collection('Wallet').add(walletEntry);
      console.log('Wallet history entry added successfully');

      // Update Redux
      const updatedUser = {
        ...user,
        availableCoins: newCoinsTotal,
        coins: newCoinsTotal,
      };

      dispatch(setUser({ user: updatedUser, dataLoaded: true }));

      console.log('Coins successfully added to account and history recorded');
      return true;
    } catch (error) {
      console.error('Error adding coins to account:', error);
      return false;
    }
  };

  const handlePurchase = async (product) => {
    try {
      setPurchasing(true);
      setSelectedProduct(product);
      
      // Echten IAP Kauf starten
      try {
        const purchase = await purchaseService.purchaseProduct(product.productId);
        console.log('Purchase completed:', purchase);
        
        // Add coins to user account
        const coinsAdded = await addCoinsToAccount(product.coins);
        
        if (coinsAdded) {
          // Erfolg-Nachricht
          Alert.alert(
            t('PURCHASE_SUCCESS'),
            `${t('COINS_ADDED')}: ${product.coins} ${t('COINS')}`,
            [
              {
                text: t('OK'),
                onPress: () => {
                  console.log('Purchase success acknowledged');
                }
              }
            ]
          );
        } else {
          Alert.alert(
            t('ERROR'),
            t('COINS_ADD_FAILED') || 'Fehler beim Hinzufügen der Coins',
            [{ text: t('OK') }]
          );
        }
        
      } catch (error) {
        console.error('Purchase failed:', error);
        
        // Prüfe ob IAP nicht verfügbar ist (Simulator)
        if (error.message === 'IAP_NOT_AVAILABLE') {
          // Simuliere Kauf für Demo
          setTimeout(async () => {
            // Add coins to user account for demo
            const coinsAdded = await addCoinsToAccount(product.coins);
            
            if (coinsAdded) {
              Alert.alert(
                t('DEMO_PURCHASE_SUCCESS'),
                `${t('COINS_ADDED')}: ${product.coins} ${t('COINS')} (Demo)`,
                [
                  {
                    text: t('OK'),
                    onPress: () => {
                      console.log('Demo purchase success acknowledged');
                    }
                  }
                ]
              );
            } else {
              Alert.alert(
                t('ERROR'),
                t('COINS_ADD_FAILED') || 'Fehler beim Hinzufügen der Coins',
                [{ text: t('OK') }]
              );
            }
          }, 1000);
        } else {
          // Echter Fehler
          Alert.alert(
            t('PURCHASE_FAILED'),
            error.message || t('PURCHASE_ERROR_MESSAGE'),
            [
              {
                text: t('OK'),
                onPress: () => console.log('Purchase error acknowledged')
              }
            ]
          );
        }
      }
      
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setPurchasing(false);
      setSelectedProduct(null);
    }
  };

  const data = useMemo(() => products, [products]);

  return {
    data,
    loading,
    purchasing,
    selectedProduct,
    handlePurchase,
    loadProducts,
  };
}
