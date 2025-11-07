import React, {useMemo, useState, useEffect} from 'react';
import {
  appIcons,
  appImages,
  appStyles,
  colors,
  headers,
  responsiveHeight,
  responsiveWidth,
} from '../../../../services';
import {scale} from 'react-native-size-matters';
import {StyleSheet, View} from 'react-native';
import {
  Icons,
  Images,
  Lines,
  Spacer,
  Text,
  Wrapper,
} from '../../../../components';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../../../../store/reducers/auth';
import firestore from '@react-native-firebase/firestore';
import { useTranslation } from 'react-i18next';
import appIconService from '../../../../services/appIconService';
import { Membership } from '../../../../constants/User';
import { Alert, TouchableOpacity } from 'react-native';
import { navigate } from '../../../../navigation/rootNavigation';
import { routes } from '../../../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useHooks() {
  const [LanguageModal, setLanguageModal] = useState(false);
  const [currentIcon, setCurrentIcon] = useState(null);
  const [AccessModal, setAccessModal] = useState(false);
  const [TermsConditionsModal, setTermsConditionsModal] = useState(false);
  const [PrivacyPolicyModal, setPrivacyPolicyModal] = useState(false);
  const [AppIconsVip, setAppIconVip] = useState(false);
  const [AppIconSealth, setAppIconSealth] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const { t, i18n } = useTranslation();

  const handleToggleLocationModal = () => {
    setLanguageModal(!LanguageModal);
  };
  const handleToggleIconVip = () => {
    setAppIconVip(!AppIconsVip);
  };
  const handleToggleIconSealth = () => {
    setAppIconSealth(!AppIconSealth);
  };
  const handleToggleAccessModal = () => {
    setAccessModal(!AccessModal);
  };
  const handleToggleTermsConditionsModal = () => {
    setTermsConditionsModal(!TermsConditionsModal);
  };
  const handleTogglePrivacyPolicyModal = () => {
    setPrivacyPolicyModal(!PrivacyPolicyModal);
  };

  // Update user settings
  const updateUserSettings = async (newSettings) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Create default _settings if they don't exist
      // Use current i18n language (which follows device language) instead of hardcoded 'de'
      const defaultSettings = {
        units: {
          lengthType: 'Cm',
          distanceType: 'Km',
          weightType: 'Kg'
        },
        currentLang: i18n.language, // Use device language instead of hardcoded 'de'
        showInDiscover: false,
        showCall: true,
        notifications: {
          messages: true,
          friendRequests: true,
          likes: true,
          call: true
        }
      };
      
      const updatedUser = {
        ...user,
        _settings: {
          ...defaultSettings,
          ...user._settings,
          ...newSettings
        }
      };
      
      console.log('Saving user settings:', { newSettings, updatedUser: updatedUser._settings });
      
      // Update in Firestore
      await firestore().collection('Users').doc(user.id).set(updatedUser, { merge: true });
      
      // Update Redux store
      dispatch(setUser({ user: updatedUser, dataLoaded: true }));
      
      console.log('User settings saved successfully');
    } catch (error) {
      console.error('Error updating user settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle notification settings
  const toggleNotification = (type) => {
    // Create default notifications if they don't exist
    const currentNotifications = user?._settings?.notifications || {
      messages: true,
      friendRequests: true,
      likes: true,
      call: true
    };
    
    const newNotifications = {
      ...currentNotifications,
      [type]: !currentNotifications[type]
    };
    
    updateUserSettings({ notifications: newNotifications });
  };

  // Toggle discover visibility
  const toggleDiscoverVisibility = () => {
    // Get current showInDiscover value or default to false
    const currentShowInDiscover = user?._settings?.showInDiscover ?? false;
    
    updateUserSettings({ 
      showInDiscover: !currentShowInDiscover 
    });
  };

  // Toggle call visibility
  const toggleCallVisibility = () => {
    // Get current showCall value or default to true
    const currentShowCall = user?._settings?.showCall ?? true;
    
    updateUserSettings({ 
      showCall: !currentShowCall 
    });
  };

  // Update unit settings
  const updateUnit = (type, value) => {
    // Get current units or use defaults
    const currentUnits = user?._settings?.units || {
      lengthType: 'Cm',
      distanceType: 'Km',
      weightType: 'Kg'
    };
    
    const newUnits = {
      ...currentUnits,
      [type]: value
    };
    
    console.log('Updating units:', { type, value, newUnits });
    updateUserSettings({ units: newUnits });
  };

  // Update language
  const updateLanguage = async (lang) => {
    console.log('user', user);
    
    try {
      // First change the language in i18n
      await i18n.changeLanguage(lang);
      
      // Mark that user has explicitly chosen a language
      await AsyncStorage.setItem('@hasUserChosenLanguage', 'true');
      
      // Save language to AsyncStorage for persistence
      await AsyncStorage.setItem('userLanguage', lang);
      
      // Then update user settings in Firestore
      await updateUserSettings({ currentLang: lang });
      
      // Close the modal
      handleToggleLocationModal();
      
      console.log('Language updated successfully:', lang);
    } catch (error) {
      console.error('Error updating language:', error);
    }
  };

  const LanguageModalData = useMemo(() => [
    {customIcon: appIcons.germany, label: t('GERMAN'), value: 'de'},
    {customIcon: appIcons.unitedstates, label: t('ENGLISH'), value: 'en'},
    {customIcon: appIcons.france, label: t('FRENCH'), value: 'fr'},
    {customIcon: appIcons.spain, label: t('SPANISH'), value: 'es'},
  ], [t]);

  const unitsData = useMemo(() => [
    {
      label: 'Distance', 
      unit: user?._settings?.units?.distanceType || 'Km',
      type: 'distanceType',
      options: ['Km', 'Mi']
    },
    {
      label: 'Length', 
      unit: user?._settings?.units?.lengthType || 'Cm',
      type: 'lengthType',
      options: ['Cm', 'Inch']
    },
    {
      label: 'Weight', 
      unit: user?._settings?.units?.weightType || 'Kg',
      type: 'weightType',
      options: ['Kg', 'Lbs']
    },
  ], [user?._settings?.units]);

  // Load current icon on mount and when modal opens
  useEffect(() => {
    const loadCurrentIcon = async () => {
      const icon = await appIconService.getCurrentIcon();
      setCurrentIcon(icon);
      console.log('[Settings] Current icon loaded:', icon);
    };
    loadCurrentIcon();
  }, []);

  // Handle VIP icon selection
  const handleVipIconSelect = async (iconName) => {
    if (!appIconService.canAccessVipIcons(user)) {
      Alert.alert(t('ACCESS_DENIED'), t('VIP_ACCESS_DENIED'));
      return;
    }

    const success = await appIconService.changeIcon(iconName);
    if (success) {
      // Update local state
      setCurrentIcon(iconName);
      console.log('VIP icon changed to:', iconName);
      // No alert - the native library already shows one
    } else {
      // Only show error if it failed
      Alert.alert(t('ERROR'), t('ICON_CHANGE_FAILED'));
    }
  };

  // Handle stealth icon selection
  const handleStealthIconSelect = async (iconName) => {
    if (!appIconService.canAccessStealthIcon(user, iconName)) {
      // Show purchase dialog or upgrade message
      Alert.alert(
        t('ICON_NOT_AVAILABLE'),
        t('ICON_PURCHASE_QUESTION'),
        [
          { text: t('CANCEL'), style: 'cancel' },
          { text: t('PURCHASE'), onPress: () => purchaseStealthIcon(iconName) },
          { text: t('UPGRADE'), onPress: () => navigate(routes.subscription) }
        ]
      );
      return;
    }

    const success = await appIconService.changeIcon(iconName);
    if (success) {
      // Update local state
      setCurrentIcon(iconName);
      console.log('Stealth icon changed to:', iconName);
      // No alert - the native library already shows one
    } else {
      // Only show error if it failed
      Alert.alert(t('ERROR'), t('ICON_CHANGE_FAILED'));
    }
  };

  // Handle stealth icon purchase
  const purchaseStealthIcon = async (iconName) => {
    if (!user) return;
    const price = 10;
    const availableCoins = Number(user?.availableCoins ?? user?.coins ?? 0);
    if (availableCoins < price) {
      Alert.alert(
        t('NOTENOUGHCOINS'),
        t('NOTENOUGHCOINS_MESSAGE'),
        [
          { text: t('CANCEL'), style: 'cancel' },
          { text: t('BUY'), onPress: () => navigate(routes.buyCoins) }
        ]
      );
      return;
    }

    Alert.alert(t('PURCHASE'), t('PURCHASE_ICON_QUESTION', { iconName }), [
      { text: t('CANCEL'), style: 'cancel' },
      { 
        text: t('PURCHASE'), 
        onPress: async () => {
          try {
            // Deduct coins and add stealth icon permission
            const updatedUser = {
              ...user,
              availableCoins: availableCoins - price,
              _stealthModes: Array.from(new Set([...(user._stealthModes || []), iconName]))
            };
            await getDocumentById({ collection: 'Users', id: user.id, data: updatedUser });
            dispatch(setUser({ user: updatedUser, dataLoaded: true }));
            
            // Now change the icon and show the success message
            const success = await appIconService.changeIcon(iconName);
            if (success) {
              setCurrentIcon(iconName);
              const iconDisplayName = appIconService.getIconDisplayName(iconName);
              Alert.alert(
                t('ICON_CHANGED_SUCCESS_TITLE'),
                t('ICON_CHANGED_SUCCESS_MESSAGE', { iconName: iconDisplayName })
              );
            }
          } catch (e) {
            console.error('Error purchasing stealth icon:', e);
            Alert.alert(t('ERROR'), t('PURCHASE_ERROR'));
          }
        }
      }
    ]);
  };

  // Handle icon reset
  const handleIconReset = async () => {
    Alert.alert(
      t('RESET'),
      t('RESET_ICON_QUESTION'),
      [
        { text: t('CANCEL'), style: 'cancel' },
        { 
          text: t('RESET'), 
          onPress: async () => {
            const success = await appIconService.resetIcon();
            if (success) {
              // Update local state to null (default icon)
              setCurrentIcon(null);
              console.log('App icon reset to default');
            }
          }
        }
      ]
    );
  };

  const IconVipData = useMemo(() => {
    const vipIcons = appIconService.getVipIcons();
    const isVip = appIconService.canAccessVipIcons(user);
    return vipIcons.map(icon => {
      const isActive = currentIcon === icon.name;
      return {
        icon: icon.icon,
        customleftIcon: icon.icon, // pass the actual image source from service
        leftColor: icon.name === 'vip' ? colors.appPrimaryColor : '#221831',
        title: icon.title,
        description: icon.description,
        rightText: isActive ? t('ACTIVE') : (isVip ? t('CHOOSE') : t('BECOMEVIPMEMBER')),
        onPressRight: isActive ? undefined : () => {
          if (isVip) return handleVipIconSelect(icon.name);
          navigate(routes.subscription);
        }
      };
    });
  }, [user, t, currentIcon]);
  // Helper function to get icon color
  const getIconColor = (iconName) => {
    const colorMap = {
      'cl': colors.appPrimaryColor,
      'flight': '#221831',
      'gym': '#0866FF',
      'healthcare': '#DB9501',
      'mlsnews': '#CC01DB',
      'navigator': '#13C634',
      'nflnews': '#FF6B00',
      'nfl': '#1A1A1A',
      'taxi': '#FFD700',
      'wifi': '#4CAF50'
    };
    return colorMap[iconName] || colors.appPrimaryColor;
  };

  const IconSealthData = useMemo(() => {
    const stealthIcons = appIconService.getStealthIcons();
    return stealthIcons.map(icon => {
      const canAccess = appIconService.canAccessStealthIcon(user, icon.name);
      const isActive = currentIcon === icon.name;
      return {
        customleftIcon: icon.icon,
        leftIconSize: scale(48),
        title: t(icon.titleKey),
        rightText: isActive ? t('ACTIVE') : (canAccess ? t('CHOOSE') : t('BUY')),
        onPressRight: isActive ? undefined : () => {
          if (canAccess) return handleStealthIconSelect(icon.name);
          return purchaseStealthIcon(icon.name);
        }
      };
    });
  }, [user, t, currentIcon]);

  return {
    user,
    isSaving,
    unitsData,
    LanguageModal,
    LanguageModalData,
    handleToggleLocationModal,
    AccessModal,
    handleToggleAccessModal,
    PrivacyPolicyModal,
    handleTogglePrivacyPolicyModal,
    TermsConditionsModal,
    handleToggleTermsConditionsModal,
    AppIconsVip,
    AppIconSealth,
    handleToggleIconVip,
    handleToggleIconSealth,
    IconVipData,
    IconSealthData,
    // New functions
    toggleNotification,
    toggleDiscoverVisibility,
    toggleCallVisibility,
    updateUnit,
    updateLanguage,
    // Icon functions
    handleIconReset,
  };
}

export const Options = React.memo(
  ({
    leftMainContainerSize,
    isRounded,
    customleftIcon,
    leftIconSize,
    leftIconColor,
    leftColor,
    title,
    description,
    rightText,
    onPressRight,
  }) => {
    const [ShowOption, setShowOption] = useState(false);

    const styles = StyleSheet.create({
      BadgeMainContainer: {
        height: scale(8),
        width: scale(8),
        top: scale(5),
        left: scale(39),
        backgroundColor: colors.appBgColor1,
        borderRadius: responsiveWidth(100),
      },
      BadgeInnerContainer: {
        flex: 1,
        margin: scale(1.1),
        backgroundColor: '#13C634',
        borderRadius: responsiveWidth(100),
      },
      OptionMainContainer: {
        height: responsiveHeight(18),
        width: responsiveWidth(36),
        top: responsiveHeight(5),
        right: responsiveWidth(7),
        backgroundColor: colors.appBgColor1,
        ...appStyles.shadowDark,
        borderRadius: responsiveWidth(3),
        padding: scale(18),
        zIndex: 2,
      },
    });

    return (
      <View>
        <Wrapper
          flexDirectionRow
          marginHorizontalBase
          marginVerticalSmall
          //backgroundColor={'pink'}
          alignItemsCenter>
          {/* Image */}
          <Wrapper
            isCenter
            style={{
              height: leftMainContainerSize ? leftMainContainerSize : scale(48),
              width: leftMainContainerSize ? leftMainContainerSize : scale(48),
              borderRadius: isRounded ? 150 : 12,
              backgroundColor: leftColor ? leftColor : 'transparent',
            }}>
            {customleftIcon ? (
              <Images.SqareRound
                style={{ borderRadius: isRounded ? 150 : 12 }}
                source={customleftIcon}
                size={leftIconSize ? leftIconSize : scale(48)}
              />
            ) : null}
          </Wrapper>
          {/* Text Name And Id */}
          <Wrapper
            marginHorizontalSmall
            justifyContentCenter
            //backgroundColor={'blue'}
            style={{width: responsiveWidth(24)}}>
            <Text isRegular isBoldFont>
              {title}
            </Text>
            {description && (
              <Text isSmall isRegularFont isTextColor2>
                {description}
              </Text>
            )}
          </Wrapper>
          {/* Icons of Chat and the options */}
          <Wrapper
            alignItemsFlexEnd
            style={{height: responsiveHeight(4), width: responsiveWidth(50)}}>
            <TouchableOpacity onPress={onPressRight}>
              <Text isPrimaryColor isSmall isMediumFont>
                {rightText}
              </Text>
            </TouchableOpacity>
          </Wrapper>
        </Wrapper>
        {/* Bottom Line */}
        <Wrapper marginHorizontalBase alignItemsFlexEnd>
          <Lines.Horizontal
            height={1}
            width={responsiveWidth(73)}
            color={colors.appBorderColor2}
          />
        </Wrapper>
      </View>
    );
  },
);
