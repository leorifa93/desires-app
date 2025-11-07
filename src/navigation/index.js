import React, {Component, useEffect, useState, useRef} from 'react';
import {View, Text} from 'react-native';
import {NavigationContainer, CommonActions} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AuthNavigation from './auth';
import AppNavigation from './app';
import CommonNavigation from './common';
import {routes} from '../services';
import {Splash, RegisterSteps, PhoneVerification, VerificationChoice} from '../screens/auth';
import * as App from '../screens/app';
import {navigationRef} from './rootNavigation';
import { useDispatch, useSelector } from 'react-redux';
import { monitorAuthState } from '../store/actions';
import { STATUS_ACTIVE, STATUS_PENDING } from '../constants/User';
import { UploadBanner } from '../components/loaders';

const MainStack = createNativeStackNavigator();

export default function Navigation() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const dataLoaded = useSelector((state) => state.auth.dataLoaded);
  const hasNavigated = useRef(false);
  const isInAppArea = useRef(false);
  
  // Reset hasNavigated on app start for debugging
  useEffect(() => {
    hasNavigated.current = false;
    isInAppArea.current = false;
    console.log('Navigation: Reset hasNavigated to false');
  }, []);

  useEffect(() => {
    // Always monitor auth state once when component mounts
    // This ensures Firebase auth persistence works correctly
    console.log('Navigation: Dispatching monitorAuthState...');
    dispatch(monitorAuthState());
  }, []);

  // Handle navigation when user state changes
  useEffect(() => {
    console.log('Navigation useEffect triggered - user:', !!user, 'dataLoaded:', dataLoaded, 'hasNavigated:', hasNavigated.current, 'isInAppArea:', isInAppArea.current);
    console.log('Navigation useEffect - user details:', user?.id, user?.status, user?.verifiedPhoneNumber, user?.verificationChoiceMade, user?.isVerified);
    
    // If we're already in the app area and user is still valid, don't navigate again
    if (isInAppArea.current && user && user.status === STATUS_ACTIVE && user.verifiedPhoneNumber) {
      console.log('Navigation: Already in app area, skipping navigation');
      return;
    }
    
    // Only navigate if we have a complete user object with all required fields
    if (user && user.id && user.status !== undefined && dataLoaded) {
      console.log('Navigation: User found, status:', user.status, 'verifiedPhoneNumber:', user.verifiedPhoneNumber, 'navigating...');
      
      // Add a small delay to ensure state is fully updated
      setTimeout(() => {
        // First ensure phone OTP has been completed for both PENDING and ACTIVE users
        if (!user.verifiedPhoneNumber) {
          const currentRouteName = navigationRef.current?.getCurrentRoute?.()?.name;
          if (currentRouteName !== routes.phoneVerification) {
            console.log('Navigation: Phone not verified → phoneVerification');
            isInAppArea.current = false;
            navigationRef.current?.navigate({ name: routes.phoneVerification });
          } else {
            console.log('Navigation: Already on phoneVerification, skipping navigation');
          }
          return;
        }

        if (user.status === STATUS_PENDING) {
          const currentRouteName = navigationRef.current?.getCurrentRoute?.()?.name;
          if (currentRouteName !== routes.registerSteps) {
            console.log('Navigation: STATUS_PENDING + verified phone → registerSteps');
            isInAppArea.current = false;
            navigationRef.current?.navigate({ name: routes.registerSteps });
          } else {
            console.log('Navigation: Already on registerSteps, skipping navigation');
          }
        } else if (user.status === STATUS_ACTIVE) {
          // Then handle profile verification choice flow
          // Check if user has made a temporary choice or permanent verification choice
          const hasMadeChoice = user.verificationChoiceMade || user.hasMadeTemporaryChoice;
          
          console.log('Navigation: STATUS_ACTIVE check - verificationChoiceMade:', user.verificationChoiceMade);
          console.log('Navigation: STATUS_ACTIVE check - hasMadeTemporaryChoice:', user.hasMadeTemporaryChoice);
          console.log('Navigation: STATUS_ACTIVE check - temporaryChoice:', user.temporaryChoice);
          console.log('Navigation: STATUS_ACTIVE check - hasMadeChoice:', hasMadeChoice);
          console.log('Navigation: STATUS_ACTIVE check - isVerified:', user.isVerified);
          
          if (!hasMadeChoice && !user.isVerified) {
            // Check if we're already on verificationChoice or subscription to avoid redundant navigation
            const currentRouteName = navigationRef.current?.getCurrentRoute?.()?.name;
            console.log('Navigation: Current route:', currentRouteName);
            
            // If user is already on subscription, don't navigate back to verificationChoice
            if (currentRouteName === routes.subscription) {
              console.log('Navigation: User is already on subscription, skipping navigation');
              return;
            }
            
            if (currentRouteName !== routes.verificationChoice) {
              console.log('Navigation: STATUS_ACTIVE without verification choice → verificationChoice');
              isInAppArea.current = false;
              navigationRef.current?.navigate({ name: routes.verificationChoice });
            } else {
              console.log('Navigation: Already on verificationChoice, skipping navigation');
            }
          } else {
            console.log('Navigation: STATUS_ACTIVE and verified or choice made → app (reset stack)');
            isInAppArea.current = true;
            navigationRef.current?.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{name: routes.app}],
              }),
            );
          }
        }
      }, 100);
    } else if (!user && dataLoaded) {
      // Only navigate to auth if we're sure the user is actually logged out
      const currentRouteName = navigationRef.current?.getCurrentRoute?.()?.name;
      console.log('Navigation: No user found in Redux. Current route:', currentRouteName, '→ auth');
      console.log('Navigation: User object:', user);
      console.log('Navigation: DataLoaded:', dataLoaded);
      // Avoid redundant resets if we are already on auth (including its child screens)
      const authChildRoutes = [
        routes.auth,
        routes.credentialScreen,
        routes.signin,
        routes.createAccount,
      ];
      if (authChildRoutes.includes(currentRouteName)) {
        console.log('Navigation: Already within auth flow, skipping reset');
        isInAppArea.current = false;
        return;
      }
      isInAppArea.current = false;
      setTimeout(() => {
        navigationRef.current?.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: routes.auth}],
          }),
        );
      }, 100);
    } else {
      console.log('Navigation: Conditions not met - user:', !!user, 'dataLoaded:', dataLoaded, 'user.id:', user?.id, 'user.status:', user?.status);
    }
  }, [user?.id, user?.status, user?.verifiedPhoneNumber, user?.verificationChoiceMade, user?.isVerified, dataLoaded]);

  // Show splash screen while auth state is not yet resolved
  console.log('Navigation render - dataLoaded:', dataLoaded, 'user:', !!user);
  if (!dataLoaded) {
    console.log('Navigation: Showing splash screen because dataLoaded is false');
    return <Splash />;
  }
  
  // Determine initial route based on user authentication status
  let initialRoute = routes.auth;
  if (user && user.id && dataLoaded && user.status !== undefined) {
    console.log('Navigation: Setting initialRoute based on user status:', user.status);
    if (!user.verifiedPhoneNumber) {
      initialRoute = routes.phoneVerification;
    } else if (user.status === STATUS_PENDING) {
      initialRoute = routes.registerSteps;
    } else if (user.status === STATUS_ACTIVE) {
      if (!user.verificationChoiceMade && !user.isVerified) {
        initialRoute = routes.verificationChoice;
      } else {
        initialRoute = routes.app;
      }
    }
  }
  
  console.log('Navigation: Final initialRoute:', initialRoute);
  
  return (
    <NavigationContainer ref={navigationRef}>
      <MainStack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName={initialRoute}>
        <MainStack.Screen name={routes.auth} component={AuthNavigation} />
        <MainStack.Screen name={routes.phoneVerification} component={PhoneVerification} />
        <MainStack.Screen name={routes.registerSteps} component={RegisterSteps} />
        <MainStack.Screen name={routes.verificationChoice} component={VerificationChoice} />
        <MainStack.Screen name={routes.verifyProfile} component={App.VerifyProfile} />
        <MainStack.Screen name={routes.app} component={AppNavigation} />
        <MainStack.Screen name={routes.common} component={CommonNavigation} />
      </MainStack.Navigator>
      {/* Global upload banner visible anywhere */}
      <UploadBanner visible={!!user?.publicPicturesUploading} />
    </NavigationContainer>
  );
}
