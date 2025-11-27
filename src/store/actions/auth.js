// setUser is defined as an action creator below
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { navigate } from '../../navigation/rootNavigation';
import { routes } from '../../services';
import { STATUS_ACTIVE, STATUS_PENDING, STATUS_DELETED } from '../../constants/User';
import { CONVERSATION_AVAILABLE_COUNT, LIKES_AVAILABLE_COUNT } from '../../constants/User';
import { serializeFirestoreData } from '../../utils/serializeFirestoreData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistor } from '../index';
import badgeService from '../../services/badgeService';
import locationService from '../../services/locationService';
import fcmService from '../../services/fcmService';
import callService from '../../services/callService';

// Helper function to generate session ID
const generateSessionId = () => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Action creator for setUser - for updating user object (like boost)
export const setUser = (payload) => {
  return {
    type: 'auth/setUser',
    payload: {
      user: payload.user, // Don't serialize here, let the reducer handle it
      dataLoaded: payload.dataLoaded ?? true
    }
  };
};

// Action creator for setAuthState - for auth state management
export const setAuthState = (user, dataLoaded) => ({
  type: 'auth/setUser',
  payload: {
    user: user ? serializeFirestoreData(user) : null,
    dataLoaded: dataLoaded
  }
});

export const signOut = (isSessionExpired = false) => async (dispatch, getState) => {
    try {
        // Remove incoming call listener
        callService.removeIncomingCallListener();
        
        // Remove user data snapshot listener
        if (userDataUnsubscribe) {
            console.log('Auth: Removing user data snapshot listener');
            userDataUnsubscribe();
            userDataUnsubscribe = null;
        }
        
        const currentUser = getState().auth.user;

        // Unsubscribe admin topic if necessary before clearing auth state
        if (currentUser?.isAdmin) {
            try {
                await fcmService.unsubscribeFromTopic('admin');
            } catch (error) {
                console.error('Auth: Error unsubscribing from admin topic:', error);
            }
        }

        // Sign out from Firebase
        await auth().signOut();
        
        // Remove FCM token from user document
        try {
            if (currentUser?.id) {
                await fcmService.removeTokenFromUser(currentUser.id);
            }
        } catch (error) {
            console.error('Auth: Error removing FCM token:', error);
        }

        // Clear session ID from AsyncStorage
        try {
            await AsyncStorage.removeItem('activeSessionId');
        } catch (error) {
            console.error('Auth: Error clearing session ID:', error);
        }

        // Clear user from Redux store
        dispatch({ 
            type: 'auth/setUser', 
            payload: { user: null, dataLoaded: true } 
        });

        // Clear persisted state
        try {
            await AsyncStorage.removeItem('persist:root');
            await persistor.purge();
        } catch (e) {
            console.warn('Auth: Could not clear persisted auth state', e);
        }
        
        // Clear app icon badge
        try {
            badgeService.clearBadge();
        } catch (error) {
            console.error('Auth: Error clearing badge:', error);
        }
        
        // Navigate to auth screen
        navigate(routes.auth);
        
        authListenerInitialized = false;
        
        // Show alert if session expired due to another login
        if (isSessionExpired) {
            setTimeout(() => {
                // Import Alert and i18next dynamically to avoid circular dependencies
                const { Alert } = require('react-native');
                const i18next = require('i18next');
                Alert.alert(
                    i18next.t('SESSION_ENDED_TITLE'),
                    i18next.t('SESSION_ENDED_MESSAGE'),
                    [{ text: 'OK' }]
                );
            }, 500);
        }
    } catch (error) {
        console.error('Auth: Logout failed:', error);
    }
};

let authListenerInitialized = false;
let authStateUnsubscribe = null;
let authCheckInterval = null;
let userDataUnsubscribe = null;

