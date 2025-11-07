import React, {Component} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {routes, headers} from '../../services';
import * as App from '../../screens/app';
import BottomTab from './bottomTab';
const AppStack = createNativeStackNavigator();

const AppNavigation = () => {
  return (
    <AppStack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName={routes.bottomTab}>
      <AppStack.Screen name={routes.bottomTab} component={BottomTab} />
      <AppStack.Screen name={routes.mySearch} component={App.MySearch} />
      <AppStack.Screen name={routes.userSearch} component={App.UserSearch} />
      <AppStack.Screen name={routes.buyCoins} component={App.BuyCoins} />
      <AppStack.Screen name={routes.appSetting} component={App.AppSetting} />
      <AppStack.Screen name={routes.position} component={App.Position} />
      <AppStack.Screen
        name={routes.subscription}
        component={App.Subscription}
      />
      <AppStack.Screen name={routes.support} component={App.Support} />
      <AppStack.Screen name={routes.postDetail} component={App.PostDetail} />
      {/* Friends Pages */}
      <AppStack.Screen
        name={routes.friendRequests}
        component={App.FriendResquest}
      />
      <AppStack.Screen name={routes.chatScreen} component={App.ChatScreen} />
      <AppStack.Screen name={routes.audioCall} component={App.AudioCall} />
      <AppStack.Screen name={routes.videoCall} component={App.VideoCall} />
      <AppStack.Screen name={routes.incomingCall} component={App.IncomingCall} />
      <AppStack.Screen name={routes.userProfile} component={App.UserProfile} />
      <AppStack.Screen
        name={routes.InComingRequest}
        component={App.InComingRequest}
      />
      <AppStack.Screen name={routes.revoke} component={App.Revoke} />
      <AppStack.Screen name={routes.blockedUser} component={App.BlockedUser} />
      <AppStack.Screen name={routes.requestSent} component={App.RequestSent} />
      {/* // */}
      <AppStack.Screen name={routes.myCredit} component={App.MyCredit} />
      <AppStack.Screen
        name={routes.inviteFriends}
        component={App.InviteFriends}
      />
      <AppStack.Screen
        name={routes.verifyProfile}
        component={App.VerifyProfile}
      />
      <AppStack.Screen name={routes.notifications} component={App.Notifications} />
      
      {/* Backend Routes */}
      <AppStack.Screen name={routes.backend} component={App.Backend} />
      <AppStack.Screen
        name={routes['backend-image-proof']}
        component={App.BackendImageProof}
      />
      <AppStack.Screen
        name={routes['backend-verification']}
        component={App.BackendVerification}
      />
      <AppStack.Screen
        name={routes['backend-sell-history']}
        component={App.BackendSellHistory}
      />
      <AppStack.Screen
        name={routes['backend-all-users']}
        component={App.BackendAllUsers}
      />
      <AppStack.Screen
        name={routes['backend-demo-chats']}
        component={App.BackendDemoChats}
      />
      <AppStack.Screen
        name="EditUserProfile"
        component={App.EditUserProfile}
      />
    </AppStack.Navigator>
  );
};

export default AppNavigation;
