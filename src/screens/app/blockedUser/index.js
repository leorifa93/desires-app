import {FlatList, View, ActivityIndicator} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Headers, Spacer, Text, Wrapper} from '../../../components';
import {appStyles, responsiveFontSize, colors} from '../../../services';
import {useHooks} from './hooks';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {getBlockedUsers, unblockUser} from '../../../services/firebaseUtilities/user';
import {useDispatch} from 'react-redux';
import {setUser as setUserAction} from '../../../store/actions/auth';
import {Alert} from 'react-native';

export default function Index() {
  const {FriendRenderDetail} = useHooks();
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadBlockedUsers();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadBlockedUsers = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const users = await getBlockedUsers(user.id);
      setBlockedUsers(users);
    } catch (error) {
      console.error('Error loading blocked users:', error);
      Alert.alert(t('ERROR'), t('ERROR_LOADING_BLOCKED_USERS') || 'Error loading blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockedUser) => {
    Alert.alert(
      t('NOTBLOCKPROFILE') || 'Unblock User',
      t('UNBLOCK_USER_CONFIRM') || `Are you sure you want to unblock ${blockedUser.username}?`,
      [
        {
          text: t('CANCEL'),
          style: 'cancel'
        },
        {
          text: t('UNBLOCK') || 'Unblock',
          onPress: async () => {
            try {
              await unblockUser(user, blockedUser);
              
              // Update local state
              const updatedUser = {
                ...user,
                _blockList: (user._blockList || []).filter(id => id !== blockedUser.id)
              };
              dispatch(setUserAction({user: updatedUser, dataLoaded: true}));
              
              // Remove from list
              setBlockedUsers(prev => prev.filter(u => u.id !== blockedUser.id));
              
              Alert.alert(t('SUCCESS'), t('NOTBLOCKPROFILE') || 'User unblocked');
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert(t('ERROR'), t('SOMETHING_WENT_WRONG'));
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <Wrapper isMain>
        <Headers.Primary
          showBackArrow
          headerTitle={
            <Text
              alignTextCenter
              style={[
                appStyles.headerTitleStyle,
                {
                  fontSize: responsiveFontSize(16),
                },
              ]}>
              {t('BLOCKEDUSER')}
            </Text>
          }
        />
        <Wrapper alignItemsCenter justifyContentCenter style={{flex: 1}}>
          <ActivityIndicator size="large" color={colors.appPrimaryColor} />
        </Wrapper>
      </Wrapper>
    );
  }

  return (
    <Wrapper isMain>
      <Headers.Primary
        showBackArrow
        headerTitle={
          <Text
            alignTextCenter
            style={[
              appStyles.headerTitleStyle,
              {
                fontSize: responsiveFontSize(16),
              },
            ]}>
            {t('BLOCKEDUSER')} <Text isPrimaryColor>({blockedUsers.length})</Text>
          </Text>
        }
      />
      {blockedUsers.length === 0 ? (
        <Wrapper alignItemsCenter justifyContentCenter style={{flex: 1}}>
          <Text isRegular isRegularFont isTextColor2>
            {t('NO_BLOCKED_USERS') || 'No blocked users'}
          </Text>
        </Wrapper>
      ) : (
        <FlatList
          data={blockedUsers}
          ListHeaderComponent={<Spacer isBasic />}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<Spacer isBasic />}
          renderItem={({item, index}) => (
            <FriendRenderDetail 
              key={index} 
              Detail={item} 
              onUnblock={() => handleUnblock(item)}
            />
          )}
        />
      )}
    </Wrapper>
  );
}
