import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, TouchableOpacity, View } from 'react-native';
import { Headers, Spacer, Text, Wrapper } from '../../../../components';
import { colors, responsiveHeight, responsiveWidth, routes } from '../../../../services';
import { useSelector } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import { navigate, goBack } from '../../../../navigation/rootNavigation';

export default function DexxireChats() {
  const me = useSelector(state => state.auth.user);
  const [demoUsers, setDemoUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const unsubRefs = useRef({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChats, setSelectedChats] = useState([]);
  const selectedUnsubRef = useRef(null);

  const fetchStaticIds = useCallback(async () => {
    try {
      // Try single config document with array: Config/DexxireUserIds { ids: [...] }
      const cfg = await firestore().collection('Config').doc('DexxireUserIds').get();
      const data = cfg.data();
      if (data && Array.isArray(data.ids) && data.ids.length > 0) return data.ids;
    } catch {}
    try {
      // Try collection DexxireUsers with docs representing users
      const snap = await firestore().collection('DexxireUsers').limit(500).get();
      if (!snap.empty) return snap.docs.map(d => d.id);
    } catch {}
    try {
      // Fallback to local config file committed from web list
      const local = require('../../../../configs/dexxireUserIds.json');
      if (Array.isArray(local) && local.length > 0) return local;
    } catch {}
    // Fallback to empty (caller will handle)
    return [];
  }, []);

  const computeMatchedBadges = useCallback((user, currentUser) => {
    try {
      if (!user?.details || !currentUser?.details) return [];
      const getLocalized = (item) => item?.[currentUser?._settings?.currentLang] || item?.en || item?.value || item?.category;
      const matches = [];
      const sections = ['interests', 'lifestyle', 'moreinfo'];
      sections.forEach(section => {
        const a = user.details?.[section] || [];
        const b = currentUser.details?.[section] || [];
        a.forEach(it => {
          const valueA = getLocalized(it);
          if (!valueA) return;
          const has = b.some(mi => getLocalized(mi) === valueA);
          if (has) matches.push(valueA);
        });
      });
      // brands special-case
      const brandsA = user.details?.brands || [];
      const brandsB = currentUser.details?.brands || [];
      brandsA.forEach(br => {
        const valA = br?.value || br?.category;
        if (!valA) return;
        const has = brandsB.some(mb => (mb?.value || mb?.category) === valA);
        if (has) matches.push(valA);
      });
      const unique = Array.from(new Set(matches));
      return unique.slice(0, 2);
    } catch {
      return [];
    }
  }, []);

  const openUser = useCallback((user) => {
    console.log('Opening user:', user?.username, user?.id);
    setSelectedUser(user);
    setSelectedChats([]);
    // Cleanup previous chat snapshot
    if (selectedUnsubRef.current) {
      try { selectedUnsubRef.current(); } catch {}
      selectedUnsubRef.current = null;
    }
    // Attach snapshot for this user's chats (no orderBy to avoid index); sort client-side - use Chats collection
    selectedUnsubRef.current = firestore()
      .collection('Chats')
      .where('memberIds', 'array-contains', user.id)
      .limit(100)
      .onSnapshot((snapshot) => {
        const chats = (snapshot?.docs || []).map(d => ({ id: d.id, ...d.data() }));
        console.log(`Found ${chats.length} chats for user ${user.username}`);
        // Sort newest partner message first (exclude my own lastMessageFrom)
        const sorted = chats
          .filter(c => true)
          .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
        setSelectedChats(sorted);
      }, (error) => {
        console.warn('Selected user chats snapshot error', error?.message || error);
      });
  }, []);

  const getOtherProfile = useCallback((chat, baseUserId) => {
    const profiles = chat?.profiles || [];
    if (profiles && profiles.length > 0) {
      if (baseUserId) {
        const found = profiles.find(p => p?.id && p.id !== baseUserId);
        if (found) return found;
      }
      // fallback to exclude me if present
      return profiles.find(p => p?.id && p.id !== me?.id) || profiles[0] || null;
    }
    // If profiles missing, fallback to memberIds
    const memberIds = chat?.memberIds || [];
    if (Array.isArray(memberIds) && memberIds.length > 0) {
      const otherId = memberIds.find(id => id && id !== (baseUserId || me?.id));
      if (otherId) return { id: otherId };
    }
    return null;
  }, [me?.id]);

  const goToChat = useCallback((chat) => {
    const other = getOtherProfile(chat, selectedUser?.id);
    // Open existing chat between the two demo users; also pass otherUserId so header resolves name
    navigate(routes.chatScreen, { chatId: chat.id, otherUserId: other?.id });
  }, [getOtherProfile, selectedUser?.id]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const ids = await fetchStaticIds();
      console.log('Fetched static IDs:', ids.length);
      let users = [];
      if (ids.length > 0) {
        // Batch in chunks of 20 for where-in (like web)
        for (let i = 0; i < ids.length; i += 20) {
          const chunk = ids.slice(i, i + 20).map(String);
          console.log(`Loading batch ${Math.floor(i/20) + 1}: ${chunk.length} IDs`);
          const q = await firestore()
            .collection('Users')
            .where('id', 'in', chunk)
            .get();
          console.log(`Batch ${Math.floor(i/20) + 1} found: ${q?.docs?.length || 0} users`);
          (q?.docs || []).forEach(doc => users.push({ id: doc.id, ...doc.data(), _openChats: 0, _lastMessageAt: 0 }));
        }
      } else {
        console.log('No static IDs, using fallback query');
        // Fallback: Top users
        const snap = await firestore()
          .collection('Users')
          .where('status', '==', 1)
          .limit(100)
          .get();
        users = (snap?.docs || []).map(d => ({ id: d.id, ...d.data(), _openChats: 0, _lastMessageAt: 0 }));
        // Client-side sort to avoid composite index
        users.sort((a, b) => {
          const membershipA = a.membership || 0;
          const membershipB = b.membership || 0;
          if (membershipB !== membershipA) return membershipB - membershipA;
          const boostA = a.lastBoostAt || 0;
          const boostB = b.lastBoostAt || 0;
          return boostB - boostA;
        });
      }
      console.log('Total users loaded:', users.length);
      setDemoUsers(users);
      // Calculate chats for all users in one batch instead of individual listeners
      await calculateOpenChatsForUsers(users);
    } finally {
      setLoading(false);
    }
  }, [fetchStaticIds]);

  const calculateOpenChatsForUsers = useCallback(async (users) => {
    console.log('Berechne offene Chats für alle User mit Snapshots...');
    
    for (const user of users) {
      try {
        // Use snapshot for automatic updates like in web version - use Chats collection
        const unsub = firestore()
          .collection('Chats')
          .where('memberIds', 'array-contains', user.id)
          .limit(100)
          .onSnapshot((snapshot) => {
            const chats = [];
            const docs = snapshot?.docs || [];
            docs.forEach(doc => chats.push({ id: doc.id, ...doc.data() }));

            // Unread relative to me (admin), like in web
            const unreadCount = chats.filter(chat => !(chat.seen || []).includes(me?.id)).length;
            const userMessages = chats.filter(chat => chat.lastMessageFrom !== me?.id);
            // Client-side latest timestamp since server order removed
            const latest = userMessages.length > 0 ? Math.max(...userMessages.map(c => c.lastMessageAt || 0)) : 0;

            setDemoUsers(prev => {
              const next = prev.map(u => u.id === user.id ? { ...u, _openChats: unreadCount, _lastMessageAt: latest } : u);
              // sort by newest message desc
              next.sort((a, b) => (b._lastMessageAt || 0) - (a._lastMessageAt || 0));
              return next;
            });
          }, (error) => {
            console.warn('Chats onSnapshot error for user', user.id, error?.message || error);
          });
        unsubRefs.current[user.id] = unsub;
        console.log(`Snapshot für User ${user.username} aktiviert`);
      } catch (error) {
        console.warn(`Fehler beim Berechnen der Chats für User ${user.username}:`, error);
        setDemoUsers(prev => prev.map(u => u.id === user.id ? { ...u, _openChats: 0 } : u));
      }
    }
  }, [me?.id]);

  useEffect(() => {
    loadUsers();
    return () => {
      Object.values(unsubRefs.current).forEach(un => {
        try { un && un(); } catch {}
      });
      unsubRefs.current = {};
    };
  }, [loadUsers]);

  const renderItem = ({ item }) => {
    const photo = item?.profilePictures?.thumbnails?.big || item?.profilePictures?.thumbnails?.small || item?.profilePictures?.main || item?.profilePictures?.url;
    const badges = computeMatchedBadges(item, me);
    return (
      <TouchableOpacity
        style={{
          paddingVertical: responsiveHeight(1.5),
          paddingHorizontal: responsiveWidth(4),
          borderBottomWidth: 1,
          borderBottomColor: colors.appBorderColor2,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onPress={() => {
          console.log('User item pressed:', item?.username, item?.id);
          openUser(item);
        }}
      >
        <Wrapper flexDirectionRow alignItemsCenter>
          <Image
            source={photo ? { uri: photo } : undefined}
            style={{
              height: responsiveWidth(12),
              width: responsiveWidth(12),
              borderRadius: responsiveWidth(6),
              backgroundColor: colors.appBorderColor2,
              marginRight: responsiveWidth(3)
            }}
          />
          <Wrapper>
            <Text isMedium>{item.username}</Text>
            <Spacer isSmall />
            <Wrapper flexDirectionRow>
              {badges.map((b, idx) => (
                <Wrapper key={idx} paddingHorizontalSmall paddingVerticalTiny style={{ backgroundColor: colors.appBgColor1, borderRadius: responsiveWidth(2), marginRight: responsiveWidth(1.5) }}>
                  <Text isTiny>{b}</Text>
                </Wrapper>
              ))}
            </Wrapper>
          </Wrapper>
        </Wrapper>
        <Wrapper alignItemsEnd>
          <Text style={{ color: colors.appPrimaryColor, marginBottom: responsiveWidth(1) }}>{item._openChats || 0} open</Text>
          <Text isSmall style={{ color: colors.appTextColor2 }}>{item._lastMessageAt ? new Date(item._lastMessageAt).toLocaleString() : ''}</Text>
        </Wrapper>
      </TouchableOpacity>
    );
  };

  const renderChatItem = ({ item }) => {
    const other = getOtherProfile(item, selectedUser?.id);
    const unread = !(item?.seen || []).includes(me?.id);
    const lastTime = item?.lastMessageAt ? new Date(item.lastMessageAt).toLocaleString() : '';
    const avatar = other?.profilePictures?.thumbnails?.small || other?.profilePictures?.main || other?.profilePictures?.url;
    return (
      <TouchableOpacity
        style={{
          paddingVertical: responsiveHeight(1.5),
          paddingHorizontal: responsiveWidth(4),
          borderBottomWidth: 1,
          borderBottomColor: colors.appBorderColor2,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onPress={() => goToChat(item)}
      >
        <Wrapper flexDirectionRow alignItemsCenter>
          <Image
            source={avatar ? { uri: avatar } : undefined}
            style={{
              height: responsiveWidth(10),
              width: responsiveWidth(10),
              borderRadius: responsiveWidth(5),
              backgroundColor: colors.appBorderColor2,
              marginRight: responsiveWidth(3)
            }}
          />
          <Wrapper>
            <Text isMedium>{other?.username || 'Chat'}</Text>
            <Spacer isSmall />
            <Text isSmall style={{ color: colors.appTextColor2 }} numberOfLines={1}>
              {item?.lastMessageText || ''}
            </Text>
          </Wrapper>
        </Wrapper>
        <Wrapper alignItemsEnd>
          {unread ? (
            <Wrapper paddingHorizontalSmall paddingVerticalTiny style={{ backgroundColor: colors.appPrimaryColor, borderRadius: responsiveWidth(2), marginBottom: responsiveWidth(1) }}>
              <Text isTiny isWhite>1</Text>
            </Wrapper>
          ) : null}
          <Text isSmall style={{ color: colors.appTextColor2 }}>{lastTime}</Text>
        </Wrapper>
      </TouchableOpacity>
    );
  };

  return (
    <Wrapper isMain>
      <Headers.Primary showBackArrow title={selectedUser ? selectedUser.username : 'Dexxire Chats'} onBackPress={() => {
        if (selectedUser) {
          setSelectedUser(null);
          setSelectedChats([]);
          if (selectedUnsubRef.current) { try { selectedUnsubRef.current(); } catch {} selectedUnsubRef.current = null; }
        } else {
          goBack();
        }
      }} />
      {loading ? (
        <Wrapper isCenter flex={1}><Text>Loading...</Text></Wrapper>
      ) : selectedUser ? (
        <FlatList
          data={selectedChats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
        />
      ) : (
        <FlatList
          data={demoUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
    </Wrapper>
  );
}


