import React, {useMemo, useState} from 'react';
import {Images, Logos, Spacer, Text, Wrapper} from '../../../../components';
import {
  appIcons,
  appImages,
  appStyles,
  colors,
  responsiveHeight,
  responsiveWidth,
  routes,
  getUserDetail
} from '../../../../services';
import {scale} from 'react-native-size-matters';
import {navigate} from '../../../../navigation/rootNavigation';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { signOut } from '../../../../store/actions/auth';
import { Dimensions, Platform } from 'react-native';

const {width, height} = Dimensions.get('window');

const isTablet = () => {
  const aspectRatio = height / width;
  return (
    (Platform.OS === 'ios' && Platform.isPad) ||
    (Platform.OS === 'android' && width >= 600) ||
    (aspectRatio < 1.6 && width >= 600)
  );
};

export function useHooks() {
  const [LocationModalVisible, setLocationModalVisible] = useState(false);
  const [EditProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutStatus, setLogoutStatus] = useState('');
  const {t} = useTranslation();
  const me = useSelector(state => state.auth.user);
  const dispatch = useDispatch();

  const handleToggleLocationModal = () => {
    setLocationModalVisible(!LocationModalVisible);
  };

  const handleToggleEditProfileModal = () => {
    setEditProfileModalVisible(!EditProfileModalVisible);
  };

  const HeaderComponent = React.memo(() => {
    if (!me) return null;
    const tablet = isTablet();
    return (
      <Wrapper>
        <Wrapper
          alignItemsCenter
          justifyContentCenter
          style={{
            height: tablet ? responsiveHeight(35) : responsiveHeight(24),
            backgroundColor: 'transparent',
            borderBottomLeftRadius: responsiveWidth(6),
            borderBottomRightRadius: responsiveWidth(6),
          }}>
          <Wrapper style={{ position: 'absolute', top: tablet ? responsiveHeight(4) : responsiveHeight(2) }}>
            <Logos.CustomBlack />
          </Wrapper>
          <Wrapper
            style={{
              position: 'absolute',
              bottom: -responsiveHeight(3.5),
              borderRadius: scale(120),
              backgroundColor: colors.appBgColor1,
              ...appStyles.shadowDark,
            }}
          >
            {me?.profilePictures?.thumbnails?.big ? (
              <Images.Round
                source={{uri: me.profilePictures.thumbnails.big}}
                size={scale(120)}
              />
            ) : null}
          </Wrapper>
        </Wrapper>
        <Spacer height={responsiveHeight(4)} />
        {me?.username ? (
          <Text isSmallTitle alignTextCenter>
            {me.username}{me?._settings?.currentLang ? `, ${getUserDetail('birthday', me, me._settings.currentLang, t)}` : ''}
          </Text>
        ) : null}
        <Spacer isTiny />
        {(() => {
          // Show city from currentLocation (like old project)
          const city = me?.currentLocation?.city;
          
          return city ? (
            <Text isRegular style={{color: colors.appBorderColor1}} alignTextCenter>
              {city}
            </Text>
          ) : null;
        })()}
        <Spacer isBasic />
      </Wrapper>
    );
  }, [me, t]); // Re-render when user data or language changes

  const menuItems = useMemo(
    () => {
      const items = [
        {
          customIcon: appIcons.user,
          title: t('EDITPROFILE'),
          onPress: handleToggleEditProfileModal,
        },

        {
          customIcon: appIcons.Search,
          title: t('MYSEARCH'),
          onPress: () => {
            navigate(routes.mySearch);
          },
        },
        {
          customIcon: appIcons.Coin,
          title: t('BUYCOINS'),
          isImage: true, // Render as image, not SVG
          onPress: () => {
            navigate(routes.buyCoins);
          },
        },
        {
          customIcon: appIcons.Coin,
          title: t('CREDITBALANCE'),
          isImage: true, // Render as image, not SVG
          onPress: () => {
            navigate(routes.myCredit);
          },
        },
        {
          customIcon: appIcons.wallet,
          title: t('SUBSCRIPTIONS'),
          isImage: true, // Render as image, not SVG
          onPress: () => {
            navigate(routes.subscription);
          },
        },
        {
          customIcon: appIcons.Frame, 
          title: t('RESTOREPURCHASE'),
          isImage: true, // Render as image, not SVG
        },
        {
          customIcon: appIcons.ProfileSetting,
          title: t('SETTINGS'),
          onPress: () => {
            navigate(routes.appSetting);
          },
        },
        {
          customIcon: appIcons.Message,
          title: t('SUPPORT'),
          onPress: () => {
            navigate(routes.support);
          },
        },
      ];
      
      // Admin Panel - only visible for admins
      if (me?.isAdmin === true) {
        items.push({
          customIcon: appIcons.dataSets, 
          title: t('ADMIN_PANEL'),
          onPress: () => {
            navigate(routes.backend);
          },
        });
      }
      
      // Logout always at the end
      items.push({
        customIcon: appIcons.SignOut,
        title: t('LOGOUT'),
        tintColor: colors.appPrimaryColor,
        onPress: async () => {
          setIsLoggingOut(true);
          setLogoutStatus(t('LOGOUT_IN_PROGRESS'));
          
          try {
            await dispatch(signOut());
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            setIsLoggingOut(false);
            setLogoutStatus('');
          }
        },
      });
      
      return items;
    },
    [t, me], // Re-create menu items when language or user data changes
  );
  return {
    HeaderComponent,
    menuItems,
    LocationModalVisible,
    handleToggleLocationModal,
    EditProfileModalVisible,
    handleToggleEditProfileModal,
    isLoggingOut,
    logoutStatus,
  };
}
