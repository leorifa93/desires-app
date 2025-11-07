import React, {useState} from 'react';
import {Alert, ScrollView, TouchableOpacity, TextInput} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import firestore from '@react-native-firebase/firestore';
import {colors} from '../../../../../services/utilities/colors';
import {responsiveHeight, responsiveWidth} from '../../../../../services/utilities/responsive';
import {Wrapper, Text, StatusBars, Headers, DropDowns} from '../../../../../components';
import {Spacer} from '../../../../../components';

export default function EditUserProfile({route, navigation}) {
  const {t} = useTranslation();
  const {user} = route.params;
  const [editedUser, setEditedUser] = useState({...user});
  const [loading, setLoading] = useState(false);

  // Gender options (like in old project)
  const genders = [
    {key: 1, value: 'MALE'},
    {key: 2, value: 'FEMALE'},
    {key: 3, value: 'TRANSSEXUAL'}
  ];

  // Membership options (like in old project)
  const memberships = [
    {key: 0, value: 'Standard'},
    {key: 1, value: 'Gold'},
    {key: 2, value: 'VIP'},
    {key: 3, value: 'Stealth'}
  ];

  const updateUserField = (field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveUser = async () => {
    try {
      setLoading(true);
      
      // Remove doc property (like in old project)
      const userToSave = {...editedUser};
      delete userToSave.doc;
      
      // Update user in Firestore
      await firestore().collection('Users').doc(user.id).update(userToSave);
      
      Alert.alert('Erfolg', 'Benutzer wurde erfolgreich aktualisiert');
      navigation.goBack();
      
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Fehler', 'Benutzer konnte nicht gespeichert werden');
    } finally {
      setLoading(false);
    }
  };

  const showLocations = async () => {
    try {
      // Simple location picker (like in all-users page)
      Alert.prompt(
        'Standort auswählen',
        'Geben Sie eine Stadt ein:',
        [
          {
            text: 'Abbrechen',
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: (cityName) => {
              if (cityName && cityName.trim()) {
                // Simulate location data like in old project
                const mockLocation = {
                  location: cityName.trim(),
                  placeId: `mock_${Date.now()}`,
                  lat: 52.5200, // Default Berlin coordinates
                  lng: 13.4050,
                };
                
                // Generate random location within 2km radius (like old project)
                const randomLat = mockLocation.lat + (Math.random() - 0.5) * 0.02; // ~2km
                const randomLng = mockLocation.lng + (Math.random() - 0.5) * 0.02;
                
                // Simple geohash calculation (in real app, use geofire-common)
                const hash = `${randomLat.toFixed(4)}_${randomLng.toFixed(4)}`;
                
                const newLocation = {
                  location: mockLocation.location,
                  placeId: mockLocation.placeId,
                };

                const newCurrentLocation = {
                  lat: randomLat,
                  lng: randomLng,
                  hash: hash,
                  city: `${mockLocation.location}, Deutschland`,
                };

                setEditedUser(prev => ({
                  ...prev,
                  location: newLocation,
                  currentLocation: newCurrentLocation,
                }));
                
                console.log('Location updated:', {
                  location: newLocation,
                  currentLocation: newCurrentLocation,
                });
              }
            },
          },
        ],
        'plain-text',
        editedUser.location?.location || ''
      );
    } catch (error) {
      console.error('Error showing locations:', error);
      Alert.alert('Fehler', 'Standort konnte nicht ausgewählt werden');
    }
  };

  const getGenderText = (genderKey) => {
    const gender = genders.find(g => g.key === genderKey);
    return gender ? t(gender.value) : 'Unbekannt';
  };

  const getMembershipText = (membershipKey) => {
    const membership = memberships.find(m => m.key === membershipKey);
    return membership ? membership.value : 'Standard';
  };

  return (
    <Wrapper isMain>
      <StatusBars.Dark />
      <Headers.Primary
        showBackArrow
        title={t('EDIT')}
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Wrapper marginHorizontalBase>
          <Spacer isBasic />
          
          {/* Available Coins */}
          <Wrapper style={{marginBottom: responsiveHeight(2)}}>
            <Text isBoldFont style={{fontSize: 14, marginBottom: responsiveHeight(1)}}>
              Verfügbare Coins
            </Text>
            <TextInput
              value={editedUser.availableCoins?.toString() || '0'}
              onChangeText={(value) => updateUserField('availableCoins', parseInt(value) || 0)}
              style={{
                backgroundColor: colors.appBgColor1,
                paddingHorizontal: responsiveWidth(3),
                paddingVertical: responsiveHeight(2),
                borderRadius: responsiveWidth(2),
                fontSize: 16,
                color: colors.appTextColor1,
                borderWidth: 1,
                borderColor: colors.appTextColor2,
              }}
              keyboardType="numeric"
              placeholder="0"
            />
          </Wrapper>

          {/* Available Call Minutes */}
          <Wrapper style={{marginBottom: responsiveHeight(2)}}>
            <Text isBoldFont style={{fontSize: 14, marginBottom: responsiveHeight(1)}}>
              Verfügbare Freiminuten
            </Text>
            <TextInput
              value={editedUser.availableCallMinutes?.toString() || '0'}
              onChangeText={(value) => updateUserField('availableCallMinutes', parseInt(value) || 0)}
              style={{
                backgroundColor: colors.appBgColor1,
                paddingHorizontal: responsiveWidth(3),
                paddingVertical: responsiveHeight(2),
                borderRadius: responsiveWidth(2),
                fontSize: 16,
                color: colors.appTextColor1,
                borderWidth: 1,
                borderColor: colors.appTextColor2,
              }}
              keyboardType="numeric"
              placeholder="0"
            />
          </Wrapper>

          {/* Gender */}
          <Wrapper style={{marginBottom: responsiveHeight(2)}}>
            <Text isBoldFont style={{fontSize: 14, marginBottom: responsiveHeight(1)}}>
              {t('GENDER')}
            </Text>
            <DropDowns.Simple
              DropdownData={genders.map(g => ({
                label: t(g.value),
                value: g.key
              }))}
              selectedValue={editedUser.gender}
              onValueChange={(value) => updateUserField('gender', value)}
              placeholder={t('PLEASECHOOSE')}
            />
          </Wrapper>

          {/* Membership */}
          <Wrapper style={{marginBottom: responsiveHeight(2)}}>
            <Text isBoldFont style={{fontSize: 14, marginBottom: responsiveHeight(1)}}>
              {t('MEMBERSHIP')}
            </Text>
            <DropDowns.Simple
              DropdownData={memberships.map(m => ({
                label: m.value,
                value: m.key
              }))}
              selectedValue={editedUser.membership}
              onValueChange={(value) => updateUserField('membership', value)}
              placeholder={t('PLEASECHOOSE')}
            />
          </Wrapper>

          {/* Likes Count */}
          <Wrapper style={{marginBottom: responsiveHeight(2)}}>
            <Text isBoldFont style={{fontSize: 14, marginBottom: responsiveHeight(1)}}>
              Gefällt mir - Anzahl
            </Text>
            <TextInput
              value={editedUser.likesCount?.toString() || '0'}
              onChangeText={(value) => updateUserField('likesCount', parseInt(value) || 0)}
              style={{
                backgroundColor: colors.appBgColor1,
                paddingHorizontal: responsiveWidth(3),
                paddingVertical: responsiveHeight(2),
                borderRadius: responsiveWidth(2),
                fontSize: 16,
                color: colors.appTextColor1,
                borderWidth: 1,
                borderColor: colors.appTextColor2,
              }}
              keyboardType="numeric"
              placeholder="0"
            />
          </Wrapper>

          {/* Admin */}
          <Wrapper style={{marginBottom: responsiveHeight(2)}}>
            <Text isBoldFont style={{fontSize: 14, marginBottom: responsiveHeight(1)}}>
              Admin
            </Text>
            <TouchableOpacity
              onPress={() => updateUserField('isAdmin', !editedUser.isAdmin)}
              style={{
                backgroundColor: editedUser.isAdmin ? colors.appPrimaryColor : colors.appBgColor1,
                paddingHorizontal: responsiveWidth(3),
                paddingVertical: responsiveHeight(2),
                borderRadius: responsiveWidth(2),
                borderWidth: 1,
                borderColor: colors.appTextColor2,
                alignItems: 'center',
              }}>
              <Text style={{
                color: editedUser.isAdmin ? '#ffffff' : colors.appTextColor1,
                fontSize: 16,
                fontWeight: 'bold'
              }}>
                {editedUser.isAdmin ? 'Ja' : 'Nein'}
              </Text>
            </TouchableOpacity>
          </Wrapper>

          {/* Location */}
          <Wrapper style={{marginBottom: responsiveHeight(2)}}>
            <Text isBoldFont style={{fontSize: 14, marginBottom: responsiveHeight(1)}}>
              {t('LOCATION')}
            </Text>
            <TouchableOpacity
              onPress={showLocations}
              style={{
                backgroundColor: colors.appBgColor1,
                paddingHorizontal: responsiveWidth(3),
                paddingVertical: responsiveHeight(2),
                borderRadius: responsiveWidth(2),
                borderWidth: 1,
                borderColor: colors.appTextColor2,
                minHeight: responsiveHeight(6),
                justifyContent: 'center',
              }}>
              <Text style={{
                color: colors.appTextColor1,
                fontSize: 16,
              }}>
                {editedUser.location?.location || t('SELECT_LOCATION')}
              </Text>
            </TouchableOpacity>
          </Wrapper>

          {/* Save Button */}
          <TouchableOpacity
            onPress={saveUser}
            disabled={loading}
            style={{
              backgroundColor: colors.appPrimaryColor,
              paddingHorizontal: responsiveWidth(4),
              paddingVertical: responsiveHeight(3),
              borderRadius: responsiveWidth(2),
              marginTop: responsiveHeight(3),
              alignItems: 'center',
              opacity: loading ? 0.6 : 1,
            }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 18,
              fontWeight: 'bold'
            }}>
              {loading ? t('LOADING') : t('SAVE')}
            </Text>
          </TouchableOpacity>
        </Wrapper>
      </ScrollView>
    </Wrapper>
  );
} 