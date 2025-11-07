import React from 'react';
import {
  appIcons,
  appImages,
  appStyles,
  appSvgs,
  colors,
  fontSize,
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
  sizes,
  useSizes,
} from '../../services';
//import {Icons, Wrapper, Text } from '..'
import {goBack} from '../../navigation/rootNavigation';
import * as Icons from '../icons';
import Wrapper from '../wrapper';
import Text from '../text';
import {Pressable, TouchableOpacity} from 'react-native';
import Spacer from '../spacer';
import * as StatusBars from '../statusBars';
import {Images, Logos} from '..';
import {ZoomIn} from 'react-native-reanimated';
import {Icon, Badge} from '@rneui/base';
import {scale} from 'react-native-size-matters';

// export const Primary = ({ onBackPress, title, right, left, showBackArrow,shadow,titleStyle,titleContainerStyle,containerStyle }) => {
//     return (
//         <Wrapper style={[appStyles.headerStyle,appStyles.justifyContentFlexstart, {  paddingTop: sizes.statusBarHeight*1.25,backgroundColor:'red' },shadow&&appStyles.shadow,containerStyle]}>
//             <Wrapper flexDirectionRow justifyContentSpaceBetween>
//                 <Wrapper isAbsolute style={[appStyles.center, { right: 0, left: 0, },titleContainerStyle]}>
//                     <Text style={[appStyles.headerTitleStyle,appStyles.textCenter,titleStyle]}>{title}</Text>
//                 </Wrapper>
//                 {
//                     left ? left :
//                         showBackArrow ?
//                             <Icons.Back
//                                 onPress={onBackPress ?onBackPress : goBack}
//                                 style={[appStyles.paddingHorizontalSmall,appStyles.paddingVerticalTiny,]}
//                             />
//                             :
//                             null
//                 }
//                 {right ? right : null}
//             </Wrapper>
//         </Wrapper>
//     )
// }

export function Primary({
  onBackPress,
  search,
  title,
  right,
  searchPress,
  left,
  titleContainerStyle,
  centerTitle,
  tintColor,
  containerStyle,
  headerTitle,
  alignTitleLeft,
  showBackArrow,
  invertColors,
  titleStyle,
  leftContainerStyle,
  rightContainerStyle,
  shadow,
  auth,
}) {
  const {statusBarHeight, headerHeight} = useSizes();
  const defaultTintColor = !invertColors ? colors.appBGColor : colors.appColor1;
  const defaultBackgroundColor = !invertColors
    ? colors.appBgColor1
    : colors.appBgColor1;
  return (
    <Wrapper
      style={[
        appStyles.headerStyle,
        {
          height: headerHeight,
          backgroundColor: defaultBackgroundColor,
          borderBottomWidth: 0,
          paddingTop: statusBarHeight,
          paddingBottom: responsiveHeight(1),
        },
        shadow && appStyles.shadowLight,
        containerStyle,
      ]}>
      <StatusBars.Dark />
      <Wrapper flex={1} flexDirectionRow alignItemsCenter style={{}}>
        {/* <Wrapper isAbsolute
                    style={[
                        { right: 0, left: 0, backgroundColor: 'green', },
                        alignTitleLeft ?
                            {
                                paddingLeft: responsiveWidth(17.5),
                                paddingRight: sizes.marginHorizontal
                            }
                            :
                            appStyles.center,
                        titleContainerStyle]}>
                    {
                        headerTitle ? headerTitle :
                            <Text isTinyTitle numberOfLines={1} style={{ color: tintColor ? tintColor : defaultTintColor }}>{title}</Text>
                    }
                </Wrapper> */}
        <Wrapper
          flex={1.5}
          style={[
            //{backgroundColor: 'red'},
            leftContainerStyle,
          ]}>
          {left ? (
            left
          ) : showBackArrow ? (
            <Pressable
              style={[{flex: 1}, appStyles.center]}
              onPress={onBackPress ? onBackPress : goBack}>
              <Icons.Custom
                icon={appIcons.Back}
                containerStyle={{
                  borderWidth: 1,
                  padding: responsiveWidth(2),
                  borderRadius: responsiveWidth(100),
                  borderColor: colors.appBorderColor2,
                }}
                size={scale(24)}
                //onPress={onBackPress}
                //onPress={onBackPress ? onBackPress : goBack}
                // style={{ marginLeft: sizes.marginHorizontal }}
                color={tintColor ? tintColor : defaultTintColor}
              />
            </Pressable>
          ) : null}
        </Wrapper>
        <Wrapper
          flex={7}
          style={[
            // { backgroundColor: 'green', },
            alignTitleLeft
              ? appStyles.alignItemsFlexStart
              : appStyles.alignItemsCenter,
            titleContainerStyle,
          ]}>
          {headerTitle ? (
            headerTitle
          ) : (
            <Text
              alignTextCenter
              style={[
                appStyles.headerTitleStyle,
                {
                  color: tintColor ? tintColor : defaultTintColor,
                  fontSize: !auth
                    ? responsiveFontSize(16)
                    : responsiveFontSize(16),
                },
                titleStyle,
              ]}>
              {title}
            </Text>
          )}
        </Wrapper>

        {/* {right ?
                    right
                    :
                    <Wrapper flex={1.5}></Wrapper>
                } */}
        <Wrapper flex={1.5} style={rightContainerStyle}>
          {right ? right : <></>}
        </Wrapper>
      </Wrapper>
    </Wrapper>
  );
}

