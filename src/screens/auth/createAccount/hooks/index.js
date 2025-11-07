import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Alert, Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { STATUS_PENDING, STATUS_ACTIVE, Membership } from '../../../../constants/User';
import { colors, routes } from '../../../../services';
import locationService from '../../../../services/locationService';
import fcmService from '../../../../services/fcmService';
import { navigate } from '../../../../navigation/rootNavigation';

export function useHooks() {
  const { t } = useTranslation();
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const createUserWithEmail = async (email, password, userData = {}) => {
    try {
      setIsCreatingUser(true);
      
      // Create user in Firebase Auth
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Create user document in Firestore with default values
      const userDoc = {
        id: user.uid,
        email: user.email,
        status: STATUS_PENDING,
        membership: Membership.Standard,
        createdOn: Date.now(),
        lastLogin: Date.now(),
        conversationsAvailableCount: 5,
        likesAvailableCount: 10,
        _settings: {
          units: {
            lengthType: 'Inch',
            distanceType: 'Mi',
            weightType: 'Lbs'
          },
          notifications: {
            messages: true,
            friendRequests: true,
            likes: true,
            call: true
          },
          currentLang: 'de',
          showInDiscover: false,
          showCall: true
        },
        // Add user data from registration steps
        ...userData
      };

      // Try to get current location and add to user data
      try {
        console.log('CreateAccount: Requesting location permissions...');
        const currentLocation = await locationService.getCurrentLocation();
        
        // Add location to user document
        userDoc.currentLocation = {
          ...currentLocation,
          city: 'Unknown',
          placeId: null
        };
        
        console.log('CreateAccount: Location obtained:', userDoc.currentLocation);
      } catch (error) {
        console.warn('CreateAccount: Could not get location:', error.message);
        // Continue without location - user can set it later in registerSteps
      }

      // Save to Firestore
      await firestore().collection('Users').doc(user.uid).set(userDoc);

      // Initialize FCM and save token for new user (status = 1 for active users)
      if (userDoc.status === 1) {
        try {
          await fcmService.initialize();
          await fcmService.registerForPushNotificationsAsync(user.uid);
        } catch (error) {
          console.error('CreateAccount: FCM initialization failed:', error);
        }
      } else {
        console.log('CreateAccount: User status is not active, skipping FCM initialization');
      }

      // Don't navigate manually - let the auth listener handle navigation
      // The auth listener will detect STATUS_PENDING and navigate to registerSteps
      
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Use the error message directly as it's already translated in firebaseProvider
      Alert.alert(t('ERROR'), t(error.message) || error.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const createOrSignInUserViaGoogle = async () => {
    try {
      setIsCreatingUser(true);
      
      // Initialize Google Sign-In
      GoogleSignin.configure({
        webClientId: '750696506520-qo39og1l3lbgafhpt14tg8g55ppe7rl2.apps.googleusercontent.com', // Web Client ID
        iosClientId: '750696506520-e4vn1idu81b2cl2fsfj47ulhlcnn6ft0.apps.googleusercontent.com', // iOS Client ID
        offlineAccess: true,
      });
      
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In successful:', userInfo);
      
      // Get Google credentials
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);
      
      // Sign in with Firebase
      console.log('Attempting Firebase sign-in with Google credential');
      const userCredential = await auth().signInWithCredential(googleCredential);
      const user = userCredential.user;
      console.log('Firebase sign-in successful:', user.uid);

      // Check if user document exists
      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        // Create new user document
        const userData = {
          id: user.uid,
          email: user.email,
          status: STATUS_PENDING,
          membership: Membership.Standard,
          createdOn: Date.now(),
          lastLogin: Date.now(),
          conversationsAvailableCount: 5,
          likesAvailableCount: 10,
          _settings: {
            units: {
              lengthType: 'Inch',
              distanceType: 'Mi',
              weightType: 'Lbs'
            },
            notifications: {
              messages: true,
              friendRequests: true,
              likes: true,
              call: true
            },
            currentLang: 'de',
            showInDiscover: false,
            showCall: true
          }
        };

        await firestore().collection('Users').doc(user.uid).set(userData);
        
        // Don't navigate manually - let the auth listener handle navigation
      } else {
        // User exists, auth listener will handle navigation based on status
      }
      
    } catch (error) {
      console.error('Error with Google sign-in:', error);
      if (error.code === 'auth/multi-factor-auth-required') {
        handleMFA();
      } else {
        Alert.alert(t('ERROR'), t('ERROR_GOOGLE_SIGNIN'));
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const createOrSignInViaApple = async () => {
    try {
      setIsCreatingUser(true);
      
      if (Platform.OS !== 'ios') {
        Alert.alert(t('ERROR'), t('APPLE_SIGNIN_IOS_ONLY'));
        return;
      }

      // Request Apple authentication
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // Create Apple credential
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

      // Sign in with Firebase
      const userCredential = await auth().signInWithCredential(appleCredential);
      const user = userCredential.user;

      // Check if user document exists
      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        // Create new user document
        const userData = {
          id: user.uid,
          email: user.email,
          status: STATUS_PENDING,
          membership: Membership.Standard,
          createdOn: Date.now(),
          lastLogin: Date.now(),
          conversationsAvailableCount: 5,
          likesAvailableCount: 10,
          _settings: {
            units: {
              lengthType: 'Inch',
              distanceType: 'Mi',
              weightType: 'Lbs'
            },
            notifications: {
              messages: true,
              friendRequests: true,
              likes: true,
              call: true
            },
            currentLang: 'de',
            showInDiscover: false,
            showCall: true
          }
        };

        await firestore().collection('Users').doc(user.uid).set(userData);
        
        // Don't navigate manually - let the auth listener handle navigation
      } else {
        // User exists, auth listener will handle navigation based on status
      }
      
    } catch (error) {
      console.error('Error with Apple sign-in:', error);
      if (error.code === 'auth/multi-factor-auth-required') {
        handleMFA();
      } else {
        Alert.alert(t('ERROR'), t('ERROR_APPLE_SIGNIN'));
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const createOrSignInViaFacebook = async () => {
    try {
      setIsCreatingUser(true);
      
      // Request Facebook login
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      
      if (result.isCancelled) {
        return;
      }

      // Get access token
      const data = await AccessToken.getCurrentAccessToken();
      
      if (!data) {
        Alert.alert(t('ERROR'), t('ERROR_GETTING_FACEBOOK_TOKEN'));
        return;
      }

      // Create Facebook credential
      const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);
      
      // Sign in with Firebase
      const userCredential = await auth().signInWithCredential(facebookCredential);
      const user = userCredential.user;

      // Check if user document exists
      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        // Create new user document
        const userData = {
          id: user.uid,
          email: user.email,
          status: STATUS_PENDING,
          membership: Membership.Standard,
          createdOn: Date.now(),
          lastLogin: Date.now(),
          conversationsAvailableCount: 5,
          likesAvailableCount: 10,
          _settings: {
            units: {
              lengthType: 'Inch',
              distanceType: 'Mi',
              weightType: 'Lbs'
            },
            notifications: {
              messages: true,
              friendRequests: true,
              likes: true,
              call: true
            },
            currentLang: 'de',
            showInDiscover: false,
            showCall: true
          }
        };

        await firestore().collection('Users').doc(user.uid).set(userData);
        
        // Don't navigate manually - let the auth listener handle navigation
      } else {
        // User exists, auth listener will handle navigation based on status
      }
      
    } catch (error) {
      console.error('Error with Facebook sign-in:', error);
      if (error.code === 'auth/multi-factor-auth-required') {
        handleMFA();
      } else {
        Alert.alert(t('ERROR'), t('ERROR_FACEBOOK_SIGNIN'));
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleMFA = () => {
    Alert.alert(
      t('MFA_REQUIRED'),
      t('MFA_DESCRIPTION'),
      [{ text: t('OK'), style: 'default' }]
    );
  };

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

  const GenderData = [
    { Title: t('MALE'), key: 1 },
    { Title: t('FEMALE'), key: 2 },
    { Title: t('TRANSSEXUAL'), key: 3 }
  ];

  return {
    isCreatingUser,
    createUserWithEmail,
    createOrSignInUserViaGoogle,
    createOrSignInViaApple,
    createOrSignInViaFacebook, // Function still available, just button hidden
    LoginIconsData,
    GenderData
  };
}