export const monitorAuthState = () => (dispatch, getState) => {
    console.log('Auth: monitorAuthState called');
    
    // Clean up existing listener if it exists
    if (authStateUnsubscribe) {
        console.log('Auth: Cleaning up existing listener');
        authStateUnsubscribe();
        authStateUnsubscribe = null;
    }
    
    console.log('Auth: Initializing auth state listener...');
    authListenerInitialized = true;
    
    // Clear any existing auth state first
    console.log('Auth: Clearing existing auth state');
    dispatch(setAuthState(null, false));
    
    // Add a periodic check to ensure Redux state matches Firebase Auth state
    const checkAuthState = () => {
        const currentFirebaseUser = auth().currentUser;
        const currentReduxUser = getState().auth.user;
        
        // If Firebase has no user but Redux still has a user, clear Redux
        if (!currentFirebaseUser && currentReduxUser) {
            dispatch(setAuthState(null, true));
        }
    };
    
    // Check every 5 seconds
    const authCheckInterval = setInterval(checkAuthState, 5000);
    
    // Note: Firebase Auth persistence should be configured in firebase initialization
    // For React Native Firebase, persistence is handled by the native SDK automatically
    
    console.log('Auth: Setting up onAuthStateChanged listener...');
    authStateUnsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
        console.log('Auth: onAuthStateChanged fired, firebaseUser:', !!firebaseUser);
        try {
            if (firebaseUser) {
            console.log('Auth: Firebase user found:', firebaseUser.uid);
            try {
                console.log('Auth: Fetching user document from Firestore...');
                const userDoc = await firestore().collection('Users').doc(firebaseUser.uid).get();
                console.log('Auth: User document fetched, exists:', userDoc.exists);
                
                if (!userDoc.exists) {
                    // User document doesn't exist, create a basic user object
                    const basicUser = {
                        id: firebaseUser.uid,
                        email: firebaseUser.email,
                        status: STATUS_PENDING,
                        createdOn: Date.now(),
                    };
                    
                    try {
                        // Create the user document in Firestore
                        await firestore().collection('Users').doc(firebaseUser.uid).set(basicUser);
                        dispatch(setAuthState(basicUser, true));
                        return;
                    } catch (error) {
                        console.error('Auth: Error creating user document:', error);
                        dispatch(setAuthState(basicUser, true));
                        return;
                    }
                }
                
                const user = userDoc.data();
                console.log('Auth: User data retrieved, status:', user?.status);

                if (user) {
                    console.log('Auth: Processing user, checking status conditions...');
                    // Check if user is deleted
                    if (user.status === STATUS_DELETED) {
                        console.log('Auth: User is deleted, signing out');
                        await auth().signOut();
                        dispatch(setAuthState(null, true));
                        return;
                    }

                    // Check if user is pending (registration not complete)
                    console.log('Auth: Checking if user is pending...');
                    if (user.status === STATUS_PENDING || user.status == STATUS_PENDING) {
                        console.log('Auth: User is pending, dispatching auth state');
                        // Check if phone is verified (in production)
                        if (user.verifiedPhoneNumber || __DEV__) {
                            // Navigate to register steps to complete profile
                            const serializedUser = serializeFirestoreData({ id: firebaseUser.uid, email: firebaseUser.email, ...user });
                            dispatch(setAuthState(serializedUser, true));
                            return;
                        } else {
                            // Navigate to phone verification if phone not verified
                            const serializedUser = serializeFirestoreData({ id: firebaseUser.uid, email: firebaseUser.email, ...user });
                            dispatch(setAuthState(serializedUser, true));
                            return;
                        }
                    }

                    // User is active, complete the setup
                    console.log('Auth: Checking if user is active...');
                    if (user.status === STATUS_ACTIVE || user.status == STATUS_ACTIVE) {
                        console.log('Auth: User is active, setting up...');
                        // Reset daily limits if it's a new day
                        const lastLogin = user.lastLogin ? new Date(user.lastLogin) : new Date();
                        const today = new Date();
                        
                        console.log('Auth: Checking daily limits reset...');
                        if (lastLogin.getDay() !== today.getDay()) {
                            console.log('Auth: Resetting daily limits');
                            user.conversationsAvailableCount = CONVERSATION_AVAILABLE_COUNT;
                            user.likesAvailableCount = LIKES_AVAILABLE_COUNT;
                        }

                        // Update last login
                        user.lastLogin = Date.now();

                        // Set default settings if not exists
                        if (typeof user._settings?.showCall === 'undefined') {
                            if (!user._settings) user._settings = {};
                            user._settings.showCall = true;
                        }

                        // Get or generate session ID
                        // Reuse existing session ID if available (to prevent logout on app restart)
                        let sessionId = await AsyncStorage.getItem('activeSessionId');
                        if (!sessionId) {
                            // Generate new session ID only if none exists
                            sessionId = generateSessionId();
                            await AsyncStorage.setItem('activeSessionId', sessionId);
                            console.log('Auth: Generated new session ID:', sessionId);
                        } else {
                            console.log('Auth: Reusing existing session ID:', sessionId);
                        }

                        // Prepare update data with fallbacks
                        const updateData = {
                            lastLogin: user.lastLogin,
                            conversationsAvailableCount: user.conversationsAvailableCount || CONVERSATION_AVAILABLE_COUNT,
                            likesAvailableCount: user.likesAvailableCount || LIKES_AVAILABLE_COUNT,
                            activeSessionId: sessionId, // Store session ID in Firestore
                        };

                        // Only add _settings if it exists
                        if (user._settings && typeof user._settings.showCall !== 'undefined') {
                            updateData['_settings.showCall'] = user._settings.showCall;
                        }

                        // Only update location if user doesn't have a custom location set
                        // If location.type === 'customLocation', keep the custom location (like old project)
                        if (user.location?.type !== 'customLocation') {
                            console.log('Auth: User has no custom location, will update in background');
                            // User has GPS location or no location - update it IN BACKGROUND
                            locationService.detectCurrentLocation(user)
                                .then(async (currentLocation) => {
                                    // Get city name if we have coordinates but no city
                                    if (currentLocation.lat && currentLocation.lng && !currentLocation.city) {
                                        try {
                                            const city = await locationService.getCityFromLatLng(currentLocation.lat, currentLocation.lng);
                                            currentLocation.city = city;
                                        } catch (error) {
                                            console.warn('Could not get city name:', error);
                                        }
                                    }
                                    
                                    // Update location in background
                                    await firestore().collection('Users').doc(firebaseUser.uid).update({
                                        currentLocation: currentLocation,
                                        location: { type: 'currentLocation' }
                                    });
                                    console.log('Auth: Location updated in background');
                                })
                                .catch(error => {
                                    console.warn('Could not get GPS location:', error);
                                });
                        } else {
                            // User has custom location - keep it unchanged
                            console.log('User has custom location, keeping it unchanged');
                            // Don't update currentLocation or location.type
                        }
                        
                        // Update user in Firestore - AWAIT this to prevent race condition with snapshot listener
                        console.log('Auth: Updating user document (lastLogin, limits, session)...');
                        try {
                            await firestore().collection('Users').doc(firebaseUser.uid).update(updateData);
                            console.log('Auth: User document updated successfully');
                        } catch (updateError) {
                            console.error('Auth: Failed to update user in Firestore:', updateError);
                        }

                        // Clean user object before dispatching (remove undefined values)
                        const cleanUser = Object.fromEntries(
                            Object.entries(user).filter(([_, value]) => value !== undefined)
                        );

                        // Set user in Redux and navigate to app
                        console.log('Auth: Dispatching user to Redux with dataLoaded=true');
                        const serializedCleanUser = serializeFirestoreData(cleanUser);
                        dispatch(setAuthState(serializedCleanUser, true));
                        console.log('Auth: User dispatched to Redux');
                        
                        // Set up real-time listener for user data changes AFTER session ID is saved
                        if (!userDataUnsubscribe) {
                            userDataUnsubscribe = firestore()
                                .collection('Users')
                                .doc(firebaseUser.uid)
                                .onSnapshot(async (doc) => {
                                    if (doc.exists) {
                                        const updatedUser = doc.data();
                                        
                                        // Check if session ID matches (Single-Session enforcement)
                                        if (updatedUser.activeSessionId) {
                                            try {
                                                const localSessionId = await AsyncStorage.getItem('activeSessionId');
                                                
                                                if (localSessionId && localSessionId !== updatedUser.activeSessionId) {
                                                    // Another device logged in - logout this session
                                                    dispatch(signOut(true)); // Pass true to show session expired message
                                                    return;
                                                }
                                            } catch (error) {
                                                console.error('Auth: Error checking session ID:', error);
                                            }
                                        }
                                        
                                        const serializedUser = serializeFirestoreData({ id: doc.id, ...updatedUser });
                                        dispatch(setAuthState(serializedUser, true));
                                    }
                                }, (error) => {
                                    console.error('Auth: Error in user snapshot listener:', error);
                                });
                        }
                        
                        // Update app icon badge
                        try {
                            badgeService.updateBadge(serializedCleanUser);
                        } catch (error) {
                            console.error('Auth: Error updating badge:', error);
                        }
                        
                        // Initialize FCM and save token (only for active users - status = 1)
                        // Run in background to avoid blocking the UI
                        if (serializedCleanUser.status === 1) {
                            console.log('Auth: Starting FCM initialization in background for user:', firebaseUser.uid);
                            fcmService.initialize()
                                .then(() => {
                                    console.log('Auth: FCM initialized, now registering...');
                                    return fcmService.registerForPushNotificationsAsync(firebaseUser.uid);
                                })
                                .then(() => {
                                    console.log('Auth: FCM registration completed');
                                    if (serializedCleanUser?.isAdmin) {
                                        console.log('Auth: User is admin - subscribing to admin topic');
                                        fcmService.subscribeToTopic('admin');
                                    } else {
                                        console.log('Auth: User is not admin - ensuring admin topic is unsubscribed');
                                        fcmService.unsubscribeFromTopic('admin');
                                    }
                                })
                                .catch(error => {
                                    console.error('Auth: FCM initialization failed:', error);
                                    console.error('Auth: FCM error details:', JSON.stringify(error));
                                });
                        } else {
                            console.log('Auth: Skipping FCM initialization - user status:', serializedCleanUser.status);
                        }

                        // Set up incoming call listener for active users
                        if (serializedCleanUser.status === 1) {
                            callService.listenForIncomingCalls(firebaseUser.uid, (callData) => {
                                // Navigate to incoming call screen
                                navigate(routes.incomingCall, { callData });
                            });
                        }
                        
                        // Navigation will be handled by the main Navigation component
                        // No need to navigate here as the useEffect in Navigation will handle it
                        return;
                    }

                    // Default case: user exists but status is unknown
                    dispatch(setAuthState({ id: firebaseUser.uid, email: firebaseUser.email, ...user }, false));
                    // Navigation will be handled by the main Navigation component
                } else {
                    // User document doesn't exist, create basic user object
                    // But first check if this is a canceled registration
                    try {
                        // Try to get the user document again to see if it was deleted
                        const userDocCheck = await firestore().collection('Users').doc(firebaseUser.uid).get();
                        if (!userDocCheck.exists) {
                        // User document was deleted (canceled registration), sign out
                        await auth().signOut();
                        dispatch(setAuthState(null, true));
                        // Navigation will be handled by the main Navigation component
                            return;
                        }
                    } catch (error) {
                        // If there's an error, assume user was deleted and sign out
                        await auth().signOut();
                        dispatch(setAuthState(null, true));
                        // Navigation will be handled by the main Navigation component
                        return;
                    }
                    
                    // If we get here, user document exists but data() returned null
                    const serializedBasicUser = serializeFirestoreData({ id: firebaseUser.uid, email: firebaseUser.email });
                    dispatch(setAuthState(serializedBasicUser, false));
                    // Navigation will be handled by the main Navigation component
                }
            } catch (error) {
                console.error('Auth: Error in monitorAuthState:', error);
                // On error, still set basic user info and navigate to register steps
                dispatch(setAuthState({ id: firebaseUser.uid, email: firebaseUser.email }, false));
                // Navigation will be handled by the main Navigation component
            }
            } else {
                // No user signed in
                console.log('Auth: No Firebase user, setting null with dataLoaded=true');
                dispatch(setAuthState(null, true));
                // Navigation will be handled by the main Navigation component
            }
        } catch (error) {
            console.error('Auth: Error in auth state change handler:', error);
            console.error('Auth: Error details:', JSON.stringify(error));
            // On any error, clear user and navigate to auth
            dispatch(setUser({ user: null, dataLoaded: true }));
            // Navigation will be handled by the main Navigation component
        }
    });
    
    console.log('Auth: onAuthStateChanged listener registered successfully');
};



