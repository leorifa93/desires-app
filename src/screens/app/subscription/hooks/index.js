import { useEffect, useState, useMemo } from 'react';
import {
  Icons,
  Lines,
  ScrollViews,
  Spacer,
  Text,
  Wrapper,
} from '../../../../components';
import { TouchableOpacity, Dimensions, Platform } from 'react-native';
import { StyleSheet } from 'react-native';
import { scale, verticalScale } from 'react-native-size-matters';
import {
  appIcons,
  appStyles,
  colors,
  fontSizes,
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
  sizes,
} from '../../../../services';
import { color } from '@rneui/base';
import PurchaseService from '../../../../services/iap/purchaseService';
import { useTranslation } from 'react-i18next';
import { Membership } from '../../../../constants/User';
import { useSelector } from 'react-redux';

const {width, height} = Dimensions.get('window');

const isTablet = () => {
  const aspectRatio = height / width;
  return (
    (Platform.OS === 'ios' && Platform.isPad) ||
    (Platform.OS === 'android' && width >= 600) ||
    (aspectRatio < 1.6 && width >= 600)
  );
};

// Helper function to check if a package is available for purchase based on current membership
// Logic from old project: A package is available if user can upgrade to it (not downgrade or already has it)
const isPackageAvailable = (packageType, currentMembership) => {
  // Map package types to membership values
  const packageMembership = {
    'Gold': Membership.Gold,
    'VIP': Membership.VIP,
    'Ghost': Membership.Silver,
    'Phantom': Membership.Phantom,
    'Celebrity': Membership.Celebrity,
  };

  const targetMembership = packageMembership[packageType];
  if (!targetMembership) return false;

  // Logic from old project (inverted from disabled logic):
  // Gold: available if NOT Gold (2) or VIP (3)
  if (packageType === 'Gold') {
    return ![Membership.Gold, Membership.VIP].includes(currentMembership);
  }
  // VIP: available if NOT VIP (3)
  if (packageType === 'VIP') {
    return currentMembership !== Membership.VIP;
  }
  // Ghost (Silver): available if NOT Silver (4), Phantom (5) or Celebrity (6)
  if (packageType === 'Ghost') {
    return ![Membership.Silver, Membership.Phantom, Membership.Celebrity].includes(currentMembership);
  }
  // Phantom: available if NOT Phantom (5) or Celebrity (6)
  if (packageType === 'Phantom') {
    return ![Membership.Phantom, Membership.Celebrity].includes(currentMembership);
  }
  // Celebrity: available if NOT Celebrity (6)
  if (packageType === 'Celebrity') {
    return currentMembership !== Membership.Celebrity;
  }

  return false;
};

