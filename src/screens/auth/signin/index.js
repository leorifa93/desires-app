import React, { Component, useState } from 'react';
import {
  Text,
  TextInputs,
  Buttons,
  ScrollViews,
  Wrapper,
  Spacer,
  Headers,
  Logos,
  MyAnimated,
  Images,
  Icons,
  Lines,
  Modals,
} from '../../../components';
import {
  responsiveFontSize,
  responsiveHeight,
  routes,
  appSvgs,
  responsiveWidth,
  sizes,
  colors,
  appIcons,
  fontSizes,
  appFonts,
  appStyles,
  useKeyboardStatus,
} from '../../../services';
import { useHooks } from './hooks';
import { Image, Keyboard, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Icon } from '@rneui/base';
import { scale, verticalScale } from 'react-native-size-matters';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import WebViewModal from '../../../components/WebViewModal';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { version } from '../../../../package.json';

const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().nonempty("Bitte gib ein Passwort ein!"),
})

export default function Index({ handleCurrentPage }) {
  const { t, i18n } = useTranslation();
  const user = useSelector(state => state.auth.user);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [webViewTitle, setWebViewTitle] = useState('');
  
  const openTerms = () => {
    const lang = user?._settings?.currentLang || i18n.language || 'en';
    const urls = {
      de: 'https://desires.app/de/agb/',
      en: 'https://desires.app/terms/',
      es: 'https://desires.app/es/terminos/',
      fr: 'https://desires.app/fr/conditions-generales/',
    };
    setWebViewTitle(t('TERMS_AND_CONDITIONS'));
    setWebViewUrl(urls[lang] || urls.en);
    setWebViewVisible(true);
  };
  
  const openPrivacy = () => {
    const lang = user?._settings?.currentLang || i18n.language || 'en';
    const urls = {
      de: 'https://desires.app/de/datenschutz/',
      en: 'https://desires.app/privacy-policy/',
      es: 'https://desires.app/es/politica-de-privacidad/',
      fr: 'https://desires.app/fr/conditions-generales/',
    };
    setWebViewTitle(t('PRIVACY_POLICY'));
    setWebViewUrl(urls[lang] || urls.en);
    setWebViewVisible(true);
  };
  
  const {
    handleLogin,
    SecurePassword,
    InputFocused,
    LoginIconsData,
    ForgotPasswordModal,
    isLoggingIn,
    resetEmail,
    setResetEmail,
    isResetting,
    //function
    handleInputFocused,
    handleSecurePassword,
    handleForgotPasswordModal,
    handleResetPassword,
  } = useHooks();
  const isKeyboradOpen = useKeyboardStatus();
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });
  const signIn = (data) => {
    handleLogin(data.email, data.password);
  };

  return (
    <Wrapper>
      <Wrapper
        paddingVerticalMedium
        backgroundColor={colors.appBgColor1}
        style={styles.DownMainContainer}>
          <Wrapper marginHorizontalBase>
            <Text isSmallTitle children={t('LOGIN')} />
            <Spacer isSmall />
            <Text
              isRegular
              isTextColor2
              style={{}}
              children={t('ENTERLOGIN')}
            />
          </Wrapper>
          <Spacer isMedium />
          <TextInputs.Bordered
            placeholder={t('EMAIL')}
            onFocus={value => {
              value && handleInputFocused({ FocusedOn: 'Email' });
            }}
            isFocusedContainerColor={InputFocused === 'Email' && colors.black}
            customIconRight={appIcons.Email}
            iconSizeRight={responsiveWidth(6.5)}
            iconColorRight={colors.appTextColor1}
            onChangeText={(text) => setValue("email", text)}
          />
          <Wrapper
            flexDirectionRow
            alignItemsCenter
            justifyContentSpaceBetween
            marginHorizontalBase
          >
            <Spacer isSmall horizontal />
            {errors.email && <Text isRegular isPrimaryColor children={errors.email.message} />}
          </Wrapper>
          <Spacer isSmall />
          <TextInputs.Bordered
            placeholder={t('PASSWORD')}
            secureTextEntry={SecurePassword}
            onFocus={value => {
              value && handleInputFocused({ FocusedOn: 'Password' });
            }}
            isFocusedContainerColor={InputFocused === 'Password' && colors.black}
            right={
              <TouchableOpacity onPress={handleSecurePassword}>
                {SecurePassword ? (
                  <Svg width={responsiveWidth(6)} height={responsiveWidth(6)} viewBox="0 0 24 24" fill="none">
                    <Path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke={colors.appTextColor1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={colors.appTextColor1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                ) : (
                  <Svg width={responsiveWidth(6)} height={responsiveWidth(6)} viewBox="0 0 24 24" fill="none">
                    <Path d="M3 3L21 21" stroke={colors.appTextColor1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M10.584 10.586A3 3 0 0012 15C13.657 15 15 13.657 15 12c0-.415-.084-.81-.236-1.168" stroke={colors.appTextColor1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M9.88 4.26A10.78 10.78 0 0112 4c7 0 11 8 11 8a20.7 20.7 0 01-3.24 4.26M6.24 6.24A20.7 20.7 0 001 12s4 8 11 8c1.104 0 2.16-.197 3.156-.56" stroke={colors.appTextColor1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </TouchableOpacity>
            }
            onChangeText={(text) => setValue("password", text)}
          />
          <Wrapper
            flexDirectionRow
            alignItemsCenter
            justifyContentSpaceBetween
            marginHorizontalBase
          >
            <Spacer isSmall horizontal />
            {errors.password && <Text isRegular isPrimaryColor children={errors.password.message} />}
          </Wrapper>
          <Spacer isSmall />
          {/* Forgot Password */}
          <Wrapper marginHorizontalBase alignItemsFlexEnd>
            <TouchableOpacity onPress={handleForgotPasswordModal}>
              <Text isPrimaryColor isRegular children={t('FORGOTPASSWORD')} />
            </TouchableOpacity>
          </Wrapper>
          <Spacer isDoubleBase />
          <Buttons.Colored
            text={isLoggingIn ? t('SENDING') : t('LOGIN')}
            onPress={handleSubmit(signIn)}
            disabled={isLoggingIn}
          />
          <Spacer isBasic />
          <Wrapper flexDirectionRow alignItemsCenter justifyContentCenter>
            <Lines.Horizontal width={responsiveWidth(20)} />
            <Spacer horizontal isSmall />
            <Text isTextColor2 children={t('OR')} />
            <Spacer horizontal isSmall />
            <Lines.Horizontal width={responsiveWidth(20)} />
          </Wrapper>
          <Spacer isBasic />
          {/* Icons for Login */}
          <Wrapper flexDirectionRow alignItemsCenter justifyContentCenter>
            {LoginIconsData.map((item, index) => (
              <Pressable
                key={index}
                style={[
                  styles.LoginIconStyling, 
                  { 
                    backgroundColor: item.backgroundColor || colors.appBgColor1,
                    borderWidth: item.borderWidth || 0,
                    borderColor: item.borderColor || 'transparent',
                  }
                ]}
                onPress={item?.onPress}
              >
                {item.svgIcon}
              </Pressable>
            ))}
          </Wrapper>
          <Spacer isBasic />
          <Wrapper flexDirectionRow alignItemsCenter justifyContentCenter>
            <Text isRegular isTextColor2 alignTextCenter>
              {t('IAMNEW')}{' '}
            </Text>
            <TouchableOpacity
              onPress={() => {
                handleCurrentPage({ PageName: 'Sign Up' });
              }}>
              <Text isPrimaryColor isMediumFont>
                {t('REGISTER')}
              </Text>
            </TouchableOpacity>
          </Wrapper>
          
          <Spacer isBasic />
          
          {/* Terms and Privacy */}
          <Wrapper alignItemsCenter justifyContentCenter marginHorizontalBase>
            <Text isRegular isTextColor2 textAlignCenter fontSize={responsiveWidth(3.5)} style={{ textAlign: 'center' }}>
              {t('BY_SIGNING_IN')}{' '}
              <TouchableOpacity onPress={openTerms}>
                <Text isPrimaryColor isRegularFont fontSize={responsiveWidth(3.5)} style={{ textDecorationLine: 'underline' }}>
                  {t('TERMS_AND_CONDITIONS')}
                </Text>
              </TouchableOpacity>
              {' '}{t('AND')}{' '}
              <TouchableOpacity onPress={openPrivacy}>
                <Text isPrimaryColor isRegularFont fontSize={responsiveWidth(3.5)} style={{ textDecorationLine: 'underline' }}>
                  {t('PRIVACY_POLICY')}
                </Text>
              </TouchableOpacity>
            </Text>
          </Wrapper>
          
          <Spacer isBase />
          
          {/* Version Number */}
          <Wrapper alignItemsCenter paddingVerticalSmall>
            <Text isSmall isTextColor3 style={{opacity: 0.5}}>
              v{version}
            </Text>
          </Wrapper>
        </Wrapper>
      <Modals.PopupPrimary
        visible={ForgotPasswordModal}
        toggle={handleForgotPasswordModal}
        disableSwipe={true}
        isBlur
        children={
          <Wrapper
            style={{
              height: responsiveHeight(58),
            }}>
            <Wrapper
              alignItemsFlexStart
              marginHorizontalBase
              style={{ width: responsiveWidth(90) }}>
              <TouchableOpacity 
                onPress={handleForgotPasswordModal} 
                style={{ 
                  alignSelf: 'flex-end',
                  padding: sizes.smallMargin,
                  marginBottom: sizes.baseMargin,
                }}
                activeOpacity={0.7}
              >
                <Text isSmallTitle style={{ color: colors.appTextColor1 }}>X</Text>
              </TouchableOpacity>
              <Text isTinyTitle children={t('FORGOTPASSWORD')} />
              <Spacer isSmall />
              <Text isRegular isTextColor2>
                {t('ENTEREMAILTORESET')}
              </Text>
            </Wrapper>
            <Spacer isDoubleBase />
            <TextInputs.Bordered
              placeholder={t('EMAIL')}
              value={resetEmail}
              onChangeText={setResetEmail}
              onFocus={value => {
                value && handleInputFocused({ FocusedOn: 'Forget Email' });
              }}
              isFocusedContainerColor={
                InputFocused === 'Forget Email' && colors.black
              }
              customIconRight={appIcons.Email}
              iconSizeRight={responsiveWidth(6.5)}
              iconColorRight={colors.appTextColor1}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Spacer isMedium />
            <Buttons.Colored
              text={isResetting ? t('SENDING') || 'Sending...' : t('RESETPASSWORD')}
              onPress={handleResetPassword}
              isLoading={isResetting}
              disabled={isResetting}
            />
            <Spacer isBase />
            <Wrapper flexDirectionRow alignItemsCenter justifyContentCenter>
              <Text isRegular isTextColor2 alignTextCenter>
                {t('REMEMBEREDPASSWORD')}{' '}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  handleForgotPasswordModal();
                  handleCurrentPage({ PageName: 'Sign Up' });
                }}>
                <Text isPrimaryColor isMediumFont>
                  {t('SIGNIN')}
                </Text>
              </TouchableOpacity>
            </Wrapper>
          </Wrapper>
        }
      />
      
      {/* WebView Modal for Terms and Privacy */}
      <WebViewModal
        visible={webViewVisible}
        url={webViewUrl}
        title={webViewTitle}
        onClose={() => setWebViewVisible(false)}
      />
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  ButtonBackContainer: {
    height: sizes.inputHeight,
    borderRadius: responsiveWidth(3),
    paddingHorizontal: sizes.TinyMargin,
    borderRadius: responsiveWidth(100),
    // marginBottom: responsiveHeight(4),
    overflow: 'hidden',
  },
  SeletedLayerContainer: {
    height: sizes.buttonHeight,
    borderRadius: responsiveWidth(100),
    width: responsiveWidth(40),
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'blue',
  },
  DownMainContainer: {
    // minHeight: verticalScale(475),
    borderTopStartRadius: responsiveWidth(8),
    borderTopEndRadius: responsiveWidth(8),
    paddingBottom: verticalScale(75),
  },
  LoginIconStyling: {
    height: scale(40),
    width: scale(40),
    padding: responsiveWidth(2),
    marginHorizontal: responsiveWidth(2),
    borderRadius: responsiveWidth(100),
    alignItems: 'center',
    justifyContent: 'center',
    ...appStyles.shadowExtraDark,
  },
});
