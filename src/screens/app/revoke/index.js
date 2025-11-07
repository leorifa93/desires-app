import {StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator} from 'react-native';
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

const Index = () => {
  const {t} = useTranslation();
  const me = useSelector(state => state.auth.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me?._privateGalleryAccessUsers || me._privateGalleryAccessUsers.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch users who have access
    const fetchUsers = async () => {
      try {
        // Firebase 'in' queries have a limit of 10, so we batch if needed
        const userIds = me._privateGalleryAccessUsers.slice(0, 10);
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
        console.error('Error fetching access users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [me?._privateGalleryAccessUsers]);

  const handleTakeBack = async (userId) => {
    try {
      // Remove from access users
      const updatedAccessUsers = (me._privateGalleryAccessUsers || []).filter(id => id !== userId);

      await firestore()
        .collection('Users')
        .doc(me.id)
        .update({
          _privateGalleryAccessUsers: updatedAccessUsers,
        });

      // Update UI
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error revoking access:', error);
      Alert.alert(t('ERROR'), t('SOMETHING_WENT_WRONG'));
    }
  };

  const renderItem = ({item}) => (
    <RequestsRenderComponent 
      user={item}
      onTakeBack={() => handleTakeBack(item.id)}
      t={t}
    />
  );

  return (
    <Wrapper isMain backgroundColor={colors.appBgColor1}>
      <Headers.Primary showBackArrow title={t('RELEASES')} />
      <Spacer isSmall />
      {loading ? (
        <Wrapper flex={1} alignItemsCenter justifyContentCenter>
          <ActivityIndicator size="large" color={colors.appPrimaryColor} />
        </Wrapper>
      ) : users.length === 0 ? (
        <Wrapper flex={1} alignItemsCenter justifyContentCenter paddingHorizontalBase>
          <Text isMedium isTextColor2 textAlignCenter>
            {t('NOR')} {t('RELEASES')}
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

const RequestsRenderComponent = React.memo(({user, onTakeBack, t}) => {
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
        <TouchableOpacity onPress={onTakeBack} style={styles.takeBackButton}>
          <Text isSmall isMediumFont style={{color: colors.appPrimaryColor}}>
            {t('TAKEBACK')}
          </Text>
        </TouchableOpacity>
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

const styles = StyleSheet.create({
  takeBackButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.appPrimaryColor,
    marginLeft: 8, // Add margin to prevent cutoff
    flexShrink: 0, // Prevent button from shrinking
  },
});
