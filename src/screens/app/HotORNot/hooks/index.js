import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Buttons, Icons, Spacer, Text, Wrapper} from '../../../../components';
import {
  api,
  appIcons,
  appImages,
  responsiveHeight,
  responsiveWidth,
  routes,
} from '../../../../services';
import { verticalScale } from 'react-native-size-matters';
import { navigate } from '../../../../navigation/rootNavigation';
import { useTranslation } from 'react-i18next';

export function useHooks() {
  const { t } = useTranslation();
  const [SwipeTrun, setSwipeTrun] = useState(0);
  const [SwipeDeckData, setSwipeDeckData] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(null);

  const Data = useMemo(
    () => [
      {
        id: '1',
        image: appImages.image4, // Replace with your actual image source
        name: 'Card 1',
        description: 'Description for Card 1',
      },
      {
        id: '2',
        image: appImages.image2, // Replace with your actual image source
        name: 'Card 2',
        description: 'Description for Card 2',
      },
      {
        id: '3',
        image: appImages.image3, // Replace with your actual image source
        name: 'Card 3',
        description: 'Description for Card 3',
      },
      {
        id: '4',
        image: appImages.image4, // Replace with your actual image source
        name: 'Card 4',
        description: 'Description for Card 4',
      },
    ],
    [],
  );

  const TopRightButtonsData = useMemo(() => [
    {
      IconName: appIcons.Search,
      customPadding: responsiveWidth(2.5),
      isWithBorder: true,
    },
    {
      IconName: appIcons.filterIcon,
      customPadding: responsiveWidth(2.5),

      isWithBorder: true,
    },
    {
      IconName: appIcons.Heart,
      customPadding: responsiveWidth(2.5),
      isWithBorder: true,
      onPress: () => navigate(routes.notifications),
    },
  ]);

    const fetchSwipeData = async (user) => {
    try {
      //setIsLoading(true);

      const response = await api.post(
        'http://127.0.0.1:5001/dexxire-dfcba/us-central1/apiUsers-getDatingUsers',
        {
          currentLocation: user.currentLocation,
          user: user
        }
      );
      const data = await response.data;

      // Beispiel: Stelle sicher, dass data ein Array ist, sonst leere Liste
      setSwipeDeckData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fehler beim Laden der Karten:', error);
      setSwipeDeckData([]);
    } finally {
      //setIsLoading(false);
    }
  };

  const RenderEmptyList = React.memo(({ onRefresh }) => {
    return (
      <Wrapper
        isCenter
        flex={1}
        //backgroundColor={'red'}
        style={{height: responsiveHeight(75)}}>
        <Icons.Custom
          icon={appIcons.EmptyListHotorNot}
          size={responsiveWidth(50)}
        />
        <Text
          alignTextCenter
          isRegular
          isRegularFont
          isTextColor2
          style={{width: responsiveWidth(60)}}>
          {t('NO_USERS_FOUND')}
        </Text>

        <Spacer isMedium />
        <Wrapper style={{width: responsiveWidth(60)}}>
          <Buttons.Colored
            text={t('APPLY')}
            onPress={onRefresh}
          />
        </Wrapper>
      </Wrapper>
    );
  });
  const updateSwipeDeckData = (newUsers, usedIds = []) => {
    // Filter out already used users
    const filteredUsers = newUsers.filter(user => 
      !usedIds.includes(user.id || user.userId || user.uid)
    );
    console.log('Hot or Not hooks: Updating SwipeDeckData with', filteredUsers.length, 'filtered users (from', newUsers.length, 'total)');
    
    // Set immediately to avoid async issues
    setSwipeDeckData(filteredUsers);
  };

  return {
    TopRightButtonsData,
    RenderEmptyList,
    SwipeDeckData,
    setSwipeDeckData,
    updateSwipeDeckData,
    SwipeTrun,
    setSwipeTrun,
    currentCardIndex,
    setCurrentCardIndex,
    fetchSwipeData
  };
}
