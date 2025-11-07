import {StyleSheet, TouchableOpacity} from 'react-native';
import React from 'react';
import {Spacer, Text, Wrapper} from '..';
import {colors, fontSizes, responsiveWidth} from '../../services';
import {Icon} from '@rneui/base';
import { CloseSvgIcon } from '../icons/ProfileIcons';
import {scale} from 'react-native-size-matters';

export function Normal({
  Label,
  RightText,
  NoMargin,
  alignTextCenter,
  FontSize,
}) {
  return (
    <Wrapper
      //backgroundColor={'red'}
      isCenter={alignTextCenter}
      marginHorizontalBase={!NoMargin}
      flexDirectionRow={!alignTextCenter}
      alignItemsCenter={!alignTextCenter}
      justifyContentSpaceBetween={!alignTextCenter}>
      {Label ? (
        <Text
          isMedium
          isBoldFont
          alignTextCenter={alignTextCenter}
          style={[FontSize && {fontSize: FontSize}]}>
          {Label}
        </Text>
      ) : null}
      {RightText ? (
        <Text isRegularFont isRegular isTextColor2>
          {RightText}
        </Text>
      ) : null}
    </Wrapper>
  );
}

export function ModalLabelWithCross({Title, Description, onPress}) {
  return (
    <Wrapper marginHorizontalBase>
      <Wrapper
        flexDirectionRow
        alignItemsCenter
        justifyContentSpaceBetween
        //backgroundColor={'blue'}
      >
        <Text
          isTinyTitle
          style={{
            // backgroundColor: 'red',
            width: responsiveWidth(70),
          }}
          children={Title}
        />
        <TouchableOpacity onPress={onPress}>
          <CloseSvgIcon size={24} color={colors.appBGColor} />
        </TouchableOpacity>
      </Wrapper>
      {Description ? (
        <>
          <Spacer isTiny />
          <Text isTextColor2 isRegular isRegularFont children={Description} />
        </>
      ) : (
        <Spacer isSmall />
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({});
