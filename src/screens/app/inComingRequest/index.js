import {TouchableOpacity, FlatList, Alert, ActivityIndicator} from 'react-native';
import React, {useState, useEffect} from 'react';
import {
  Headers,
  Images,
  Lines,
  Spacer,
  Text,
  Wrapper,
} from '../../../components';
import {colors, responsiveWidth} from '../../../services';
import {scale} from 'react-native-size-matters';
import {useSelector} from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {routes} from '../../../services/constants';
// import notificationService from '../../../services/notificationService';

const Index = () => {
  const {t} = useTranslation();
  const me = useSelector(state => state.auth.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me?._privateGalleryRequests || me._privateGalleryRequests.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch users who requested access
    const fetchUsers = async () => {
      try {
        // Firebase 'in' queries have a limit of 10, so we batch if needed
        const userIds = me._privateGalleryRequests.slice(0, 10);
        const usersSnapshot = await firestore()
          .collection('Users')
          .where(firestore.FieldPath.documentId(), 'in', userIds)
          .get();
        
        const fetchedUsers = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching request users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [me?._privateGalleryRequests]);

  const handleAccept = async (userId) => {
    try {
      // Remove from requests, add to access users
      const updatedRequests = (me._privateGalleryRequests || []).filter(id => id !== userId);
      const updatedAccessUsers = [...(me._privateGalleryAccessUsers || []), userId];

      await firestore()
        .collection('Users')
        .doc(me.id)
        .update({
          _privateGalleryRequests: updatedRequests,
          _privateGalleryAccessUsers: updatedAccessUsers,
        });

      // Send notification
      try {
        // Get user data who made the request
        const userDoc = await firestore().collection('Users').doc(userId).get();
        const userData = userDoc.data();
        
        if (userData) {
          // Import notification utilities
          const {calculateBadge, sendPushNotification, getTranslationsForLanguage} = require('../../../services/notificationUtilities');
          
          // Get translations for user's language
          const userLang = userData._settings?.currentLang || 'en';
          const translations = await getTranslationsForLanguage(userLang, ['HASACCEPTEDREQUEST', 'ACCESSTOPRIVATE']);
          
          // Calculate badge
          const badge = await calculateBadge(userData);
          
          // Send notification
          await sendPushNotification(
            userData,
            {
              title: me.username + translations['HASACCEPTEDREQUEST'],
              body: translations['ACCESSTOPRIVATE'],
              badge: badge.toString(),
            },
            'privateGalleryAnswer',
            {
              userId: me.id,
              type: 'PRIVATEGALLERYANSWER',
            }
          );
          
          console.log('Private gallery acceptance notification sent');
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }

      // Update UI
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert(t('ERROR'), t('SOMETHING_WENT_WRONG'));
    }
  };

  const handleDecline = async (userId) => {
    try {
      // Remove from requests
      const updatedRequests = (me._privateGalleryRequests || []).filter(id => id !== userId);

      await firestore()
        .collection('Users')
        .doc(me.id)
        .update({
          _privateGalleryRequests: updatedRequests,
        });

      // Update UI
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error declining request:', error);
      Alert.alert(t('ERROR'), t('SOMETHING_WENT_WRONG'));
    }
  };

  const renderItem = ({item}) => (
    <RequestsRenderComponent 
      user={item}
      onAccept={() => handleAccept(item.id)}
      onDecline={() => handleDecline(item.id)}
    />
  );

  return (
    <Wrapper isMain backgroundColor={colors.appBgColor1}>
      <Headers.Primary showBackArrow title={t('REQUESTS')} />
      <Spacer isSmall />
      {loading ? (
        <Wrapper flex={1} alignItemsCenter justifyContentCenter>
          <ActivityIndicator size="large" color={colors.appPrimaryColor} />
        </Wrapper>
      ) : users.length === 0 ? (
        <Wrapper flex={1} alignItemsCenter justifyContentCenter paddingHorizontalBase>
          <Text isMedium isTextColor2 textAlignCenter>
            {t('NOR')} {t('REQUESTS')}
          </Text>
        </Wrapper>
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{paddingBottom: 20}}
        />
      )}
    </Wrapper>
  );
};

export default Index;

const RequestsRenderComponent = React.memo(({user, onAccept, onDecline}) => {
  const {t} = useTranslation();
  const profileImage = user?.profilePictures?.thumbnails?.small || user?.profilePictures?.small;
  const navigation = useNavigation();
  
  const handleProfilePress = () => {
    // Use push() to create a new screen instance instead of navigate()
    navigation.push(routes.userProfile, {
      userId: user.id,
      visiterProfile: user
    });
  };
  
  return (
    <Wrapper marginHorizontalBase marginVerticalSmall>
      <Wrapper flexDirectionRow justifyContentSpaceBetween alignItemsCenter>
        <TouchableOpacity 
          onPress={handleProfilePress}
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
        >
          <Images.Round 
            source={profileImage ? {uri: profileImage} : require('../../../assets/images/no-image.png')} 
            size={scale(48)} 
          />
          <Wrapper
            marginHorizontalSmall
            style={{flex: 1}}>
            <Text isRegular isBoldFont>
              {user?.username || 'Unknown'}
            </Text>
          </Wrapper>
        </TouchableOpacity>
        <Wrapper flexDirectionRow gap={10}>
          <TouchableOpacity onPress={onAccept}>
            <Text isPrimaryColor isMediumFont isRegular>
              {t('ALLOW')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDecline}>
            <Text isTextColor2 isMediumFont isRegular>
              {t('DECLINE')}
            </Text>
          </TouchableOpacity>
        </Wrapper>
      </Wrapper>
      <Wrapper alignItemsFlexEnd>
        <Lines.Horizontal
          height={0.8}
          width={responsiveWidth(85)}
          color={colors.appBorderColor2}
        />
      </Wrapper>
    </Wrapper>
  );
});

