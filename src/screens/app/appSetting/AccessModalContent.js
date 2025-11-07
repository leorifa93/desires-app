import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { Text, Buttons, TextInputs, Labels, Spacer, Wrapper } from '../../../components';
import auth from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next';
import { setUser } from '../../../store/reducers/auth';
import { responsiveHeight } from '../../../services';
import api, { userApi } from '../../../services/utilities/api';

const AccessModalContent = ({ user, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [email, setEmail] = useState(user?.email || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const current = auth().currentUser;
    const currentEmail = current?.email || user?.email || '';
    setEmail(currentEmail);
    setNewEmail(currentEmail);
  }, [user?.email]);

  const handleChangeEmail = async () => {
    if (!newEmail || !password) return;
    setIsSaving(true);
    try {
      const firebaseAuth = auth();
      // Re-authenticate user
      const credential = auth.EmailAuthProvider.credential(email, password);
      await firebaseAuth.currentUser.reauthenticateWithCredential(credential);
      // Update email
      await firebaseAuth.currentUser.updateEmail(newEmail);
      dispatch(setUser({ ...user, email: newEmail }));
      Alert.alert(t('EMAILCHANGED'));
      setPassword('');
      onClose && onClose();
    } catch (e) {
      Alert.alert(t('ERROR'), e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(t('EMAILSENT'));
      onClose && onClose();
    } catch (e) {
      Alert.alert(t('ERROR'), e.message);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('AREYOUSURE'),
      '',
      [
        { text: t('CANCEL'), style: 'cancel' },
        {
          text: t('YES'),
          style: 'destructive',
          onPress: async () => {
            try {
              const uid = auth().currentUser?.uid || user?.id;
              if (uid) {
                await userApi.deleteUser(uid);
              }
              // Sign out locally after backend deletion
              await auth().signOut();
              dispatch(setUser(null));
              onClose && onClose();
            } catch (e) {
              Alert.alert(t('ERROR'), e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ maxHeight: '80%', paddingBottom: responsiveHeight(4) }}>
      <Labels.ModalLabelWithCross Title={t('ACCESS')} onPress={onClose} />
      <Spacer isBasic />
      <Wrapper marginHorizontalBase>
        <Text isSmall isMediumFont>
          {t('EMAIL')}
        </Text>
        <Spacer isTiny />
        <Text isRegular isTextColor2>
          {email}
        </Text>
      </Wrapper>
      <Spacer isSmall />
      <Wrapper marginHorizontalBase>
        <Text isSmall isMediumFont>
          {t('NEW_EMAIL')}
        </Text>
        <Spacer isTiny />
        <TextInputs.Bordered
          placeholder={t('NEW_EMAIL')}
          value={newEmail}
          onChangeText={setNewEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          containerStyle={{ marginHorizontal: 0 }}
        />
      </Wrapper>
      <Spacer isSmall />
      <Wrapper marginHorizontalBase>
        <Text isSmall isMediumFont>
          {t('PASSWORD')}
        </Text>
        <Spacer isTiny />
        <TextInputs.Bordered
          placeholder={t('PASSWORD')}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          secureTextEntry
          containerStyle={{ marginHorizontal: 0 }}
        />
      </Wrapper>
      <Spacer isBasic />
      <Wrapper marginHorizontalBase>
        <Buttons.Colored
          text={t('CHANGEEMAIL')}
          onPress={handleChangeEmail}
          isLoading={isSaving}
          disabled={isSaving || !newEmail || !password}
        />
      </Wrapper>
      <Spacer isBasic />
      <Wrapper marginHorizontalBase>
        <Buttons.Bordered
          text={t('CHANGEPASSWORD')}
          onPress={handleResetPassword}
        />
      </Wrapper>
      <Spacer isBasic />
      <Wrapper marginHorizontalBase>
        <Text
          style={{ color: 'red', textAlign: 'center', marginTop: 24 }}
          onPress={handleDeleteAccount}
        >
          {t('REMOVEACCOUNT')}
        </Text>
      </Wrapper>
    </View>
  );
};

export default AccessModalContent; 