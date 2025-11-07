import React, {useState, useEffect} from 'react';
import {
  Buttons,
  DropDowns,
  Headers,
  Spacer,
  StatusBars,
  Text,
  TextInputs,
  Wrapper,
} from '../../../components';
import {scale, verticalScale} from 'react-native-size-matters';
import {responsiveWidth, sizes, colors, appStyles} from '../../../services';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {goBack} from '../../../navigation/rootNavigation';
import {Alert} from 'react-native';

export default function Index() {
  const {t} = useTranslation();
  const user = useSelector(state => state.auth.user);
  
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [sending, setSending] = useState(false);
  
  const selections = ['DELETEPROFILE', 'TECHNICALPROBLEM', 'MAINREQUEST'];

  const sendReport = async () => {
    if (!reference || (!user && !email) || (reference !== 'DELETEPROFILE' && !message)) {
      Alert.alert(t('ERROR'), t('PLEASE_FILL_ALL_FIELDS'));
      return;
    }

    try {
      setSending(true);
      
      const userEmail = user?.email || email;
      const profileLink = user ? `https://app.desires.app/profile/${user.id}` : '';
      
      const reportMessage = reference === 'DELETEPROFILE' 
        ? t('DELETEPROFILESUPPORTMESSAGE')
        : `${message}\n\n${profileLink ? `Link zum Profil: ${profileLink}` : ''}`;

      const response = await fetch('https://sendreportmail-ytbcdg7bga-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: reportMessage,
          reference: t(reference),
          mail: userEmail
        })
      });

      if (response.ok) {
        setIsSent(true);
        setReference('');
        setMessage('');
        setEmail('');
        Alert.alert(t('SUCCESS'), t('EMAILSENT'));
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending report:', error);
      Alert.alert(t('ERROR'), t('ERROR_SENDING_EMAIL'));
    } finally {
      setSending(false);
    }
  };

  const sendAgain = () => {
    setIsSent(false);
  };

  const renderDeleteProfileInfo = () => {
    if (reference !== 'DELETEPROFILE') return null;
    
    return (
      <Wrapper marginHorizontalBase marginVerticalBase>
        <Text isBoldFont style={{fontSize: 18, marginBottom: 10}}>
          {t('DELETEPROFILESUPPORTHEADER')}
        </Text>
        <Wrapper marginVerticalSmall>
          {[1, 2, 3, 4].map((i) => (
            <Text key={i} isRegular isRegularFont style={{marginBottom: 5}}>
              • {t(`DELETEPROFILEINFO${i}`)}
            </Text>
          ))}
        </Wrapper>
      </Wrapper>
    );
  };

  if (isSent) {
    return (
      <Wrapper isMain>
        <StatusBars.Dark />
        <Headers.Primary showBackArrow title={t('SUPPORT')} />
        <Spacer isBasic />
        <Wrapper flex={1} justifyContentCenter alignItemsCenter marginHorizontalBase>
          <Text isRegular isRegularFont style={{textAlign: 'center', marginBottom: 20}}>
            {t('EMAILSENTWAIT')}
          </Text>
          <Buttons.Colored text={t('SENDNEWEMAIL')} onPress={sendAgain} />
        </Wrapper>
      </Wrapper>
    );
  }

  return (
    <Wrapper isMain>
      <StatusBars.Dark />
      <Headers.Primary showBackArrow title={t('SUPPORT')} />
      <Spacer isBasic />
      
      <Wrapper marginHorizontalBase>
        <Text isRegular isRegularFont>
          {t('SUPPORTINFO')}
        </Text>
      </Wrapper>
      
      <Spacer isDoubleBase />
      
      {/* Email field - only show if no user logged in */}
      {!user && (
        <>
          <TextInputs.Bordered
            InputLabel={t('EMAIL')}
            placeholder={t('EMAIL')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            marginHorizontalBase
          />
          <Spacer isBasic />
        </>
      )}
      
      {/* Reference dropdown */}
      <DropDowns.Simple
        marginHorizontalBase
        DropdownLabel={t('REFERENCE')}
        DropdownPlaceHolder={t('PLEASECHOOSE')}
        value={reference}
        onValueChange={setReference}
        DropdownData={selections.map(selection => ({
          label: t(selection),
          value: selection
        }))}
      />
      
      <Spacer isBasic />
      
      {/* Delete profile info */}
      {renderDeleteProfileInfo()}
      
      {/* Message field - only show if not delete profile */}
      {reference && reference !== 'DELETEPROFILE' && (
        <>
          <TextInputs.Bordered
            InputLabel={t('MESSAGE')}
            multiline
            placeholder={t('TYPEAMESSAGE')}
            value={message}
            onChangeText={setMessage}
            containerStyle={{
              borderRadius: responsiveWidth(5),
              alignItems: 'flex-start',
              paddingVertical: sizes.smallMargin,
              marginHorizontal: sizes.baseMargin,
            }}
            inputStyle={{
              height: verticalScale(150),
            }}
          />
          <Spacer isBasic />
        </>
      )}
      
      {/* Send button */}
      <Wrapper flex={1} justifyContentFlexend paddingVerticalBase paddingHorizontalBase>
        <Buttons.Colored 
          text={t('SEND')} 
          onPress={sendReport}
          disabled={sending || !reference || (!user && !email) || (reference !== 'DELETEPROFILE' && !message)}
        />
      </Wrapper>
    </Wrapper>
  );
}
