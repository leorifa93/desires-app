import { useMemo, useState } from 'react';
import { navigate } from '../../../../navigation/rootNavigation';
import { appIcons, colors, routes } from '../../../../services';
import { signInWithEmail } from '../../../../provider/firebaseProvider';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { STATUS_ACTIVE, STATUS_PENDING } from '../../../../constants/User';

export function useHooks() {
  const { t } = useTranslation();
  const [SecurePassword, setSecurePassword] = useState(true);
  const [InputFocused, setInputFocused] = useState('');
  const [ForgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Initialize Google Sign-In
  const initializeGoogleSignIn = () => {
    GoogleSignin.configure({
      webClientId: '750696506520-uoj9srloh4um5s47tk7s5qa4hfgkn5b6.apps.googleusercontent.com', // Web Client ID
      iosClientId: '750696506520-e4vn1idu81b2cl2fsfj47ulhlcnn6ft0.apps.googleusercontent.com', // iOS Client ID
      offlineAccess: true,
    });
    console.log('Google Sign-In configured with webClientId:', '750696506520-uoj9srloh4um5s47tk7s5qa4hfgkn5b6.apps.googleusercontent.com');
  };

  const handleLogin = (email, password) => {
    setIsLoggingIn(true);
    signInWithEmail(email, password)
      .then(() => {
        setIsLoggingIn(false);
        console.log('SignIn: Login successful, user should be set in Redux');
        // Navigation is handled by central navigation logic
      })
      .catch((error) => {
        setIsLoggingIn(false);
        console.error('Login error:', error);
        Alert.alert(t('ERROR'), t(error.message) || error.message);
      });
  };

  const createOrSignInUserViaGoogle = async () => {
    if (isLoggingIn) {
      console.log('Google Sign-In already in progress, ignoring duplicate tap');
      return;
    }

    setIsLoggingIn(true);

    try {
      // Initialize Google Sign-In if not already done
      initializeGoogleSignIn();
      
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices();

      // Make sure we're not in a stale sign-in state from a previous attempt
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        // ignore - user might not have been signed in
        console.log('Google Sign-In: previous session cleanup failed (safe to ignore):', signOutError?.message);
      }
      
      // Get the users ID token
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In successful, got user info:', userInfo);
      
      // Create a Google credential with the token (only idToken needed for iOS)
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);
      
      // Sign-in the user with the credential
      console.log('Attempting Firebase sign-in with Google credential');
      const userCredential = await auth().signInWithCredential(googleCredential);
      console.log('Firebase sign-in successful:', userCredential.user.uid);
      
      // Check if user exists in Firestore
      const userDoc = await firestore().collection('Users').doc(userCredential.user.uid).get();
      
      if (!userDoc.exists) {
        console.log('User does not exist, creating new user document');
        // Create new user document
        await firestore().collection('Users').doc(userCredential.user.uid).set({
          id: userCredential.user.uid,
          status: STATUS_PENDING,
          membership: 1, // Membership.Standard
          email: userCredential.user.email,
          username: userCredential.user.displayName || userCredential.user.email,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log('New user document created');
      } else {
        console.log('User already exists in Firestore');
      }
      // Navigation is handled by central navigation logic
      
    } catch (error) {
      console.error('Google Sign-In error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/multi-factor-auth-required') {
        handleMFA(error);
      } else {
        Alert.alert(t('ERROR'), error.message || t('ERROR_GOOGLE_SIGNIN'));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const createOrSignInViaApple = async () => {
    try {
      setIsLoggingIn(true);
      
      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
      
      // Ensure Apple returned a user identityToken
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identify token returned');
      }
      
      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
      
      // Sign in with the credential
      const userCredential = await auth().signInWithCredential(appleCredential);
      
      // Check if user exists in Firestore
      const userDoc = await firestore().collection('Users').doc(userCredential.user.uid).get();
      
      if (!userDoc.exists) {
        // Create new user document
        await firestore().collection('Users').doc(userCredential.user.uid).set({
          id: userCredential.user.uid,
          status: 0, // STATUS_PENDING
          membership: 1, // Membership.Standard
          email: userCredential.user.email,
          username: userCredential.user.displayName || userCredential.user.email,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
      
      setIsLoggingIn(false);
      // Navigation is handled by central navigation logic
      
    } catch (error) {
      setIsLoggingIn(false);
      console.error('Apple Sign-In error:', error);
      
      if (error.code === 'auth/multi-factor-auth-required') {
        handleMFA(error);
      } else {
        Alert.alert(t('ERROR'), error.message);
      }
    }
  };

  const createOrSignInViaFacebook = async () => {
    try {
      setIsLoggingIn(true);
      
      // Login with permissions
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      
      if (result.isCancelled) {
        setIsLoggingIn(false);
        return;
      }
      
      // Get access token
      const data = await AccessToken.getCurrentAccessToken();
      
      if (!data) {
        throw new Error('Something went wrong obtaining access token');
      }
      
      // Create a Firebase credential with the access token
      const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);
      
      // Sign in with the credential
      const userCredential = await auth().signInWithCredential(facebookCredential);
      
      // Check if user exists in Firestore
      const userDoc = await firestore().collection('Users').doc(userCredential.user.uid).get();
      
      if (!userDoc.exists) {
        // Create new user document
        await firestore().collection('Users').doc(userCredential.user.uid).set({
          id: userCredential.user.uid,
          status: 0, // STATUS_PENDING
          membership: 1, // Membership.Standard
          email: userCredential.user.email,
          username: userCredential.user.displayName || userCredential.user.email,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
      
      setIsLoggingIn(false);
      // Navigation is handled by central navigation logic
      
    } catch (error) {
      setIsLoggingIn(false);
      console.error('Facebook Sign-In error:', error);
      
      if (error.code === 'auth/multi-factor-auth-required') {
        handleMFA(error);
      } else {
        Alert.alert(t('ERROR'), error.message);
      }
    }
  };

  const handleMFA = (error) => {
    console.log('MFA Error:', error.code);
    if (error.code === 'auth/multi-factor-auth-required') {
      Alert.alert(
        t('MFA_REQUIRED'),
        t('MFA_DESCRIPTION'),
        [
          { text: t('CANCEL'), style: 'cancel' },
          { text: t('OK'), onPress: () => console.log('MFA handling not implemented yet') }
        ]
      );
    }
  };

  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  function handleForgotPasswordModal() {
    setForgotPasswordModal(!ForgotPasswordModal);
    setResetEmail('');
  }
  
  const handleResetPassword = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      Alert.alert(t('ERROR'), t('INVALID_EMAIL') || 'Please enter a valid email address');
      return;
    }
    
    setIsResetting(true);
    try {
      await auth().sendPasswordResetEmail(resetEmail);
      setIsResetting(false);
      Alert.alert(
        t('SUCCESS') || 'Success',
        t('EMAILSENT') || 'Password reset email sent. Please check your inbox.',
        [
          {
            text: 'OK',
            onPress: () => handleForgotPasswordModal(),
          }
        ]
      );
    } catch (error) {
      setIsResetting(false);
      console.error('Password reset error:', error);
      Alert.alert(t('ERROR'), error.message || 'Error sending reset email');
    }
  };

  function handleInputFocused({ FocusedOn }) {
    setInputFocused(FocusedOn);
  }
  
  function handleSecurePassword() {
    setSecurePassword(!SecurePassword);
  }

  const LoginIconsData = useMemo(
    () => [
      {
        svgIcon: (
          <Svg width={56} height={56} viewBox="0 0 24 24">
            {/* Black circle background */}
            <Path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#000000"/>
            {/* Colorful Google G logo */}
            <Path d="M18.2 12.2C18.2 11.7 18.16 11.2 18.08 10.72H12V13.52H15.52C15.36 14.36 14.88 15.08 14.16 15.56V17.28H16.28C17.48 16.16 18.2 14.4 18.2 12.2Z" fill="#4285F4"/>
            <Path d="M12 19C13.88 19 15.48 18.36 16.28 17.28L14.16 15.56C13.6 15.92 12.88 16.16 12 16.16C10.2 16.16 8.64 15.04 8.12 13.48H5.92V15.28C6.72 16.88 8.76 19 12 19Z" fill="#34A853"/>
            <Path d="M8.12 13.48C7.96 13.08 7.88 12.64 7.88 12.2C7.88 11.76 7.96 11.32 8.12 10.92V9.12H5.92C5.48 9.96 5.2 10.92 5.2 12.2C5.2 13.48 5.48 14.44 5.92 15.28L8.12 13.48Z" fill="#FBBC05"/>
            <Path d="M12 8.24C12.96 8.24 13.8 8.56 14.48 9.2L16.36 7.32C15.48 6.52 13.88 6 12 6C8.76 6 6.72 8.12 5.92 9.12L8.12 10.92C8.64 9.36 10.2 8.24 12 8.24Z" fill="#EA4335"/>
          </Svg>
        ),
        backgroundColor: 'transparent',
        borderWidth: 0,
        onPress: createOrSignInUserViaGoogle,
      },
      // FACEBOOK LOGIN BUTTON - TEMPORARILY HIDDEN
      /*
      {
        svgIcon: (
          <Image 
            source={require('../../../../assets/icons/fb_logo.jpeg')} 
            style={{ width: 56, height: 56, borderRadius: 28 }}
            resizeMode="cover"
          />
        ),
        backgroundColor: 'transparent',
        borderWidth: 0,
        onPress: createOrSignInViaFacebook,
      },
      */
      ...(Platform.OS === 'ios' ? [{
        svgIcon: (
          <Svg width={56} height={56} viewBox="0 0 24 24">
            {/* Black circle background */}
            <Path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#000000"/>
            {/* White Apple logo - scaled down to 70% */}
            <Path
              d="M15.178 11.407C15.178 11.463 15.08 13.129 16.9 13.99C16.557 15.026 15.395 17.329 14.037 17.343C13.253 17.343 12.791 16.839 11.909 16.839C11.027 16.839 10.495 17.329 9.795 17.343C8.451 17.385 6.563 14.651 6.206 13.622C5.94 12.838 5.807 12.075 5.807 11.34C5.807 8.748 7.459 7.416 8.92 7.395C9.676 7.395 10.635 7.948 11.048 7.948C11.447 7.948 12.625 7.29 13.619 7.367C14.662 7.451 15.46 7.864 15.985 8.62C15.047 9.194 14.585 9.871 14.592 11.407H15.178ZM13.417 6.187C14.187 5.277 14.117 4.444 14.089 4.15C13.41 4.192 12.626 4.612 12.178 5.13C11.688 5.69 11.394 6.376 11.457 7.153C12.192 7.209 12.864 6.831 13.417 6.187Z"
              fill="#FFFFFF"
              transform="translate(0.5, 0.5)"
            />
          </Svg>
        ),
        backgroundColor: 'transparent',
        borderWidth: 0,
        onPress: createOrSignInViaApple,
      }] : []),
    ],
    [],
  );

  return {
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
    createOrSignInUserViaGoogle,
    createOrSignInViaApple,
    createOrSignInViaFacebook,
  };
}
