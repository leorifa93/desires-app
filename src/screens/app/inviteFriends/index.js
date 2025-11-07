import {StyleSheet, View, Alert} from 'react-native';
import React, {useState, useEffect} from 'react';
import {
  Buttons,
  Headers,
  Lines,
  ScrollViews,
  Spacer,
  StatusBars,
  Text,
  TextInputs,
  Wrapper,
} from '../../../components';
import {
  appIcons,
  appStyles,
  colors,
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../services';
import {useHooks} from './hooks';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';

export default function Index() {
  const {t} = useTranslation();
  const user = useSelector(state => state.auth.user);
  const [email, setEmail] = useState('');
  const [deeplink, setDeeplink] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(true);

  useEffect(() => {
    if (user) {
      createBranchLink();
    }
  }, [user]);

  const createBranchLink = async () => {
    try {
      setLinkLoading(true);
      const response = await fetch('https://us-central1-dexxire-dfcba.cloudfunctions.net/createBranchLink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_FIREBASE_AUTH_TOKEN' // This needs to be configured
        },
        body: JSON.stringify({
          userId: user.id,
          type: 'INVITATION'
        })
      });

      if (response.ok) {
        const link = await response.text();
        setDeeplink(link);
      } else {
        console.error('Failed to create branch link');
        // Fallback to a simple invitation link
        setDeeplink(`https://your-app.com/invite?ref=${user.id}`);
      }
    } catch (error) {
      console.error('Error creating branch link:', error);
      // Fallback to a simple invitation link
      setDeeplink(`https://your-app.com/invite?ref=${user.id}`);
    } finally {
      setLinkLoading(false);
    }
  };

  const sendInviteEmail = async () => {
    if (!email || !deeplink) {
      Alert.alert(t('ERROR'), t('PLEASE_ENTER_EMAIL'));
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('https://sendlinkinvitation-ytbcdg7bga-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: user.username,
          mail: email,
          link: deeplink
        })
      });

      if (response.ok) {
        Alert.alert(t('SUCCESS'), t('EMAILSENT'));
        setEmail('');
      } else {
        Alert.alert(t('ERROR'), t('EMAIL_SEND_ERROR'));
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert(t('ERROR'), t('EMAIL_SEND_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper isMain>
      <Headers.Primary title={t('RECRUITFRIEND')} showBackArrow />
      <Spacer isBasic />
      <ScrollViews.KeyboardAvoiding>
        <Wrapper marginHorizontalBase>
          <Text isRegular isRegularFont alignTextCenter>
            {t('RECRUITINFORMATION')}
          </Text>
        </Wrapper>
        <Spacer isBasic />
        <TextInputs.Bordered
          InputLabel={t('EMAIL')}
          placeholder={t('ENTER_EMAIL')}
          customIconRight={appIcons.Email}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Spacer isBasic />
        <Buttons.Colored 
          text={loading ? t('SENDING') : t('INVITE')} 
          onPress={sendInviteEmail}
          disabled={!email || !deeplink || loading}
        />
        <Spacer isDoubleBase />
        <Wrapper flexDirectionRow alignItemsCenter justifyContentCenter>
          <Lines.Horizontal width={responsiveWidth(20)} />
          <Spacer horizontal isBasic />
          <Text isTextColor2 children={t('OR')} />
          <Spacer horizontal isBasic />
          <Lines.Horizontal width={responsiveWidth(20)} />
        </Wrapper>
        <Spacer isDoubleBase />
        <Wrapper isCenter>
          <Wrapper style={styles.QRMAinContainer}>
            {linkLoading ? (
              <Wrapper isCenter style={{flex: 1}}>
                <Text isMedium isRegularFont>
                  {t('GENERATING_QR')}
                </Text>
              </Wrapper>
            ) : deeplink ? (
              <QRCode
                value={deeplink}
                size={responsiveWidth(50)}
                color={colors.appTextColor1}
                backgroundColor={colors.appBgColor1}
              />
            ) : (
              <Wrapper isCenter style={{flex: 1}}>
                <Text isMedium isRegularFont>
                  {t('QR_ERROR')}
                </Text>
              </Wrapper>
            )}
          </Wrapper>
        </Wrapper>
        <Spacer isBasic />
        {deeplink && (
          <Wrapper marginHorizontalBase>
            <Text isSmall isRegularFont isTextColor2 alignTextCenter>
              {t('SHARE_LINK')}
            </Text>
            <Spacer isSmall />
            <Text isSmall isRegularFont isTextColor2 alignTextCenter>
              {deeplink}
            </Text>
          </Wrapper>
        )}
      </ScrollViews.KeyboardAvoiding>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  QRMAinContainer: {
    //backgroundColor: 'red',
    height: responsiveHeight(26),
    width: responsiveWidth(60),
    borderRadius: responsiveWidth(5),
    borderWidth: 1.5,
    borderColor: colors.appBorderColor2,
    padding: 7,
  },
  QrContainer: {
    flex: 1,
    resizeMode: 'contain',
  },
});
