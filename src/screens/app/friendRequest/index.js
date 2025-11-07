import {FlatList, View} from 'react-native';
import React from 'react';
import {Headers, Spacer, Text, Wrapper} from '../../../components';
import {appStyles, responsiveFontSize, responsiveHeight} from '../../../services';
import {useHooks} from './hooks';
import {useTranslation} from 'react-i18next';

export default function Index() {
  const {t} = useTranslation();
  const {FriendRenderDetail, data, loading, loadFriendRequests} = useHooks();
  
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
            {t('FRIEND_REQUESTS')} <Text isPrimaryColor>({data.length})</Text>
          </Text>
        }
      />
      <FlatList
        data={data}
        ListHeaderComponent={<Spacer isBasic />}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<Spacer isBasic />}
        renderItem={({item, index}) => (
          <FriendRenderDetail key={index} Detail={item} />
        )}
        keyExtractor={(item, index) => item.id || index.toString()}
        refreshing={loading}
        onRefresh={loadFriendRequests}
        ListEmptyComponent={
          <Wrapper isCenter style={{ paddingTop: responsiveHeight(20) }}>
            <Text isRegular isTextColor2>
              {t('NO_FRIEND_REQUESTS') || 'No friend requests'}
            </Text>
          </Wrapper>
        }
      />
    </Wrapper>
  );
}
