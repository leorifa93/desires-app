import React from 'react'
import { View, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native'
import { Icon } from '@rneui/base';
import { colors, appStyles, sizes,responsiveHeight,responsiveWidth,responsiveFontSize } from '../../services';
import {
    BallIndicator,
    BarIndicator,
    DotIndicator,
    MaterialIndicator,
    PacmanIndicator,
    PulseIndicator,
    SkypeIndicator,
    UIActivityIndicator,
    WaveIndicator,
} from 'react-native-indicators';
import Wrapper from '../wrapper';
import Text from '../text';
import { useTranslation } from 'react-i18next';
import Spacer from '../spacer';


export function Primary  ({ })  {
    return (
        <Wrapper isMain>
            <Wrapper flex={1} style={[{ justifyContent: 'center', backgroundColor: 'transparent' }]}>
                <Wrapper style={[appStyles.center, { backgroundColor: 'transparent' }]}>
                    <WaveIndicator color={colors.appColor1} size={sizes.icons.xxl} />
                    <Spacer isBasic />
                    <Text isRegular isLightGray style={[appStyles.textLightGray]}>Loading</Text>
                </Wrapper>
            </Wrapper>
        </Wrapper>
    );
}


export function Secondary ({ isVisible }) {
    return (
        <>
            {
                isVisible ?
                    <Wrapper isAbsoluteFill animation="fadeIn" style={[{ justifyContent: 'center', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.appBgColor1 + 'BF' }]}>
                        <Wrapper style={[appStyles.center, { backgroundColor: 'transparent' }]}>
                            <BallIndicator color={colors.appColor1} size={sizes.icons.xxl} />
                            <Spacer isBasic />
                            <Text isRegular >Loading</Text>
                        </Wrapper>
                    </Wrapper>
                    :
                    null
            }
        </>
    );
}

// Global, reusable top banner to indicate background uploads (e.g., public pictures)
export function UploadBanner({ visible, text }) {
    const { t } = useTranslation();
    if (!visible) return null;
    const label = text || t('UPLOADING_PHOTOS');
    return (
        <View 
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                pointerEvents: 'box-none',
                justifyContent: 'flex-start',
                alignItems: 'center',
                paddingTop: 50
            }}
            pointerEvents="box-none"
        >
            <Wrapper
                style={{
                    marginTop: responsiveHeight(2),
                    backgroundColor: colors.appBgColor1,
                    borderRadius: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    ...appStyles.shadowDark,
                    flexDirection: 'row',
                    alignItems: 'center',
                    maxWidth: responsiveWidth(92)
                }}
                pointerEvents="none"
            >
                <ActivityIndicator size="small" color={colors.appPrimaryColor} />
                <Text isRegular style={{ marginLeft: 10 }}>{label}</Text>
            </Wrapper>
        </View>
    );
}