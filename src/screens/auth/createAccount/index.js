import React, { useState } from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View, Alert, Platform } from 'react-native';
import {
  Icons,
  Text,
  TextInputs,
  Buttons,
  Wrapper,
  Spacer,
  Lines,
  Switches,
  Modals,
} from '../../../components';
import {
  colors,
  responsiveHeight,
  responsiveWidth,
  appIcons,
  routes,
  fontSizes,
  appFonts,
  appStyles,
  sizes,
  responsiveFontSize,
} from '../../../services';
import { useHooks } from './hooks';
import { scale, verticalScale } from 'react-native-size-matters';
import { Icon } from '@rneui/base';
import Svg, { Path } from 'react-native-svg';
import { navigate } from '../../../navigation/rootNavigation';
import { useTranslation } from 'react-i18next';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { version } from '../../../../package.json';

const registerSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
  passwordConfirm: z.string().nonempty("Bitte bestätige dein Passwort"),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwörter stimmen nicht überein",
  path: ["passwordConfirm"],
});

export default function Index(props) {
  const {t} = useTranslation();
  const [InputFocused, setInputFocused] = useState('');
  const [SecurePassword, setSecurePassword] = useState(true);
  const [SecurePasswordConfirm, setSecurePasswordConfirm] = useState(true);
  const [isTermsAccepted, setIsTermsAccepted] = useState(true);
  
  const {
    isCreatingUser,
    createUserWithEmail,
    createOrSignInUserViaGoogle,
    createOrSignInViaApple,
    createOrSignInViaFacebook,
    LoginIconsData,
  } = useHooks();

  const {
    handleSubmit,
    setValue,
    formState: {errors},
    watch,
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const handleCreateAccount = (data) => {
    if (data.password !== data.passwordConfirm) {
      Alert.alert(t('ERROR'), t('PASSWORTNOTEQUAL'));
      return;
    }
    if (!isTermsAccepted) {
      Alert.alert(t('ERROR'), t('TERMS_REQUIRED') || 'Please accept Terms and Conditions to continue');
      return;
    }
    createUserWithEmail(data.email, data.password);
  };

  const handleInputFocused = ({FocusedOn}) => {
    setInputFocused(FocusedOn);
  };

  const handleSecurePassword = () => {
    setSecurePassword(!SecurePassword);
  };

  const handleSecurePasswordConfirm = () => {
    setSecurePasswordConfirm(!SecurePasswordConfirm);
  };

  return (
    <Wrapper>
      <Wrapper
        paddingVerticalMedium
        backgroundColor={colors.appBgColor1}
        style={styles.DownMainContainer}>
        
        {/* Header */}
        <Wrapper marginHorizontalBase>
          <Wrapper flexDirectionRow alignItemsCenter justifyContentSpaceBetween>
            <Text isSmallTitle children={t('CREATE_ACCOUNT')} />
            <Wrapper />
          </Wrapper>
          <Spacer isTiny />
          <Text
            isRegular
            isTextColor2
            children={t('CREATE_ACCOUNT_DESCRIPTION')}
          />
        </Wrapper>
        <Spacer isMedium />
        
        {/* Email Field */}
        <TextInputs.Bordered
          placeholder={t('EMAIL')}
          onFocus={value => value && handleInputFocused({FocusedOn: 'Email'})}
          isFocusedContainerColor={InputFocused === 'Email' && colors.black}
          customIconRight={appIcons.Email}
          iconSizeRight={responsiveWidth(6.5)}
          iconColorRight={colors.appTextColor1}
          onChangeText={(text) => setValue("email", text)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
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
        
        {/* Password Field */}
        <TextInputs.Bordered
          placeholder={t('PASSWORD')}
          secureTextEntry={SecurePassword}
          onFocus={value => value && handleInputFocused({FocusedOn: 'Password'})}
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
        
        {/* Password Confirm Field */}
        <TextInputs.Bordered
          placeholder={t('PASSWORDCONFIRM')}
          secureTextEntry={SecurePasswordConfirm}
          onFocus={value => value && handleInputFocused({FocusedOn: 'PasswordConfirm'})}
          isFocusedContainerColor={InputFocused === 'PasswordConfirm' && colors.black}
          right={
            <TouchableOpacity onPress={handleSecurePasswordConfirm}>
              {SecurePasswordConfirm ? (
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
          onChangeText={(text) => setValue("passwordConfirm", text)}
        />
        <Wrapper
          flexDirectionRow
          alignItemsCenter
          justifyContentSpaceBetween
          marginHorizontalBase
        >
          <Spacer isSmall horizontal />
          {errors.passwordConfirm && <Text isRegular isPrimaryColor children={errors.passwordConfirm.message} />}
        </Wrapper>
        <Spacer isDoubleBase />
        
        {/* Create Account Button */}
        <Buttons.Colored
          text={isCreatingUser ? t('SENDING') : t('CREATE_ACCOUNT')}
          onPress={handleSubmit(handleCreateAccount)}
          disabled={isCreatingUser}
        />
        <Spacer isBasic />
        
        {/* Divider */}
        <Wrapper flexDirectionRow alignItemsCenter justifyContentCenter>
          <Lines.Horizontal width={responsiveWidth(20)} />
          <Spacer horizontal isSmall />
          <Text isTextColor2 children={t('OR')} />
          <Spacer horizontal isSmall />
          <Lines.Horizontal width={responsiveWidth(20)} />
        </Wrapper>
        <Spacer isBasic />
        
        {/* Social Login Buttons */}
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
        
        {/* Sign In Link */}
        <Wrapper flexDirectionRow alignItemsCenter justifyContentCenter>
          <Text isRegular isTextColor2 alignTextCenter>
            {t('ALREADYSIGNEDIN')}{' '}
          </Text>
          <TouchableOpacity
            onPress={() => {
              navigate(routes.signin);
            }}>
            <Text isPrimaryColor isMediumFont>
              {t('SIGNIN')}
            </Text>
          </TouchableOpacity>
        </Wrapper>
        
        <Spacer isDoubleBase />
        
        {/* Terms and Privacy (Pflicht - mit Checkbox) */}
        <Wrapper marginHorizontalBase>
          <TouchableOpacity
            onPress={() => {
              setIsTermsAccepted(!isTermsAccepted);
            }}>
            <Wrapper
              flexDirectionRow
              alignItemsCenter>
              <Wrapper
                backgroundColor={
                  isTermsAccepted ? colors.appPrimaryColor : colors.appBgColor1
                }
                isCenter
                style={{
                  height: scale(18),
                  width: scale(18),
                  borderRadius: responsiveWidth(1),
                  borderWidth: 1.5,
                  borderColor: colors.appBorderColor1,
                  overflow: 'hidden',
                  marginRight: scale(10),
                }}>
                {isTermsAccepted ? (
                  <Svg width={responsiveWidth(3.5)} height={responsiveWidth(3.5)} viewBox="0 0 24 24" fill="none">
                    <Path d="M5 5L19 19M19 5L5 19" stroke={colors.appTextColor6} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                ) : null}
              </Wrapper>
              <Text 
                isSmall 
                isTextColor2 
                fontSize={responsiveWidth(3.2)} 
                style={{ 
                  flex: 1,
                  lineHeight: responsiveWidth(4.5),
                  textAlign: 'left'
                }}>
                {t('BY_CREATING_ACCOUNT')}{' '}
                <Text isPrimaryColor isRegularFont fontSize={responsiveWidth(3.2)}>
                  {t('TERMS_AND_CONDITIONS')}
                </Text>
                {' '}{t('AND')}{' '}
                <Text isPrimaryColor isRegularFont fontSize={responsiveWidth(3.2)}>
                  {t('PRIVACY_POLICY')}
                </Text>
              </Text>
            </Wrapper>
          </TouchableOpacity>
        </Wrapper>
        
        <Spacer isSmall />
        
        {/* Divider Line */}
        <Wrapper alignItemsCenter justifyContentCenter>
          <Svg width="144" height="1" viewBox="0 0 144 1" fill="none">
            <Path opacity="0.2" d="M0 0.5H144" stroke="#9EA1AE" strokeWidth="1"/>
          </Svg>
        </Wrapper>
        
        <Spacer isSmall />
        
        {/* SMS Consent Notice (nur Text, keine Checkbox) */}
        <Wrapper marginHorizontalBase>
          <Text 
            isSmall 
            isTextColor2 
            fontSize={responsiveWidth(3.2)} 
            style={{ 
              lineHeight: responsiveWidth(4.5),
              textAlign: 'left'
            }}>
            {t('SMS_CONSENT')}
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
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  DownMainContainer: {
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