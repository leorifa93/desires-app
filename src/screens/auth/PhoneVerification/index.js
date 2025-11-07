import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import {
  Buttons,
  Headers,
  Spacer,
  Text,
  Wrapper,
  TextInputs,
  Lines,
} from '../../../components';
import {colors, responsiveWidth, responsiveHeight} from '../../../services';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {navigate} from '../../../navigation/rootNavigation';
import {routes} from '../../../services';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {STATUS_PENDING, STATUS_ACTIVE} from '../../../constants/User';
import phoneVerificationService from '../../../services/phoneVerificationService';
import { setAuthState, setUser } from '../../../store/actions/auth';
import PhoneInput from 'react-native-phone-number-input';

export default function PhoneVerification({route, navigation}) {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {user} = useSelector(state => state.auth);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const phoneInputRef = React.useRef(null);
  const verifyingRef = React.useRef(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const hiddenInputRef = React.useRef(null);
  const [formattedPhoneForVerification, setFormattedPhoneForVerification] = useState('');

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Handle hidden input changes (from SMS auto-fill or manual typing)
  const handleHiddenInputChange = (fullCode) => {
    console.log('Hidden input received:', fullCode);
    const digitsOnly = fullCode.replace(/[^\d]/g, '');
    
    if (digitsOnly.length <= 6) {
      const digits = digitsOnly.split('');
      const newDigits = [...digits, '', '', '', '', '', ''].slice(0, 6);
      setOtpDigits(newDigits);
      setVerificationCode(digitsOnly);
      console.log('Digits set:', newDigits, 'Full code:', digitsOnly);
    }
  };

  // Auto-verify when code is complete (6 digits)
  useEffect(() => {
    if (verificationCode.length === 6 && !loading && showVerificationInput && !verifyingRef.current) {
      setTimeout(() => {
        verifyingRef.current = true;
        verifyCode();
      }, 500); // Small delay to ensure all digits are set
    }
  }, [verificationCode]);

  useEffect(() => {
    // Get user phone number from route params or user data
    const userId = route?.params?.userId || user?.id;
    if (userId && user?.phoneNumber) {
      setPhoneNumber(user.phoneNumber);
    }
  }, [route?.params, user]);

  const sendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert(t('ERROR'), t('PHONE_NUMBER_REQUIRED'));
      return;
    }

    setLoading(true);
    try {
      // Normalize to E.164 consistently
      let formattedPhoneNumber = phoneNumber;
      if (phoneInputRef.current?.getNumberAfterPossiblyEliminatingZero) {
        const info = phoneInputRef.current.getNumberAfterPossiblyEliminatingZero();
        formattedPhoneNumber = info?.formattedNumber || formattedPhoneNumber;
      }
      formattedPhoneNumber = phoneVerificationService.formatPhoneNumber(formattedPhoneNumber);

      // Check if phone number is already in use by another user
      const currentUser = auth().currentUser;
      if (currentUser) {
        const usersSnapshot = await firestore()
          .collection('Users')
          .where('verifiedPhoneNumber', '==', true)
          .where('phoneNumber', '==', formattedPhoneNumber)
          .get();

        let isYourNumber = true;
        if (!usersSnapshot.empty) {
          for (let doc of usersSnapshot.docs) {
            if (doc.id !== currentUser.uid) {
              isYourNumber = false;
              break;
            }
          }
        }

        if (!isYourNumber) {
          Alert.alert(t('ERROR'), t('PHONE_ALREADY_EXISTS'));
          setLoading(false);
          return;
        }
      }

      console.log('Sending SMS to formatted number:', formattedPhoneNumber);
      await phoneVerificationService.sendVerificationCode(formattedPhoneNumber);
      
      // Save the formatted number for verification
      setFormattedPhoneForVerification(formattedPhoneNumber);
      setShowVerificationInput(true);
      setOtpDigits(['', '', '', '', '', '']);
      setVerificationCode('');
    } catch (error) {
      console.error('Error sending verification code:', error);
      Alert.alert(t('ERROR'), error.message || t('FAILED_TO_SEND_CODE'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    console.log('Verify Code - Input:', verificationCode, 'Length:', verificationCode.length, 'Digits:', otpDigits);
    
    if (!phoneVerificationService.isValidVerificationCode(verificationCode)) {
      console.log('Code validation failed:', verificationCode);
      Alert.alert(t('ERROR'), t('INVALID_VERIFICATION_CODE'));
      verifyingRef.current = false;
      return;
    }

    setLoading(true);
    try {
      // Use the same formatted phone number that was used when sending the code
      const formattedPhoneNumber = formattedPhoneForVerification;
      console.log('Verifying with phone:', formattedPhoneNumber, 'code:', verificationCode);
      const isValid = await phoneVerificationService.verifySMSCode(formattedPhoneNumber, verificationCode);

      console.log('isValid', isValid, formattedPhoneNumber, verificationCode);
      if (isValid) {
        // Update user's phone verification status in Firestore
        const currentUser = auth().currentUser;
        if (currentUser) {
          await firestore()
            .collection('Users')
            .doc(currentUser.uid)
            .update({
              verifiedPhoneNumber: true,
              phoneNumber: formattedPhoneNumber,
            });

          // Fetch fresh user data from Firestore to ensure we have the latest status
          const userDoc = await firestore().collection('Users').doc(currentUser.uid).get();
          const freshUserData = userDoc.data();
          
          // Update Redux with verified phone number AND fresh data
          const updatedUser = {
            ...user,
            ...freshUserData,
            id: currentUser.uid,
            verifiedPhoneNumber: true,
            phoneNumber: formattedPhoneNumber,
          };
          
          console.log('PhoneVerification: Fresh user data after verification:', {
            status: updatedUser.status,
            verifiedPhoneNumber: updatedUser.verifiedPhoneNumber,
            verificationChoiceMade: updatedUser.verificationChoiceMade,
            isVerified: updatedUser.isVerified
          });
          
          dispatch(setUser({
            user: updatedUser,
            dataLoaded: true,
          }));

          // Navigate based on user status
          // STATUS_ACTIVE = 1, STATUS_PENDING = 2
          if (updatedUser.status === STATUS_PENDING || updatedUser.status === 2) {
            console.log('PhoneVerification: STATUS_PENDING (2) → registerSteps');
            navigate(routes.registerSteps);
          } else if (updatedUser.status === STATUS_ACTIVE || updatedUser.status === 1) {
            if (!updatedUser.verificationChoiceMade && !updatedUser.isVerified) {
              console.log('PhoneVerification: STATUS_ACTIVE (1) → verificationChoice');
              navigate(routes.verificationChoice);
            } else {
              console.log('PhoneVerification: STATUS_ACTIVE (1) with verification → app');
              navigate(routes.app);
            }
          } else {
            console.log('PhoneVerification: Unknown status:', updatedUser.status, 'defaulting to registerSteps');
            navigate(routes.registerSteps);
          }
        }
      } else {
        Alert.alert(t('ERROR'), t('INVALID_VERIFICATION_CODE'));
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      Alert.alert(t('ERROR'), t('INVALID_VERIFICATION_CODE'));
    } finally {
      setLoading(false);
      verifyingRef.current = false;
    }
  };


  return (
    <Wrapper isMain>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
        <Headers.Primary
          showBackArrow
          title={t('PHONE_VERIFICATION')}
        />

        <Spacer isBasic />

        {/* Phone Number Input - nur anzeigen wenn Code noch nicht gesendet */}
        {!showVerificationInput && (
          <Wrapper alignItemsCenter paddingHorizontalBase>
            {/* Card */}
            <Wrapper style={styles.card}>
              <Text isSmallTitle textAlignCenter style={styles.titleText}>
                {t('PHONE_VERIFICATION')}
              </Text>
              <Spacer height={6} />
              <Text isRegular isTextColor2 textAlignCenter style={styles.descriptionText}>
                {t('PHONE_VERIFICATION_DESCRIPTION')}
              </Text>

              <Spacer isBase />

              {/* Phone Number Input with country selector */}
              <PhoneInput
                ref={phoneInputRef}
                defaultCode="DE"
                layout="first"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                containerStyle={styles.phoneContainer}
                textContainerStyle={styles.phoneTextContainer}
                textInputProps={{ keyboardType: 'phone-pad' }}
              />
              <Spacer isSmall />

              <Buttons.Colored
                text={loading ? t('SENDING') : t('SEND_VERIFICATION_CODE')}
                onPress={sendVerificationCode}
                disabled={loading}
                buttonStyle={[styles.primaryButton, loading && styles.disabledButton]}
                textStyle={styles.primaryButtonText}
              />
              {loading && (
                <>
                  <Spacer isSmall />
                  <Wrapper alignItemsCenter>
                    <ActivityIndicator size="small" color={colors.appPrimaryColor} />
                    <Spacer height={4} />
                    <Text isRegular isTextColor2 textAlignCenter>
                      {t('SENDING_CODE')}
                    </Text>
                  </Wrapper>
                </>
              )}
            </Wrapper>
          </Wrapper>
        )}

        {/* Verification Code Input */}
        {showVerificationInput && (
          <>
            <Spacer isBase />
            <Wrapper alignItemsCenter paddingHorizontalBase>
              <Wrapper style={styles.card}>
                <Text isMedium textAlignCenter marginBottomMedium>
                  {t('PLEASE_ENTER_CODE')}
                </Text>

                {/* Hidden input for SMS auto-fill - positioned over the boxes */}
                <View style={{ position: 'relative' }}>
                  <TextInput
                    ref={hiddenInputRef}
                    value={verificationCode}
                    onChangeText={handleHiddenInputChange}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    style={styles.hiddenInput}
                    maxLength={6}
                    autoFocus={true}
                    caretHidden={true}
                  />

                  {/* 6 OTP Input Boxes - visual only */}
                  <View style={styles.otpBoxContainer}>
                    {otpDigits.map((digit, index) => (
                      <TouchableWithoutFeedback
                        key={index}
                        onPress={() => {
                          // Always focus hidden input for keyboard + auto-fill
                          hiddenInputRef.current?.focus();
                        }}
                      >
                        <View style={[
                          styles.otpBox,
                          digit && { borderColor: colors.appPrimaryColor, borderWidth: 2 }
                        ]}>
                          <Text style={styles.otpDigitText}>
                            {digit || ''}
                          </Text>
                        </View>
                      </TouchableWithoutFeedback>
                    ))}
                  </View>
                </View>

                <Spacer isSmall />

                <Text
                  isRegular
                  isPrimaryColor
                  textAlignCenter
                  onPress={sendVerificationCode}
                  style={styles.resendText}
                >
                  {t('SEND_CODE_AGAIN')}
                </Text>

                <Spacer isBase />

                <Buttons.Colored
                  text={loading ? t('VERIFYING') : t('VERIFY_CODE')}
                  onPress={verifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  buttonStyle={[styles.primaryButton, loading && styles.disabledButton]}
                  textStyle={styles.primaryButtonText}
                />
                {loading && (
                  <>
                    <Spacer isSmall />
                    <Wrapper alignItemsCenter>
                      <ActivityIndicator size="small" color={colors.appPrimaryColor} />
                      <Spacer height={4} />
                      <Text isRegular isTextColor2 textAlignCenter>
                        {t('VERIFYING_CODE')}
                      </Text>
                    </Wrapper>
                  </>
                )}
              </Wrapper>
            </Wrapper>
          </>
        )}
        {/* Bottom cancel link */}
        <Spacer isBase />
        <Wrapper alignItemsCenter>
          <Text
            isRegular
            isPrimaryColor
            onPress={async () => {
              try { await auth().signOut(); } catch (e) { console.log('signOut error', e); }
              try { dispatch(setAuthState(null, true)); } catch (e) { console.log('setAuthState error', e); }
            }}
            style={styles.resendText}
          >
            {t('LOGOUT')}
          </Text>
        </Wrapper>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.appBgColor2,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  titleText: {
    fontSize: responsiveWidth(5),
  },
  descriptionText: {
    fontSize: responsiveWidth(3.6),
    lineHeight: 22,
  },
  countryCodeContainer: {
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: colors.appBorderColor1,
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    zIndex: 10,
  },
  otpBoxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 20,
    zIndex: 1,
  },
  otpBox: {
    width: responsiveWidth(12),
    height: responsiveWidth(15),
    borderWidth: 2,
    borderColor: colors.appBorderColor2,
    borderRadius: 12,
    backgroundColor: colors.appBgColor1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpDigitText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.appTextColor1,
    textAlign: 'center',
  },
  resendText: {
    textDecorationLine: 'underline',
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: responsiveWidth(3.8),
  },
  disabledButton: {
    opacity: 0.6,
  },
  phoneContainer: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.appBgColor1,
    borderWidth: 1,
    borderColor: colors.appBorderColor1,
  },
  phoneTextContainer: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: colors.appBgColor1,
  },
});
