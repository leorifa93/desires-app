import React, { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Touchable,
  View,
} from 'react-native';
import {
  appFonts,
  appIcons,
  appImages,
  appSvgs,
  colors,
  fontSizes,
  responsiveHeight,
  responsiveWidth,
  sizes,
} from '../../services';
import * as Icons from '../icons';
import Text from '../text';
import {BackgroundImage, Icon} from '@rneui/base';
import {withDecay} from 'react-native-reanimated';
import {LinearGradient} from 'react-native-linear-gradient';
import {Wrapper, Spacer} from '..';
import {scale, verticalScale} from 'react-native-size-matters';
import {TouchableOpacity} from 'react-native-gesture-handler';
import { InfoSvgIcon } from '../icons/ProfileIcons';

export function IconTitleArrow({
  iconImage,
  iconName,
  iconType,
  iconSvg,
  title,
  onPress,
  left,
  right,
  invertColors,
  titleStyle,
  containerStyle,
  disableIconColor,
  arrowColor,
  iconContainerColor,
  ...props
}) {
  const defaulTintColor = !invertColors
    ? colors.appTextColor2
    : colors.appTextColor6;
  const defaulArrowColor =
    arrowColor || (!invertColors ? colors.appTextColor4 : colors.appTextColor6);
  const defaulBackgroundColor =
    iconContainerColor ||
    (!invertColors ? colors.appBgColor1 : colors.appBgColor6);
  return (
    <Pressable activeOpacity={1} onPress={onPress}>
      <Wrapper
        flexDirectionRow
        justifyContentSpaceBetween
        marginHorizontalBase
        alignItemsCenter
        style={containerStyle}
        {...props}>
        <Wrapper flexDirectionRow alignItemsCenter>
          {left ? (
            left
          ) : iconImage || iconName || iconSvg ? (
            <Icons.Button
              customIcon={iconImage}
              iconName={iconName}
              iconType={iconType}
              svgIcon={iconSvg}
              iconColor={!disableIconColor && defaulTintColor}
              iconSize={responsiveWidth(5)}
              buttonColor={defaulBackgroundColor}
              buttonSize={responsiveWidth(10)}
              isRound
              //buttonStyle={{ marginRight: sizes.marginHorizontal }}
            />
          ) : null}
          <Text isMedium style={[{color: defaulTintColor}, titleStyle]}>
            {title}
          </Text>
        </Wrapper>
        {right ? (
          right
        ) : (
          <Icon
            name="chevron-right"
            type="feather"
            color={defaulArrowColor}
            size={sizes.icons.medium}
          />
        )}
      </Wrapper>
    </Pressable>
  );
}

