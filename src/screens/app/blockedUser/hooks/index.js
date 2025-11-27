import {
  Dimensions,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  appFonts,
  appIcons,
  appImages,
  appStyles,
  colors,
  fontSizes,
  responsiveHeight,
  responsiveWidth,
  calcDistance,
  getApprovedImageSource,
} from '../../../../services';
import {scale} from 'react-native-size-matters';
import {
  Icons,
  Images,
  Lines,
  Spacer,
  Text,
  Wrapper,
} from '../../../../components';
import {useMemo, useState} from 'react';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {navigate} from '../../../../navigation/rootNavigation';
import {routes} from '../../../../services';

export function useHooks() {
  const me = useSelector(state => state.auth.user);
  const {t} = useTranslation();
  
  const FriendRenderDetail = ({Detail, onUnblock}) => {
    const Height = Dimensions.get('screen').height;
    const [ShowOption, setShowOption] = useState(false);
    
    // Calculate distance
    const distance = useMemo(() => {
      if (!me?.currentLocation || !Detail?.currentLocation) return '0 km';
      
      const dis = Number(
        calcDistance(
          me.currentLocation.lat,
          me.currentLocation.lng,
          Detail.currentLocation.lat,
          Detail.currentLocation.lng,
          5,
        ),
      );
      const distanceType = me?._settings?.units?.distanceType === 'Mi' ? 'Mi' : 'Km';
      const distanceValue = distanceType === 'Mi' ? dis * 0.621371 : dis;
      return distanceValue > 99
        ? `>99${distanceType}`
        : (distanceValue > 0 ? distanceValue.toFixed(1) : distanceValue) + distanceType;
    }, [me?.currentLocation, Detail?.currentLocation, me?._settings?.units?.distanceType]);
    
    // Get user image
    const imageSource = useMemo(() => {
      if (!Detail) return appImages.image4;
      const source = getApprovedImageSource(Detail.profilePictures, Detail.gender, me?.id, Detail?.id);
      return source ? {uri: source} : appImages.image4;
    }, [Detail?.profilePictures, Detail?.gender, me?.id, Detail?.id]);
    
    // Get location string
    const locationString = useMemo(() => {
      if (Detail?.currentLocation?.city && Detail?.currentLocation?.country) {
        return `${Detail.currentLocation.city}, ${Detail.currentLocation.country}`;
      }
      // Handle location as object or string
      if (Detail?.location) {
        if (typeof Detail.location === 'string') {
          return Detail.location;
        }
        if (typeof Detail.location === 'object' && Detail.location.location) {
          return Detail.location.location;
        }
        if (typeof Detail.location === 'object' && Detail.location.city) {
          return `${Detail.location.city}${Detail.location.country ? ', ' + Detail.location.country : ''}`;
        }
      }
      return 'Unknown';
    }, [Detail?.currentLocation, Detail?.location]);
    
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
      <View style={{flex: 1}}>
        <Wrapper
          flexDirectionRow
          marginHorizontalBase
          alignItemsCenter>
          {/* Image */}
          <Wrapper>
            <Pressable
              onPress={() => {
                navigate(routes.userProfile, {visiterProfile: true, userId: Detail?.id});
              }}>
              <Images.Round source={imageSource} size={scale(48)} />
            </Pressable>
            {/* Badge */}
            {Detail?.isOnline ? (
              <Wrapper isAbsolute style={styles.BadgeMainContainer}>
                <Wrapper style={styles.BadgeInnerContainer} />
              </Wrapper>
            ) : null}
          </Wrapper>
          {/* Text Name And Id */}
          <Wrapper
            marginHorizontalSmall
            style={{width: responsiveWidth(56)}}>
            <Text isRegular isBoldFont>
              {Detail?.username || 'Unknown'}, {Detail?.age || 'N/A'}
            </Text>
            <Text isSmall isRegularFont isTextColor2>
              {locationString} - {distance}
            </Text>
          </Wrapper>
          {/* Unblock Button */}
          <Wrapper
            flex={1}
            alignItemsFlexEnd
            style={{height: responsiveHeight(4)}}>
            <TouchableOpacity onPress={onUnblock}>
              <Text isPrimaryColor isSmall isMediumFont>
                {t('NOTBLOCKPROFILE') || 'Unblock'}
              </Text>
            </TouchableOpacity>
          </Wrapper>
        </Wrapper>
        <Spacer isSmall />
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
  };

  return {FriendRenderDetail};
}
