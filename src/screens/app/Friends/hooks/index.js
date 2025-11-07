import {scale} from 'react-native-size-matters';
import {
  Icons,
  Images,
  Lines,
  Spacer,
  Text,
  Wrapper,
} from '../../../../components';
import {
  appIcons,
  appImages,
  appStyles,
  colors,
  responsiveHeight,
  responsiveWidth,
  routes,
} from '../../../../services';
import {
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useMemo, useRef, useState} from 'react';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import {navigate} from '../../../../navigation/rootNavigation';
import {useSelector, useDispatch} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriendRequest,
  endFriendship,
  sendFriendRequest
} from '../../../../services/firebaseUtilities/user';
import Svg, { Path } from 'react-native-svg';
import badgeService from '../../../../services/badgeService';

export function useHooks() {
  const {t} = useTranslation();
  const me = useSelector(state => state.auth.user);
  const dispatch = useDispatch();

  const FriendRenderDetail = ({Detail, type = 'friends', onRefresh}) => {
    const [menuIconColor, setMenuIconColor] = useState(colors.appBorderColor1);
    const [isSending, setIsSending] = useState(false);

    const handleAcceptRequest = async () => {
      try {
        setIsSending(true);
        await acceptFriendRequest(Detail, me);
        // Refresh the data after accepting
        Alert.alert(t('SUCCESS'), t('FRIENDREQUEST_ACCEPTED'), [
          {
            text: t('OK'),
            onPress: () => {
              // Refresh the list after accepting
              if (onRefresh) {
                onRefresh();
              }
            }
          }
        ]);
      } catch (error) {
        console.error('Error accepting friend request:', error);
        Alert.alert(t('ERROR'), t('FRIENDREQUEST_ACCEPT_ERROR'));
      } finally {
        setIsSending(false);
      }
    };

    const handleRejectRequest = async () => {
      try {
        setIsSending(true);
        await rejectFriendRequest(Detail, me);
        // Refresh the data after rejecting
        Alert.alert(t('SUCCESS'), t('FRIENDREQUEST_REJECTED'), [
          {
            text: t('OK'),
            onPress: () => {
              // Refresh the list after rejecting
              if (onRefresh) {
                onRefresh();
              }
            }
          }
        ]);
      } catch (error) {
        console.error('Error rejecting friend request:', error);
        Alert.alert(t('ERROR'), t('FRIENDREQUEST_REJECT_ERROR'));
      } finally {
        setIsSending(false);
      }
    };

    const handleRemoveRequest = async () => {
      try {
        setIsSending(true);
        await removeFriendRequest(me, Detail);
        // Refresh the data after removing
        Alert.alert(t('SUCCESS'), t('FRIENDREQUEST_REMOVED'), [
          {
            text: t('OK'),
            onPress: () => {
              // Refresh the list after removing
              if (onRefresh) {
                onRefresh();
              }
            }
          }
        ]);
      } catch (error) {
        console.error('Error removing friend request:', error);
        Alert.alert(t('ERROR'), t('FRIENDREQUEST_REMOVE_ERROR'));
      } finally {
        setIsSending(false);
      }
    };

    const handleEndFriendship = async () => {
      Alert.alert(
        t('CONFIRM'),
        t('END_FRIENDSHIP_CONFIRM'),
        [
          {text: t('CANCEL'), style: 'cancel'},
          {
            text: t('CONFIRM'),
            style: 'destructive',
            onPress: async () => {
              try {
                setIsSending(true);
                await endFriendship(me, Detail);
                
                // Update local Redux store immediately
                const updatedFriendsList = me._friendsList?.filter(id => id !== Detail.id) || [];
                
                // Import setUser from auth actions
                const { setUser } = await import('../../../../store/actions/auth');
                const { serializeFirestoreData } = await import('../../../../utils/serializeFirestoreData');
                
                const updatedUser = {
                  ...me,
                  _friendsList: updatedFriendsList
                };
                
                const serializedUser = serializeFirestoreData(updatedUser);
                dispatch(setUser({
                  user: serializedUser,
                  dataLoaded: true
                }));
                
                // Update app icon badge
                try {
                  badgeService.updateBadge(serializedUser);
                } catch (error) {
                  console.error('Error updating badge:', error);
                }
                
                Alert.alert(t('SUCCESS'), t('FRIENDSHIP_ENDED'), [
                  {
                    text: t('OK'),
                    onPress: () => {
                      // Refresh the list after ending friendship
                      if (onRefresh) {
                        onRefresh();
                      }
                    }
                  }
                ]);
              } catch (error) {
                console.error('Error ending friendship:', error);
                Alert.alert(t('ERROR'), t('END_FRIENDSHIP_ERROR'));
              } finally {
                setIsSending(false);
              }
            }
          }
        ]
      );
    };

    const handleOpenChat = () => {
      // Navigate to private chat with the friend
      navigate(routes.chatScreen, { 
        otherUserId: Detail.id,
        username: Detail.username,
        profilePicture: Detail.profilePictures?.thumbnails?.big || Detail.profilePictures?.original
      });
    };

    const handleShowOptions = () => {
      // Show action sheet with options
      Alert.alert(
        t('OPTIONS'),
        t('CHOOSE_ACTION'),
        [
          {text: t('CANCEL'), style: 'cancel'},
          {
            text: t('SHARE_PROFILE'),
            onPress: () => {
              // TODO: Implement share profile functionality
              console.log('Share profile');
            }
          },
          {
            text: t('BLOCK_USER'),
            style: 'destructive',
            onPress: () => {
              // TODO: Implement block user functionality
              console.log('Block user');
            }
          }
        ]
      );
    };

    const renderActionButtons = () => {
      if (type === 'requests') {
        // Friend request received - show accept/reject buttons
        return (
          <Wrapper flexDirectionRow alignItemsCenter>
            <TouchableOpacity
              onPress={handleAcceptRequest}
              disabled={isSending}
              style={{
                backgroundColor: colors.appPrimaryColor,
                borderRadius: responsiveWidth(20),
                paddingVertical: responsiveWidth(2),
                paddingHorizontal: responsiveWidth(4),
                marginRight: responsiveWidth(2),
                opacity: isSending ? 0.6 : 1,
              }}>
              <Text style={{color: colors.appBgColor1, fontSize: responsiveWidth(3), fontWeight: '600'}}>
                {isSending ? t('ACCEPTING') : t('ACCEPT')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRejectRequest}
              disabled={isSending}
              style={{
                backgroundColor: colors.appTextColor2,
                borderRadius: responsiveWidth(20),
                paddingVertical: responsiveWidth(2),
                paddingHorizontal: responsiveWidth(4),
                opacity: isSending ? 0.6 : 1,
              }}>
              <Text style={{color: colors.appBgColor1, fontSize: responsiveWidth(3), fontWeight: '600'}}>
                {isSending ? t('REJECTING') : t('REJECT')}
              </Text>
            </TouchableOpacity>
          </Wrapper>
        );
      } else if (type === 'friends') {
        // Already friends - no action buttons needed, everything is in the menu
        return null;
      }
      return null;
    };

    const styles = StyleSheet.create({
      BadgeMainContainer: {
        height: scale(8),
        width: scale(8),
        top: scale(5),
        left: scale(39),
        backgroundColor: colors.appBgColor1,
        borderRadius: responsiveWidth(100),
        //padding: scale(1.5),
        //justifyContent: 'center',
        //alignItems: 'center',
      },
      BadgeInnerContainer: {
        flex: 1,
        margin: scale(1.1),
        // alignSelf: 'center',
        //left: scale(0.06),
        backgroundColor: '#13C634',
        borderRadius: responsiveWidth(100),
      },
      OptionMainContainer: {
        //height: responsiveHeight(18),
        minWidth: responsiveWidth(55),
        width: undefined,
        maxWidth: responsiveWidth(80),
        backgroundColor: colors.appBgColor1,
        ...appStyles.shadowDark,
        borderRadius: responsiveWidth(3),
        padding: scale(18),
        //zIndex: 2,
      },
    });
    return (
      <View style={{flex: 1}}>
        <Wrapper
          flexDirectionRow
          marginHorizontalBase
          alignItemsCenter
          style={{minHeight: scale(60)}}>
          <TouchableOpacity
            onPress={() => {
              console.log('Navigating to friend profile:', Detail.id);
              navigate(routes.userProfile, { userId: Detail.id, visiterProfile: true });
            }}
            style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
            {/* Image */}
            <Wrapper>
              <Images.Round 
                source={{
                  uri: Detail?.profilePictures?.original || 
                       Detail?.profilePictures?.thumbnails?.big || 
                       Detail?.profilePictures?.thumbnails?.medium || 
                       Detail?.profilePictures?.thumbnails?.small || 
                       appImages.image4
                }} 
                size={scale(48)} 
              />
              {/* Badge for online status */}
              {Detail?.ShowOnline ? (
                <Wrapper isAbsolute style={styles.BadgeMainContainer}>
                  <Wrapper style={styles.BadgeInnerContainer} />
                </Wrapper>
              ) : null}
            </Wrapper>
          
            {/* Text Name (removed age per request) */}
            <Wrapper
              marginHorizontalSmall
              style={{flex: 1, justifyContent: 'center'}}>
              <Text isRegular isBoldFont numberOfLines={1}>
                {Detail?.username || Detail?.name || 'Unknown'}
              </Text>
              <Text isSmall isRegularFont isTextColor2 numberOfLines={1}>
                {Detail?.currentLocation?.city || Detail?.location?.city || 'Unbekannter Ort'}
              </Text>
            </Wrapper>

            {/* Action Buttons for different types */}
            <Wrapper style={{alignItems: 'flex-end'}}>
              {renderActionButtons()}
            </Wrapper>
          </TouchableOpacity>

          {/* Options Menu - only show for friends, not for friend requests */}
          {type === 'friends' && (
            <Menu
              onOpen={() => {
                setMenuIconColor(colors.appBGColor);
              }}
              onClose={() => {
                setMenuIconColor(colors.appBorderColor1);
              }}>
              <MenuTrigger>
                <Icons.Custom
                  icon={appIcons.Menu}
                  color={menuIconColor}
                  size={scale(17)}
                />
              </MenuTrigger>
              <MenuOptions
                optionsContainerStyle={[
                  styles.OptionMainContainer,
                  {marginTop: scale(22), marginLeft: -scale(6)},
                ]}>
                <MenuOption
                  onSelect={handleOpenChat}
                  customStyles={{
                    optionWrapper: {
                      paddingVertical: scale(8),
                    },
                  }}>
                  <Text isSmall isRegularFont>
                    {t('OPEN_CHAT')}
                  </Text>
                </MenuOption>
                <MenuOption
                  onSelect={() => {
                    // TODO: Implement share profile functionality
                    console.log('Share profile');
                  }}
                  customStyles={{
                    optionWrapper: {
                      paddingVertical: scale(8),
                    },
                  }}>
                  <Text isSmall isRegularFont>
                    {t('SHARE_PROFILE')}
                  </Text>
                </MenuOption>
                <MenuOption
                  onSelect={handleEndFriendship}
                  customStyles={{
                    optionWrapper: {
                      paddingVertical: scale(8),
                    },
                  }}>
                  <Text isSmall isRegularFont isPrimaryColor>
                    {t('END_FRIENDSHIP')}
                  </Text>
                </MenuOption>
                <MenuOption
                  onSelect={() => {
                    // TODO: Implement block user functionality
                    console.log('Block user');
                  }}
                  customStyles={{
                    optionWrapper: {
                      paddingVertical: scale(8),
                    },
                  }}>
                  <Text isSmall isRegularFont isPrimaryColor>
                    {t('BLOCK_USER')}
                  </Text>
                </MenuOption>
              </MenuOptions>
            </Menu>
          )}
        </Wrapper>
        
        {/* Bottom Line */}
        <Wrapper marginHorizontalBase alignItemsFlexEnd>
          <Lines.Horizontal
            height={1}
            width={responsiveWidth(73)}
            color={colors.appBorderColor2}
          />
        </Wrapper>
      </View>
    );
  };

  const data = useMemo(() => [
    {
      name: 'Jaydon Lubin',
      age: 48,
      location: 'Miami, FL',
      distance: 12,
      ShowOnline: true,
    },
    {
      name: 'Ann Stanton',
      age: 29,
      location: 'Miami Beach, FL',
      distance: 8,
      ShowOnline: true,
    },
    {name: 'Mira Lubin', age: 24, location: 'Chicago, USA', distance: 2},
    {name: 'Anika Kenter', age: 28, location: '5 Depot Drive, FL', distance: 7},
    {
      name: 'Kierra Rhiel Madsen',
      age: 49,
      location: '7278 Grandrose, FL',
      distance: 4,
      ShowOnline: true,
    },
    {
      name: 'Kianna Stanton',
      age: 27,
      location: '831 St Louis, FL',
      distance: 9,
    },
  ]);

  return {FriendRenderDetail, data};
}
