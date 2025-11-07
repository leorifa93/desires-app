import React, {useMemo, useState, useEffect} from 'react';
import {Buttons, Icons, Spacer, Text, Wrapper} from '../../../../components';
import {
  appIcons,
  appImages,
  responsiveHeight,
  responsiveWidth,
  routes,
} from '../../../../services';
import {navigate} from '../../../../navigation/rootNavigation';
import { useSelector } from 'react-redux';
import { getRangPosition } from '../../../../services/firebaseUtilities/user';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

export function useHooks() {
  const [FilterModal, setFilterModal] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(1);
  const [privateGalleryRequestsCount, setPrivateGalleryRequestsCount] = useState(0);
  const me = useSelector(state => state.auth.user);
  const { t } = useTranslation();

  useEffect(() => {
    if (me) {
      getCurrentPosition();
      
      // Update position every 30 seconds to keep it current
      const interval = setInterval(() => {
        getCurrentPosition();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [me]);

  // Count private gallery requests (like old project badge)
  useEffect(() => {
    if (me?._privateGalleryRequests) {
      setPrivateGalleryRequestsCount(me._privateGalleryRequests.length);
    } else {
      setPrivateGalleryRequestsCount(0);
    }
  }, [me?._privateGalleryRequests]);

  const getCurrentPosition = async () => {
    try {
      const position = await getRangPosition(me);
      setCurrentPosition(position);
    } catch (error) {
      console.error('Error getting position:', error);
      setCurrentPosition(1);
    }
  };

  const FilterModalToggle = () => {
    setFilterModal(!FilterModal);
  };

  // Search Icon SVG Component
  const SearchIconSvg = ({ size = 24, color = '#272829' }) => (
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

  const HomeTopRightButtonsData = useMemo(() => [
    {
      IconName: appIcons.sendIcon,
      customPadding: responsiveWidth(2.5),
      isWithBorder: true,
      badgeValue: currentPosition,
      onPress: () => {
        navigate(routes.position);
      },
    },
    {
      svgIcon: SearchIconSvg,
      customPadding: responsiveWidth(2.5),
      isWithBorder: true,
      onPress: () => {
        navigate(routes.userSearch);
      },
    },
    {
      IconName: appIcons.filterIcon,
      customPadding: responsiveWidth(2.5),
      notify: 8,
      isWithBorder: true,
      onPress: FilterModalToggle,
    },
    {
      profile: me?.profilePictures?.thumbnails?.small,
      showBadge: privateGalleryRequestsCount > 0,
      badgeValue: privateGalleryRequestsCount,
      onPress: () => {
        navigate(routes.userProfile);
      },
    },
  ], [currentPosition, privateGalleryRequestsCount, me?.profilePictures?.thumbnails?.small]);

  const renderEmptyList = React.memo(() => {
    return (
      <Wrapper
        isCenter
        flex={1}
        //backgroundColor={'red'}
        style={{height: responsiveHeight(75)}}>
        <Icons.Custom
          icon={appIcons.EmptyListHome}
          size={responsiveWidth(50)}
        />
        <Text alignTextCenter isRegular isRegularFont isTextColor2>
          {t('NO_PEOPLE_FOUND_WITHIN_RADIUS')}
        </Text>
        <Text isRegular isRegularFont>
          {t('APPLY_CUSTOMIZE_SEARCH_FILTER')}
        </Text>
        <Spacer isMedium />
        <Wrapper style={{width: responsiveWidth(75)}}>
          <Buttons.Colored 
            text={t('CHANGESEARCHFILTER')} 
            onPress={FilterModalToggle}
          />
        </Wrapper>
      </Wrapper>
    );
  });

  const CardsData = useMemo(() => [
    {image: appImages.image2, isVip: true},
    {image: appImages.image3, isGold: true},
    {image: appImages.image4, isStandard: true},
  ]);
  return {
    renderEmptyList,
    HomeTopRightButtonsData,
    FilterModal,
    FilterModalToggle,
    CardsData,
  };
}
