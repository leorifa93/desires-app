import React, {useState, useEffect} from 'react';
// import { Wrapper, Icons, Text } from '..'
import Wrapper from '../wrapper';
import * as Icons from '../icons';
import Text from '../text';
import {
  colors,
  handleAnimation,
  HelpingMethods,
  sizes,
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
  appStyles,
} from '../../services';
import {MyAnimated} from '..';
import {PixelRatio, Pressable, Touchable, TouchableOpacity} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';

export const Primary = ({value, onPress, tintColor}) => {
  const defaultTintColor =
    tintColor || value ? colors.appColor1 : colors.appBgColor5;
  return (
    <Wrapper style={{}} isCenter>
      <Icons.Button
        iconName={'circle'}
        iconType="font-awesome"
        activeOpacity={1}
        iconSize={responsiveFontSize(2.5)}
        buttonStyle={{
          width: responsiveFontSize(5),
          alignItems: value ? 'flex-end' : 'flex-start',
          height: null,
          borderRadius: 100,
          borderWidth: 1,
          borderColor: defaultTintColor,
          paddingHorizontal: 1.75,
          paddingVertical: 0.1,
          backgroundColor: colors.transparent,
        }}
        iconColor={defaultTintColor}
        buttonRadius={100}
        onPress={
          onPress
            ? () => {
                handleAnimation();
                onPress();
              }
            : null
        }
      />
    </Wrapper>
  );
};
// export const Primary = ({ value, onPress }) => {
//     return (
//         <Wrapper style={{}} isCenter>
//             <Icons.Button
//                 iconName={"circle"}
//                 iconType="font-awesome"
//                 activeOpacity={1}
//                 iconSize={responsiveFontSize(2.5)}
//                 buttonStyle={{
//                     width: responsiveFontSize(5),
//                     alignItems: value ? 'flex-end' : 'flex-start',
//                     height: null,
//                     borderRadius: 100,
//                     //borderWidth: 1,
//                     borderColor: colors.appBgColor3,
//                     paddingHorizontal: 1.75,
//                     paddingVertical: 0.1,
//                     backgroundColor: value?colors.appColor1+'20':colors.appBgColor3,
//                 }}
//                 iconColor={value ? colors.appColor1 : colors.appBgColor4}
//                 buttonRadius={100}
//                 onPress={onPress ? () => {
//                     handleAnimation()
//                     onPress()
//                 } : null}
//             />
//         </Wrapper>
//     )
// }

export const Secondary = ({value, onPress}) => {
  return (
    <Wrapper style={{}} isCenter>
      <Icons.Button
        iconName={'circle'}
        iconType="font-awesome"
        activeOpacity={1}
        iconSize={responsiveFontSize(6)}
        buttonStyle={{
          width: responsiveFontSize(16),
          alignItems: !value ? 'flex-end' : 'flex-start',
          height: null,
          borderRadius: 100,
          borderWidth: 0,
          borderColor: value ? colors.appColor1 : colors.appBgColor3,
          paddingHorizontal: 1.75,
          paddingVertical: 0.1,
        }}
        iconColor={value ? colors.appColor2 : colors.error}
        buttonRadius={100}
        onPress={
          onPress
            ? () => {
                handleAnimation();
                onPress();
              }
            : null
        }
      />
      <Wrapper
        isAbsolute
        style={[
          value
            ? {right: sizes.marginHorizontal / 1.5}
            : {left: sizes.marginHorizontal / 1.5},
        ]}>
        <Text
          isSmall
          style={[{color: value ? colors.appColor2 : colors.error}]}>
          {value ? 'ON' : 'OFF'}
        </Text>
      </Wrapper>
    </Wrapper>
  );
};

export const Custom = ({value, onValueChange}) => {
  const [SwitchOn, setSwitchOn] = useState(value || false);

  // Update local state when external value changes
  useEffect(() => {
    setSwitchOn(value || false);
  }, [value]);

  const handleToggle = () => {
    const newValue = !SwitchOn;
    setSwitchOn(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <Pressable onPress={handleToggle}>
      <Wrapper
        justifyContentCenter
        style={{
          height: responsiveHeight(3.3),
          width: responsiveWidth(12),
          borderRadius: responsiveWidth(6),
          paddingHorizontal: responsiveWidth(0.5),
        }}
        backgroundColor={SwitchOn ? colors.appBGColor : colors.appBorderColor2}>
        <MyAnimated.AnimatedView
          NotFlexed
          width={-responsiveWidth(5)}
          onPressStart={SwitchOn}
          onPressClosed={!SwitchOn}
          onStartDuration={300}
          onReturnDuration={300}>
          <Wrapper
            style={{
              height: scale(19),
              width: scale(20),
              borderRadius: responsiveWidth(6),
              backgroundColor: colors.appBgColor1,
              //...appStyles.shadowDark,
            }}
          />
        </MyAnimated.AnimatedView>
      </Wrapper>
    </Pressable>
  );
};