export function Profile({
  isVip,
  isGold,
  isStandard,
  CardImage,
  DeckSwiper,
  onPressHot,
  onPressNot,
  onPress,
  username,
  age,
  distance,
  city,
  interests = [],
  badges = [],
  imagesCount,
  profilePictures,
  publicAlbum,
  onPressPoints,
  isTabletGrid = false,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const styles = StyleSheet.create({
    backgroundLayer: {
      overflow: 'hidden',
    },
    BackgroundImageStyle: {
      height: isTabletGrid ? responsiveHeight(40) : responsiveHeight(60),
      width: isTabletGrid ? '100%' : responsiveWidth(90),
      overflow: 'hidden',
      borderRadius: isTabletGrid ? responsiveWidth(3) : responsiveWidth(4.5),
      resizeMode: 'cover',
    },
    mainContainer: {
      borderRadius: isTabletGrid ? responsiveWidth(3) : responsiveWidth(5),
      //backgroundColor: 'red',
      //overflow: 'hidden',
      // borderWidth: 2,
    },
    ProfileLabel: {
      height: isTabletGrid ? sizes.baseMargin : sizes.doubleBaseMargin,
      width: isTabletGrid ? responsiveWidth(25) : responsiveWidth(40),
      position: 'absolute',
      top: isTabletGrid ? responsiveHeight(1) : responsiveHeight(2),
      left: isTabletGrid ? -responsiveWidth(9) : -responsiveWidth(12),
      backgroundColor: colors.appBgColor1,
      transform: [{rotateZ: '310deg'}],
      justifyContent: 'center',
      alignItems: 'center',
    },
    LocationMainContainer: {
      position: 'absolute',
      top: isTabletGrid ? responsiveHeight(0.8) : responsiveHeight(2),
      right: isTabletGrid ? 3 : 5,
      borderRadius: isTabletGrid ? responsiveWidth(1.5) : responsiveWidth(2),
      backgroundColor: colors.cloud,
    },
    IndexingMainContainer: {
      position: 'absolute',
      // For Home (non-DeckSwiper): bottom centered horizontal indicators
      // For DeckSwiper: we will override inline to keep previous placement if needed
      bottom: isTabletGrid ? responsiveHeight(1) : responsiveHeight(2),
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: isTabletGrid ? responsiveHeight(0.4) : responsiveHeight(0.8),
      backgroundColor: colors.transparent,
    },
  });
  return (
    <Wrapper style={styles.backgroundLayer}>
      <Pressable
        onPress={() => {
          onPress && onPress();
        }}>
        <Wrapper
          style={[
            styles.mainContainer,
            isGold && {borderColor: colors.GoldLabelBackground, borderWidth: isTabletGrid ? 1.5 : 2},
            isVip && {borderColor: colors.appPrimaryColor, borderWidth: isTabletGrid ? 1.5 : 2},
            isStandard && {borderWidth: 0},
          ]}>
          <ImageBackground
            source={CardImage ? (typeof CardImage === 'string' ? {uri: CardImage} : CardImage) : appImages.image2}
            style={[
              styles.BackgroundImageStyle,
              DeckSwiper && {height: responsiveHeight(72)},
              !imageLoaded && { opacity: 0 },
            ]}
            resizeMode="cover"
            loadingIndicatorSource={appImages.image2}
            onLoad={() => setImageLoaded(true)}
            onLoadStart={() => setImageLoaded(false)}>
            {/* Fallback background for when image is not loaded */}
            {!imageLoaded && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: colors.appBgColor2 || '#f0f0f0',
                opacity: 0.8
              }} />
            )}
            <LinearGradient
              colors={['rgba(34, 24, 49, 0)', 'rgba(27, 36, 49, 0.85)']} // Adjust the colors as needed
              start={{x: 0, y: 0}} // Start from the top
              end={{x: 0, y: 1}} // End at the bottom
              style={{flex: 1, justifyContent: 'flex-end'}}>
              <Wrapper
                style={{
                  marginHorizontal: isTabletGrid ? responsiveWidth(3) : responsiveWidth(5),
                  justifyContent: 'center',
                  height: isTabletGrid ? responsiveHeight(8) : responsiveHeight(13)
                }}>
                {/* Profile Details */}
                <Wrapper>
                  <Text 
                    isTinyTitle={!isTabletGrid}
                    isSmall={isTabletGrid}
                    isWhite 
                    children={`${username}${age ? ', ' + age : ''}`} 
                  />
                  <Spacer height={isTabletGrid ? responsiveHeight(0.3) : responsiveHeight(0.8)} />
                  <Text 
                    isRegular={!isTabletGrid}
                    isTiny={isTabletGrid}
                    isWhite 
                    children={city} 
                  />
                  <Spacer height={isTabletGrid ? responsiveHeight(0.5) : responsiveHeight(1.5)} />
                  {!isTabletGrid && (
                    <Wrapper flexDirectionRow gap={responsiveWidth(2)}>
                      {(badges.length > 0 ? badges : interests).slice(0, 2).map((item, index) => (
                        <Wrapper
                          key={index}
                          paddingVerticalTiny
                          paddingHorizontalSmall
                          backgroundColor={colors.appBgColor1}
                          style={{borderRadius: responsiveWidth(2)}}>
                          <Text isTiny children={item} />
                        </Wrapper>
                      ))}
                    </Wrapper>
                  )}
                  <Spacer height={isTabletGrid ? verticalScale(3) : verticalScale(10)} />
                </Wrapper>
                {/* Location Btn */}
                <Wrapper
                  style={[
                    styles.LocationMainContainer,
                    {
                      paddingHorizontal: isTabletGrid ? responsiveWidth(1) : responsiveWidth(2),
                      paddingVertical: isTabletGrid ? responsiveHeight(0.3) : responsiveHeight(0.8),
                    }
                  ]}>
                  <Icons.WithText
                    customIcon={appIcons.LocationLogo}
                    iconSize={isTabletGrid ? responsiveWidth(2.5) : responsiveWidth(4.8)}
                    text={distance}
                    tintColor={'#FFFFFF'}
                    textStyle={{
                      fontSize: isTabletGrid ? 9 : fontSizes.small,
                      fontFamily: appFonts.appTextMedium,
                      color: '#FFFFFF',
                    }}
                  />
                </Wrapper>
              </Wrapper>
              {/* the Dreck Swip card Buttons  */}
              {DeckSwiper ? (
                <Wrapper
                  paddingVerticalBase
                  marginHorizontalBase
                  //backgroundColor={'green'}
                  flexDirectionRow
                  justifyContentSpaceBetween
                  alignItemsCenter>
                  <Icons.Svg
                    svg={appSvgs.like}
                    size={scale(90)}
                    onPress={() => {
                      onPressHot();
                    }}
                  />
                  <Icons.Svg svg={InfoSvgIcon} size={scale(56)} onPress={onPress} />
                  <Icons.Svg
                    svg={appSvgs.dislike}
                    size={scale(90)}
                    onPress={() => {
                      onPressNot();
                    }}
                  />
                </Wrapper>
              ) : null}
            </LinearGradient>
          </ImageBackground>
          {/* Label */}
          {isVip || isGold || isStandard ? (
            <View
              style={[
                styles.ProfileLabel,
                isGold && {backgroundColor: colors.GoldLabelBackground},
                isStandard && {backgroundColor: colors.appBGColor},
              ]}>
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: isTabletGrid ? fontSizes.small : fontSizes.regular,
                  fontWeight: 'bold',
                  color: isVip ? colors.appPrimaryColor : '#fff',
                }}
                children={isVip ? 'VIP' : isGold ? 'Gold' : 'Standard'}
              />
            </View>
          ) : null}
        </Wrapper>
      </Pressable>
    </Wrapper>
  );
}
