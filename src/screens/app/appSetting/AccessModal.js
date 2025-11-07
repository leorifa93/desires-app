import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Text, Buttons, TextInputs, Labels, Spacer } from '../../../components';
import { getAuth, sendPasswordResetEmail, updateEmail, signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { setUser } from '../../../store/reducers/auth';

const AccessModalContent = () => {
  const { t } = useTranslation();
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEmail(user?.email || '');
  }, [user?.email]);

  const handleChangeEmail = async () => {
    if (!email) return;
    Alert.prompt(
      t('ENTERPASSWORD'),
      '',
      [
        {
          text: t('CANCEL'),
          style: 'cancel',
        },
        {
          text: t('APPLY'),
          onPress: async (password) => {
            setIsSaving(true);
            try {
              const auth = getAuth();
              const credential = auth.EmailAuthProvider.credential(user.email, password);
              await auth.reauthenticateWithCredential(auth.currentUser, credential);
              await updateEmail(auth.currentUser, email);
              dispatch(setUser({ ...user, email }));
              Alert.alert(t('EMAILCHANGED'));
            } catch (e) {
              Alert.alert(t('ERROR'), e.message);
            } finally {
              setIsSaving(false);
            }
          },
        },
      ],
      'secure-text'
    );
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(getAuth(), user.email);
      Alert.alert(t('EMAILSENT'));
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
              await user.delete();
              dispatch(setUser(null));
              await signOut(getAuth());
            } catch (e) {
              Alert.alert(t('ERROR'), e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ maxHeight: '80%' }}>
      <Labels.ModalLabelWithCross Title={t('ACCESS')} onPress={null} />
      <Spacer isBasic />
      <TextInputs.Basic
        label={t('EMAIL')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Buttons.Primary
        title={t('CHANGEEMAIL')}
        onPress={handleChangeEmail}
        isLoading={isSaving}
        disabled={isSaving || !email}
      />
      <Spacer isBasic />
      <Buttons.Secondary
        title={t('CHANGEPASSWORD')}
        onPress={handleResetPassword}
      />
      <Spacer isBasic />
      <Text
        style={{ color: 'red', textAlign: 'center', marginTop: 24 }}
        onPress={handleDeleteAccount}
      >
        {t('REMOVEACCOUNT')}
      </Text>
    </View>
  );
};

export default AccessModalContent; 