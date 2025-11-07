import {View, TouchableOpacity, StyleSheet, Alert, Platform, Dimensions, KeyboardAvoidingView} from 'react-native';
import React from 'react';
import {
  Buttons,
  Headers,
  MyAnimated,
  ScrollViews,
  Spacer,
  Swipeables,
  Text,
  Wrapper,
} from '../../../components';
import {appStyles, colors, responsiveWidth, responsiveHeight, sizes} from '../../../services';
import { useHooks } from './hooks';
import { useTranslation } from 'react-i18next';
import PurchaseService from '../../../services/iap/purchaseService';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useSelector, useDispatch } from 'react-redux';
import { Membership } from '../../../constants/User';
import { setUser } from '../../../store/actions/auth';
import { serializeFirestoreData } from '../../../utils/serializeFirestoreData';
import { navigate } from '../../../navigation/rootNavigation';
import { routes } from '../../../services/constants';
import { useNavigation } from '@react-navigation/native';

const isTablet = () => {
  const {width, height} = Dimensions.get('window');
  return (
    (Platform.OS === 'android' && (width >= 600 || height >= 600)) ||
    (Platform.OS === 'ios' && Platform.isPad) ||
    (width >= 768 && height >= 768)
  );
};

const Index = ({ route }) => {
  const navigation = useNavigation();
  const showOnlyMemberships = route?.params?.showOnlyMemberships || null;
  const tablet = isTablet();

  const {
    CurrentPage,
    handleCurrentPage,
    RenderItem,
    VisiblePackages,
    InvisiblePackages,
    selectedPeriod,
    setSelectedPeriod,
  } = useHooks(showOnlyMemberships);
  const { t } = useTranslation();
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const me = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const selectedIndexRef = React.useRef(selectedIndex);
  const [swipeKey, setSwipeKey] = React.useState(0);

  React.useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  React.useEffect(() => {
    setSelectedIndex(0);
    selectedIndexRef.current = 0;
  }, [CurrentPage]);

  // Ermittle das aktuell ausgewählte Paket
  const currentPackages = CurrentPage === 'Visible Profiles' ? VisiblePackages : InvisiblePackages;
  const selectedPackage = currentPackages[selectedIndex] || currentPackages[0];
  
  // Check if the selected package is available for purchase
  const isSelectedPackageAvailable = selectedPackage?.isAvailable !== false;

  // Ermittle die aktuelle Produkt-ID für den Kauf
  const getCurrentProductId = () => {
    if (!selectedPackage) return null;
    const type = selectedPackage.type;
    const period = selectedPeriod[type] || selectedPackage.period;
    const typeMap = {
      Gold: 'Gold',
      VIP: 'VIP',
      Ghost: 'Ghost',
      Phantom: 'Phantom',
      Celebrity: 'Celebrity',
    };
    const prefix = typeMap[type] || type;
    // Note: purchaseService.js will convert to lowercase on Android
    return `${prefix}_1_${period}`;
  };

  const parseMembershipFromProductId = (productId) => {
    // Expected like: Gold_1_month, VIP_1_month, Silver_1_month, Phantom_1_month, Celebrity_1_month
    if (!productId) return null;
    const upper = productId.toUpperCase();
    if (upper.startsWith('VIP')) return Membership.VIP;
    if (upper.startsWith('GOLD')) return Membership.Gold;
    if (upper.startsWith('SILVER')) return Membership.Silver;
    if (upper.startsWith('PHANTOM')) return Membership.Phantom;
    if (upper.startsWith('CELEBRITY')) return Membership.Celebrity;
    return null;
  };

  const upgradeMembership = async (targetMembership) => {
    if (!me?.id || !targetMembership) return;
    // Update in Firestore
    await firestore().collection('Users').doc(me.id).update({
      membership: targetMembership,
      renewMemberShip: true,
    });
    // Update Redux
    const updatedUser = serializeFirestoreData({ ...me, membership: targetMembership, renewMemberShip: true });
    dispatch(setUser({ user: updatedUser, dataLoaded: true }));
  };

  const handleSwipePurchase = async () => {
    // Check if the package is available for purchase
    if (!isSelectedPackageAvailable) {
      Alert.alert(
        t('ERROR') || 'Error',
        t('CANNOT_PURCHASE_PACKAGE') || 'You cannot purchase this package. You already have this membership or a higher one.'
      );
      setSwipeKey(prev => prev + 1);
      return;
    }
    
    const productId = getCurrentProductId();
    if (!productId) return;
    setIsPurchasing(true);
    try {
      // Preflight: ensure IAP is initialized and product exists on device
      await PurchaseService.initialize();
      const available = await PurchaseService.loadProducts([productId]);
      // On Android, product IDs are converted to lowercase, so we need to compare lowercase
      const compareId = Platform.OS === 'android' ? productId.toLowerCase() : productId;
      const found = Array.isArray(available) && available.some(p => (p.productId || p.sku) === compareId);
      if (!found) {
        Alert.alert(
          t('ERROR') || 'Error',
          `${t('PRODUCT_NOT_AVAILABLE') || 'Product not available'}: ${productId} (looking for: ${compareId})`
        );
        setSwipeKey(prev => prev + 1);
        return;
      }

      await PurchaseService.purchaseProduct(productId);
      // Map product to membership and upgrade like web
      const targetMembership = parseMembershipFromProductId(productId);
      if (targetMembership) {
        await upgradeMembership(targetMembership);
        
        // Mark verification choice as made
        const currentUser = auth().currentUser;
        if (currentUser) {
          await firestore().collection('Users').doc(currentUser.uid).update({
            verificationChoiceMade: true
          });
        }
        
        // VIP prompt to change app icon (navigate to settings)
        if (targetMembership === Membership.VIP) {
          Alert.alert(
            t('WANNACHANGEICON') || 'Icon ändern?',
            '',
            [
              { text: t('NO') || 'Nein', style: 'cancel', onPress: () => navigate(routes.bottomTab) },
              { text: t('YES') || 'Ja', onPress: () => navigate(routes.appSetting) },
            ]
          );
        } else {
          navigate(routes.bottomTab);
        }
      }
      setSwipeKey(prev => prev + 1); // Swipeables resetten
    } catch (e) {
      setSwipeKey(prev => prev + 1); // Swipeables resetten auch bei Fehler
      console.error(e);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Passe RenderItem an, um die Auswahl und Periodenwechsel zu ermöglichen
  const renderSelectableItem = (props) => (
    <Wrapper onPress={() => setSelectedIndex(props.index)}>
      <RenderItem {...props} selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />
    </Wrapper>
  );

  // Passe die Bereichsauswahl an, damit selectedIndex immer auf 0 gesetzt wird, bevor CurrentPage geändert wird
  const handleSectionChange = (PageName) => {
    setSelectedIndex(0);
    handleCurrentPage({ PageName });
  };

  return (
    <Wrapper isMain>
      <Headers.Primary 
        showBackArrow 
        title={t('SUBSCRIPTIONS')} 
        onBackPress={() => {
          if (route?.params?.showOnlyInvisible) {
            navigation.navigate(routes.verificationChoice);
          } else {
            navigation.goBack();
          }
        }}
      />
      <Spacer isBasic />
      {/* The Toggle of the Buttons - hide if showing only specific memberships */}
      {!showOnlyMemberships && (
        <Wrapper
          marginHorizontalBase
          alignItemsCenter
          justifyContentSpaceBetween
          flexDirectionRow
          style={styles.ButtonBackContainer}>
          <MyAnimated.AnimatedView
            NotFlexed
            isAbsolute
            width={-responsiveWidth(47.5)}
            onPressStart={CurrentPage === 'Invisible Profiles'}
            onPressClosed={CurrentPage === 'Visible Profiles'}>
            <Wrapper
              style={styles.SeletedLayerContainer}
              backgroundColor={colors.appBGColor}
            />
          </MyAnimated.AnimatedView>
          {['Visible Profiles', 'Invisible Profiles'].map((item, index) => {
            return (
              <TouchableOpacity
                key={index}
                style={styles.SeletedLayerContainer}
                onPress={() => handleSectionChange(item)}>
                <Text
                  alignTextCenter
                  isRegular
                  isRegularFont
                  isWhite={item == CurrentPage}
                >
                  {t(item.toUpperCase().replace(' ', ''))}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Wrapper>
      )}
      <Spacer isBasic />
      <View style={{ flex: 1, minHeight: tablet ? 0 : responsiveHeight(50) }}>
        {currentPackages.length > 1 ? (
          <ScrollViews.HorizontalScrollWithDots
            Data={currentPackages}
            RenderItem={({ item, index }) => renderSelectableItem({ ...item, Item: item, index })}
            currentIndex={selectedIndex}
            onIndexChange={setSelectedIndex}
          />
        ) : (
          // Show single package centered without dots
          <View style={{alignItems: 'center', justifyContent: 'center'}}>
            {currentPackages.map((item, index) => renderSelectableItem({ ...item, Item: item, index }))}
          </View>
        )}
      </View>
      <Spacer isBasic />
      <View style={tablet ? {position: 'absolute', bottom: 10, left: 0, right: 0} : {marginBottom: responsiveHeight(2)}}>
        <Swipeables.SwipableItem
          key={swipeKey}
          onSwipeLeft={handleSwipePurchase}
          swipeDistance={responsiveWidth(80)}
          SwipeTitle={selectedPackage?.price || ''}
          BtnTitle={isPurchasing ? t('PLEASE_WAIT') : t('Swipe To Pay')}
        />
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  ButtonBackContainer: {
    //height: sizes.inputHeight,
    borderRadius: responsiveWidth(3),
    // paddingHorizontal: sizes.TinyMargin,
    borderRadius: responsiveWidth(100),
    // marginBottom: responsiveHeight(4),
    //overflow: 'hidden',
    //backgroundColor: 'red',
    borderWidth: 1,
    borderColor: colors.appBorderColor2,
  },
  SeletedLayerContainer: {
    height: sizes.buttonHeight,
    borderRadius: responsiveWidth(100),
    width: responsiveWidth(42),
    justifyContent: 'center',
    alignItems: 'center',
    //backgroundColor: 'blue',
  },
});

export default Index;