export function Auth({...PrimaryProps}) {
  return (
    <Wrapper animation={'slideInDown'}>
      <Primary showBackArrow {...PrimaryProps} />
      <Wrapper
        alignItemsCenter
        backgroundColor={colors.appColor1}
        style={{borderBottomRightRadius: 40, borderBottomLeftRadius: 40}}>
        <Spacer isBasic />
        <appSvgs.logo_white
          height={responsiveHeight(10)}
          width={responsiveWidth(80)}
        />
        <Spacer isDoubleBase />
        <Spacer isBasic />
      </Wrapper>
    </Wrapper>
  );
}

export function Common({
  invertColors,
  shadow,
  RightButtons,
  containerStyle,
  StatusBarsLight,
  MainBackgroundColor,
  Title,
  TitleStyle,
  NoProfile,
  rightContainerStyle,
  titleAlignRight,
}) {
  const {statusBarHeight, headerHeight} = useSizes();
  const defaultTintColor = !invertColors
    ? colors.appTextColor6
    : colors.appBgColor1;
  const defaultBackgroundColor = !invertColors
    ? colors.appBgColor1
    : colors.appBgColor1;

  return (
    <Wrapper
      paddingVerticalSmall
      style={[
        appStyles.headerStyle,
        {
          //height: headerHeight,
          backgroundColor: MainBackgroundColor
            ? MainBackgroundColor
            : defaultBackgroundColor,
          borderBottomWidth: 0,
          //paddingBottom: responsiveHeight(1),
          marginTop: sizes.statusBarHeight,
        },
        shadow && appStyles.shadowLight,
        containerStyle,
      ]}>
      {StatusBarsLight ? <StatusBarsLight /> : <StatusBars.Dark />}
      <Wrapper
        flexDirectionRow
        alignItemsCenter
        justifyContentSpaceBetween
        // backgroundColor={'red'}
        marginHorizontalBase>
        {Title ? <Text isSmallTitle style={TitleStyle} children={Title} /> : <Logos.CustomBlack />}
        <Wrapper //backgroundColor={'blue'}
          alignItemsCenter
          flexDirectionRow
          style={[{ marginLeft: 'auto' }, rightContainerStyle]}>
          {RightButtons
            ? RightButtons.map((item, index) =>
                item?.profile ? (
                  <TouchableOpacity key={index} onPress={item?.onPress}>
                    <Wrapper>
                      <Images.Round
                        source={{uri: item?.profile}}
                        size={responsiveWidth(11)}
                      />
                      {item?.showBadge && item?.badgeValue > 0 ? (
                        <Wrapper
                          isAbsolute
                          isCenter
                          style={{top: -6, right: -6, ...appStyles.shadowExtraDark}}>
                          <Badge
                            containerStyle={[appStyles.center]}
                            value={item.badgeValue}
                            textStyle={[
                              appStyles.textTiny,
                              appStyles.textWhite,
                              appStyles.fontBold,
                            ]}
                            badgeStyle={[
                              appStyles.center,
                              {
                                backgroundColor: colors.appPrimaryColor,
                                borderWidth: 0,
                                borderRadius: 100,
                                minWidth: responsiveWidth(5),
                                height: responsiveWidth(5),
                              },
                            ]}
                          />
                        </Wrapper>
                      ) : null}
                    </Wrapper>
                  </TouchableOpacity>
                ) : (
                  <Icons.Button
                    key={index}
                    showBadge={item?.badgeValue}
                    badgeValue={item?.badgeValue}
                    badgeStyle={{...appStyles.shadowExtraDark}}
                    //buttonSize={responsiveWidth(5)}
                    isRound
                    iconSize={responsiveWidth(6)}
                    customPadding={item?.customPadding}
                    isWithBorder={item?.isWithBorder}
                    customIcon={item?.IconName}
                    svgIcon={item?.svgIcon}
                    iconName={item?.iconName}
                    iconType={item?.iconType}
                    onPress={item?.onPress}
                    buttonStyle={[
                      {
                        backgroundColor: colors.appBgColor1,
                        zIndex: RightButtons.length - index,
                      },

                      !(RightButtons.length == 1) &&
                        RightButtons.length > 2 && {
                          left:
                            index == 0
                              ? responsiveWidth(6.5)
                              : index + 1 === RightButtons.length
                              ? 0
                              : responsiveWidth((RightButtons.length - 1 - index) * 2.4),
                        },
                      RightButtons.length == 2 && {
                        left: index == 0 ? responsiveWidth(2.5) : 0,
                      },
                    ]}
                  />
                ),
              )
            : null}
        </Wrapper>
      </Wrapper>
    </Wrapper>
  );
}