export function useHooks(showOnlyMemberships = null) {
  const { t } = useTranslation();
  const me = useSelector(state => state.auth.user);
  
  // Determine initial page based on showOnlyMemberships
  const getInitialPage = () => {
    if (!showOnlyMemberships) return 'Visible Profiles';
    
    const memberships = showOnlyMemberships.toLowerCase().split(',').map(m => m.trim());
    
    // If includes phantom or celebrity, start with Invisible Profiles
    if (memberships.includes('phantom') || memberships.includes('celebrity')) {
      return 'Invisible Profiles';
    }
    
    return 'Visible Profiles';
  };
  
  const [CurrentPage, setCurrentPage] = useState(getInitialPage());
  const [products, setProducts] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState({});

  useEffect(() => {
    const ids = [
      'Celebrity_1_month', 'Celebrity_1_week',
      'Phantom_1_month', 'Phantom_1_week',
      'VIP_1_month', 'VIP_1_week',
      'Gold_1_month', 'Gold_1_week',
      'Ghost_1_month', 'Ghost_1_week',
    ];
    PurchaseService.loadProducts(ids).then((result) => {
      setProducts(result);
      console.log('Loaded products:', result);
    });
  }, []);

  const getPrice = (id) => products.find(p => p.productId === id)?.localizedPrice || '';
  const getPeriod = (type) => selectedPeriod[type] || 'month';
  const handlePeriodChange = (type, period) => {
    setSelectedPeriod(prev => ({ ...prev, [type]: period }));
  };

  const VisiblePackages = useMemo(() => {
    const currentMembership = me?.membership || Membership.Standard;
    
    const allPackages = [
      {
        IsGold: true,
        type: 'Gold',
        name: t('GOLD_MEMBER_PACKAGE'),
        description: t('UNLOCK_GOLD_BENEFITS'),
        price: getPrice(`Gold_1_${getPeriod('Gold')}`),
        period: getPeriod('Gold'),
        onPeriodChange: (period) => handlePeriodChange('Gold', period),
        discount: 0.5,
        isAvailable: isPackageAvailable('Gold', currentMembership),
        features: [
          t('OVERVIEW_MEMBERS'),
          t('SEE_LIKES'),
          t('PROFILE_MARKED_GOLD'),
          t('BETTER_RANKING'),
          t('UNLIMITED_CONVERSATIONS'),
          t('CHANGE_LOCATION'),
          t('FREE_MINUTES_500'),
        ],
      },
      {
        IsVip: true,
        type: 'VIP',
        name: t('VIP_MEMBER_PACKAGE'),
        description: t('UNLOCK_VIP_BENEFITS'),
        price: getPrice(`VIP_1_${getPeriod('VIP')}`),
        period: getPeriod('VIP'),
        onPeriodChange: (period) => handlePeriodChange('VIP', period),
        discount: 0.5,
        isAvailable: isPackageAvailable('VIP', currentMembership),
        features: [
          t('OVERVIEW_MEMBERS'),
          t('SEE_LIKES'),
          t('ALWAYS_TOP'),
          t('PROFILE_MARKED_VIP'),
          t('SEE_PRIVATE_PICTURES'),
          t('UNLIMITED_CONVERSATIONS'),
          t('CHANGE_LOCATION'),
          t('FREE_MINUTES_500'),
        ],
      },
    ];
    
    // Filter based on showOnlyMemberships parameter
    if (showOnlyMemberships) {
      const memberships = showOnlyMemberships.toLowerCase().split(',').map(m => m.trim());
      return allPackages.filter(pkg => memberships.includes(pkg.type.toLowerCase()));
    }
    
    return allPackages;
  }, [products, selectedPeriod, t, showOnlyMemberships, me?.membership]);

  const InvisiblePackages = useMemo(() => {
    const currentMembership = me?.membership || Membership.Standard;
    
    const allPackages = [
      {
        IsGhostNomal: true,
        type: 'Ghost',
        name: t('GHOST_MEMBER_PACKAGE'),
        description: t('UNLOCK_GHOST_BENEFITS'),
        price: getPrice(`Ghost_1_${getPeriod('Ghost')}`),
        period: getPeriod('Ghost'),
        onPeriodChange: (period) => handlePeriodChange('Ghost', period),
        discount: 0.5,
        isAvailable: isPackageAvailable('Ghost', currentMembership),
        features: [
          t('PROFILE_ONLY_VISIBLE_TO_FRIENDS'),
          t('STEALTH_ICONS_FREE'),
          t('FREE_MINUTES_200'),
        ],
      },
      {
        IsGhostVip: true,
        type: 'Phantom',
        name: t('PHANTOM_MEMBER_PACKAGE'),
        description: t('UNLOCK_PHANTOM_BENEFITS'),
        price: getPrice(`Phantom_1_${getPeriod('Phantom')}`),
        period: getPeriod('Phantom'),
        onPeriodChange: (period) => handlePeriodChange('Phantom', period),
        discount: 0.5,
        isAvailable: isPackageAvailable('Phantom', currentMembership),
        features: [
          t('PROFILE_ONLY_VISIBLE_TO_FRIENDS'),
          t('STEALTH_ICONS_FREE'),
          t('OVERVIEW_MEMBERS'),
          t('SEE_LIKES'),
          t('SEE_PRIVATE_PICTURES'),
          t('UNLIMITED_CONVERSATIONS'),
          t('CHANGE_LOCATION'),
          t('FREE_MINUTES_1000'),
        ],
      },
      {
        IsVip: true,
        type: 'Celebrity',
        name: t('CELEBRITY_MEMBER_PACKAGE'),
        description: t('UNLOCK_CELEBRITY_BENEFITS'),
        price: getPrice(`Celebrity_1_${getPeriod('Celebrity')}`),
        period: getPeriod('Celebrity'),
        onPeriodChange: (period) => handlePeriodChange('Celebrity', period),
        discount: 0.5,
        isAvailable: isPackageAvailable('Celebrity', currentMembership),
        features: [
          t('PROFILE_ONLY_VISIBLE_TO_FRIENDS'),
          t('STEALTH_ICONS_FREE'),
          t('OVERVIEW_MEMBERS'),
          t('SEE_LIKES'),
          t('SEE_PRIVATE_PICTURES'),
          t('UNLIMITED_CONVERSATIONS'),
          t('CHANGE_LOCATION'),
          t('NOBODY_SCREENSHOTS'),
        ],
      },
    ];
    
    // Filter based on showOnlyMemberships parameter
    if (showOnlyMemberships) {
      const memberships = showOnlyMemberships.toLowerCase().split(',').map(m => m.trim());
      return allPackages.filter(pkg => memberships.includes(pkg.type.toLowerCase()));
    }
    
    return allPackages;
  }, [products, selectedPeriod, t, showOnlyMemberships, me?.membership]);

  function handleCurrentPage({ PageName }) {
    setCurrentPage(PageName);
  }

  const RenderItem = ({ IsVip, IsGold, IsGhostNomal, IsGhostVip, Item }) => {
    const isAvailable = Item?.isAvailable !== false;
    const DefaultBackGroundColor = IsVip
      ? colors.appPrimaryColor
      : IsGold
      ? colors.GoldLabelBackground
      : IsGhostNomal
      ? '#F6F6F6'
      : IsGhostVip
      ? colors.appBGColor
      : null;
    const activeColor = colors.appPrimaryColor;
    const tablet = isTablet();
    const styles = StyleSheet.create({
      cardMainContainer: {
        height: verticalScale(170),
        backgroundColor: DefaultBackGroundColor,
        borderRadius: scale(16),
        padding: sizes.baseMargin,
        overflow: 'visible',
        opacity: isAvailable ? 1 : 0.5,
      },
      periodSwitchRow: {
        flexDirection: 'row',
        marginTop: 'auto', // Buttons ganz nach unten
        marginBottom: 0,
      },
      periodButton: {
        flex: 1,
        marginHorizontal: 4,
        padding: 12, // Einheitliche Höhe
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.appBorderColor2,
        alignItems: 'center',
        minHeight: 40, // Einheitliche Mindesthöhe
      },
      periodButtonActive: {
        backgroundColor: activeColor,
      },
      periodButtonActiveVip: {
        backgroundColor: '#fff',
        borderColor: '#fff',
      },
      periodButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
      },
      periodButtonTextVipActive: {
        color: colors.appPrimaryColor,
        fontWeight: 'bold',
      },
      periodButtonText: {
        color: colors.appTextColor1,
      },
      periodButtonTextLight: {
        color: '#fff',
      },
      originalPrice: {
        textDecorationLine: 'line-through',
        color: !IsGhostNomal ? '#fff' : colors.appTextColor1,
        fontWeight: 'bold',
        fontSize: responsiveFontSize(3.5),
        marginLeft: 8,
        opacity: 0.8,
      },
      // price row removed per requirements
    });

    // Versuche, den Originalpreis zu berechnen (doppelt so hoch, falls 50% Rabatt)
    let originalPrice = null;
    if (Item?.price && Item?.discount === 0.5) {
      // Versuche, den Preis als Zahl zu extrahieren
      const priceMatch = String(Item.price).match(/([\d,.]+)/);
      if (priceMatch) {
        let priceNum = parseFloat(priceMatch[1].replace(',', '.'));
        if (!isNaN(priceNum)) {
          let orig = priceNum * 2;
          // Erhalte das Währungssymbol
          const symbolMatch = String(Item.price).match(/[^\d,.]+/);
          const symbol = symbolMatch ? symbolMatch[0].trim() : '';
          // Formatieren
          originalPrice = `${orig.toFixed(2)}${symbol}`;
        }
      }
    }

    return (
      <Wrapper
        style={{ 
          width: responsiveWidth(100), 
          height: tablet ? verticalScale(460) : verticalScale(400) 
        }}>
        <Wrapper marginHorizontalBase style={styles.cardMainContainer}>
          <Spacer isSmall />
          <Text
            isLarge
            isBoldFont
            isWhite={!IsGhostNomal}
            children={Item?.name}
          />
          <Spacer isSmall />
          <Text
            isSmall
            isRegularFont
            isWhite={!IsGhostNomal}
            isTextColor2={IsGhostNomal}
            style={{ width: scale(240) }}>
            {Item?.description}
          </Text>
          {!isAvailable && (
            <>
              <Spacer isTiny />
              <Text
                isTiny
                isBoldFont
                isWhite={!IsGhostNomal}
                style={{ opacity: 0.8 }}>
                {t('ALREADY_OWNED') || 'Already owned or higher membership'}
              </Text>
            </>
          )}
          {/* Umschalter für Woche/Monat */}
          <Wrapper style={styles.periodSwitchRow}>
            {['week', 'month'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  Item.period === period && (IsVip ? styles.periodButtonActiveVip : styles.periodButtonActive),
                ]}
                onPress={() => Item.onPeriodChange(period)}
                activeOpacity={0.7}
              >
                <Text
                  style={
                    Item.period === period
                      ? (IsVip ? styles.periodButtonTextVipActive : styles.periodButtonTextActive)
                      : ((IsGhostVip || IsVip || IsGold) ? styles.periodButtonTextLight : styles.periodButtonText)
                  }
                >
                  {t(period === 'week' ? 'WEEK' : 'MONTH')}
                </Text>
              </TouchableOpacity>
            ))}
          </Wrapper>
          <Spacer isTiny />
          {/* Prices removed from top as requested */}
          <Wrapper
            isAbsolute
            isCenter
            flexDirectionRow
            style={{
              height: scale(40), // Noch kleiner
              width: scale(40), // Noch kleiner
              borderRadius: responsiveWidth(100),
              backgroundColor: colors.appPrimaryColor,
              top: 5,
              right: -5, // Noch weiter nach rechts
              zIndex: 100,
              ...appStyles.shadowDark,
            }}>
            <Text isSmall isWhite>
              50
            </Text>
            <Wrapper style={{height: scale(12)}}>
              <Text isTiny isBoldFont isWhite>
                %
              </Text>
            </Wrapper>
          </Wrapper>
        </Wrapper>
        <Spacer isDoubleBase />
        {isTablet() ? (
          <Wrapper gap={responsiveHeight(0.5)}>
            {Item?.features.map((label, index) => (
              <Wrapper
                key={index}
                flexDirectionRow
                marginHorizontalLarge
                alignItemsCenter>
                <Icons.Custom icon={appIcons.TickCircle} size={scale(20)} />
                <Spacer horizontal isTiny />
                <Text isRegular isRegularFont style={{ fontSize: responsiveFontSize(9) }}>
                  {label}
                </Text>
              </Wrapper>
            ))}
          </Wrapper>
        ) : (
          <ScrollViews.KeyboardAvoiding>
            <Wrapper gap={responsiveHeight(0.5)}>
              {Item?.features.map((label, index) => (
                <Wrapper
                  key={index}
                  flexDirectionRow
                  marginHorizontalLarge
                  alignItemsCenter>
                  <Icons.Custom icon={appIcons.TickCircle} size={scale(20)} />
                  <Spacer horizontal isTiny />
                  <Text isRegular isRegularFont style={{ fontSize: responsiveFontSize(9) }}>
                    {label}
                  </Text>
                </Wrapper>
              ))}
            </Wrapper>
          </ScrollViews.KeyboardAvoiding>
        )}
      </Wrapper>
    );
  };

  return {
    CurrentPage,
    handleCurrentPage,
    RenderItem,
    VisiblePackages,
    InvisiblePackages,
    selectedPeriod,
    setSelectedPeriod,
  };
}
