import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

const IncomingCallModal = ({ 
  visible, 
  call, 
  onAccept, 
  onReject, 
  user,
  onClose 
}) => {
  const { t } = useTranslation();
  const [callerInfo, setCallerInfo] = useState(null);

  useEffect(() => {
    if (call && call.getSender) {
      const sender = call.getSender();
      setCallerInfo({
        uid: sender.getUid(),
        name: sender.getName(),
        avatar: sender.getAvatar()
      });
    }
  }, [call]);

  const handleAccept = () => {
    if (onAccept) {
      onAccept(call);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(call);
    }
    if (onClose) {
      onClose();
    }
  };

  if (!visible || !call) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleReject}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.username || callerInfo?.name || 'Unknown User'}
            </Text>
            <Text style={styles.callingText}>
              {t('ISCALLING')}...
            </Text>
          </View>
          
          <Image
            source={
              user?.profilePictures?.thumbnails?.big 
                ? { uri: user.profilePictures.thumbnails.big }
                : require('../assets/images/no-image.png')
            }
            style={styles.userImage}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={handleReject}
            >
              <Image
                source={require('../assets/icons/call-end-red.png')}
                style={styles.buttonIcon}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
            >
              <Image
                source={require('../assets/icons/call-accept.png')}
                style={styles.buttonIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: width * 0.8,
    maxWidth: 350,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  callingText: {
    fontSize: 16,
    color: '#666',
  },
  userImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#ff4444',
  },
  acceptButton: {
    backgroundColor: '#44ff44',
  },
  buttonIcon: {
    width: 30,
    height: 30,
    tintColor: 'white',
  },
});

export default IncomingCallModal;
