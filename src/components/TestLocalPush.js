import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { Text, Wrapper } from './index';
import { testLocalPushNotification, testAllNotificationTypes, testNotificationPermissions } from '../services/testLocalPush';
import { colors, scale } from '../services';

const TestLocalPush = () => {
  const handleTestSingle = () => {
    const success = testLocalPushNotification();
    Alert.alert(
      'Test Result',
      success ? 'Test notification sent successfully!' : 'Failed to send test notification',
      [{ text: 'OK' }]
    );
  };

  const handleTestAll = () => {
    const success = testAllNotificationTypes();
    Alert.alert(
      'Test Result',
      success ? 'All notification types tested!' : 'Failed to test notification types',
      [{ text: 'OK' }]
    );
  };

  const handleTestPermissions = async () => {
    const permissions = await testNotificationPermissions();
    Alert.alert(
      'Permissions',
      permissions ? `Permissions: ${JSON.stringify(permissions)}` : 'Failed to get permissions',
      [{ text: 'OK' }]
    );
  };

  return (
    <Wrapper style={{ padding: scale(20) }}>
      <Text style={{ fontSize: scale(18), fontWeight: 'bold', marginBottom: scale(20) }}>
        Test Local Push Notifications
      </Text>
      
      <TouchableOpacity
        onPress={handleTestSingle}
        style={{
          backgroundColor: colors.appPrimaryColor,
          padding: scale(15),
          borderRadius: scale(8),
          marginBottom: scale(10)
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Test Single Notification
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleTestAll}
        style={{
          backgroundColor: colors.appPrimaryColor,
          padding: scale(15),
          borderRadius: scale(8),
          marginBottom: scale(10)
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Test All Notification Types
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleTestPermissions}
        style={{
          backgroundColor: colors.appPrimaryColor,
          padding: scale(15),
          borderRadius: scale(8),
          marginBottom: scale(10)
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Test Permissions
        </Text>
      </TouchableOpacity>
    </Wrapper>
  );
};

export default TestLocalPush;








