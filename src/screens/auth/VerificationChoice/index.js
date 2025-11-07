import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { signOut, setUser } from '../../../store/actions/auth';
import firestore from '@react-native-firebase/firestore';

// Self-developed Components
import { Wrapper, Spacer, Text, Buttons } from '../../../components';
import { colors, responsiveWidth, responsiveHeight, appImages } from '../../../services';
import { routes } from '../../../services/constants';

export default function VerificationChoice() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const me = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const bannerTop = (insets?.top || (Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0)));

  // Local banners removed; global UploadBanner handles visibility

  const handleVerification = () => {
    navigation.navigate(routes.verifyProfile);
  };

  const handleInvisibleMembership = () => {
    console.log('VerificationChoice: Setting temporary choice flag');
    console.log('VerificationChoice: Current user before update:', me?.hasMadeTemporaryChoice, me?.temporaryChoice);
    
    // Set a temporary flag in Redux to remember the choice
    // This prevents navigation back to verificationChoice after background upload
    // but doesn't set the permanent verificationChoiceMade flag until subscription
    const updatedUser = {
      ...me,
      hasMadeTemporaryChoice: true, // Temporary flag
      temporaryChoice: 'invisible', // Remember the choice
    };
    
    console.log('VerificationChoice: Updated user with temporary flags:', updatedUser.hasMadeTemporaryChoice, updatedUser.temporaryChoice);
    
    dispatch(setUser({
      user: updatedUser,
      dataLoaded: true,
    }));

    navigation.navigate(routes.app, { 
      screen: routes.subscription, 
      params: { showOnlyMemberships: 'Ghost,Phantom,Celebrity' } 
    });
  };

  const handleSkipToApp = () => {
    navigation.navigate(routes.bottomTab);
  };

  const handleLogout = () => {
    dispatch(signOut());
  };

  // Detect pending uploads also when publicAlbum still contains local file paths (strings)
  const hasLocalPublicPaths = Array.isArray(me?.publicAlbum) && me.publicAlbum.some((p) => typeof p === 'string');

  return (
    <Wrapper style={styles.container}>
      {/* Local upload banners removed in favor of global UploadBanner */}

      <Wrapper style={styles.content}>
        <Wrapper alignItemsCenter>
          <Image
            source={appImages.logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </Wrapper>
        
        <Spacer height={responsiveHeight(4)} />
        
        <Wrapper alignItemsCenter>
          <Text isLarge isBoldFont alignTextCenter>
            {t('VERIFICATION_CHOICE_TITLE')}
          </Text>
        </Wrapper>
        
        <Spacer height={responsiveHeight(2)} />
        
        <Wrapper alignItemsCenter>
          <Text isRegular alignTextCenter style={styles.description}>
            {t('VERIFICATION_CHOICE_DESCRIPTION_NEW')}
          </Text>
        </Wrapper>
        
        <Spacer height={responsiveHeight(2)} />
        
        <Wrapper alignItemsCenter>
          <Text isSmall alignTextCenter style={styles.privacyText}>
            {t('PRIVACY_REASON')}
          </Text>
        </Wrapper>
        
        <Spacer height={responsiveHeight(6)} />
        
        <Wrapper alignItemsCenter>
          <Text isMedium isBoldFont alignTextCenter style={styles.verificationText}>
            {t('VERIFICATION_REQUIRED')}
          </Text>
        </Wrapper>
        
        <Spacer height={responsiveHeight(4)} />
        
        <Wrapper>
          <Buttons.Colored
            text={t('VERIFY_NOW')}
            onPress={handleVerification}
            buttonStyle={styles.verifyButton}
          />
          
          <Spacer height={responsiveHeight(2)} />
          
          <Buttons.Bordered
            text={t('STAY_PRIVATE')}
            onPress={handleInvisibleMembership}
            buttonStyle={styles.membershipButton}
            textStyle={{ color: colors.appPrimaryColor }}
          />
        </Wrapper>
        
        <Spacer height={responsiveHeight(3)} />
        
        <Wrapper alignItemsCenter>
          <Text isSmall alignTextCenter style={styles.note}>
            {t('VERIFICATION_CHOICE_NOTE_NEW')}
          </Text>
        </Wrapper>
        
        <Spacer height={responsiveHeight(4)} />
        
        <Wrapper alignItemsCenter>
          <Text 
            isSmall 
            alignTextCenter 
            style={styles.logoutText}
            onPress={handleLogout}
          >
            {t('LOGOUT')}
          </Text>
        </Wrapper>
      </Wrapper>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBgColor1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: responsiveWidth(8),
  },
  logo: {
    width: responsiveWidth(40),
    height: responsiveHeight(8),
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.appTextColor2,
  },
  verificationText: {
    fontSize: 18,
    color: colors.appTextColor1,
  },
  privacyText: {
    fontSize: 14,
    color: colors.appTextColor2,
    fontStyle: 'italic',
  },
  verifyButton: {
    backgroundColor: colors.appPrimaryColor,
  },
  membershipButton: {
    borderColor: colors.appPrimaryColor,
    borderWidth: 2,
  },
  note: {
    fontSize: 12,
    color: colors.appTextColor2,
    fontStyle: 'italic',
  },
  logoutText: {
    fontSize: 14,
    color: colors.appTextColor2,
    textDecorationLine: 'underline',
  },
});
