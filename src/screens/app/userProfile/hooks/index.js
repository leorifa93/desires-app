import { useEffect, useMemo, useState } from 'react';
import { navigate } from '../../../../navigation/rootNavigation';
import { getUserDetail, routes } from '../../../../services';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import firestore from '@react-native-firebase/firestore';
import { Alert } from 'react-native';
import { Membership } from '../../../../constants/User';
import { setUser } from '../../../../store/actions/auth';

export const useHooks = (user) => {
  const [EditProfileModal, setEditProfileModal] = useState(false);
  const [AddToFavorite, setAddToFavorite] = useState(false);
  const [AddToFriends, setAddToFriends] = useState(false);
  const me = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Listen to like state between me and user; prefill heart if like exists
  useEffect(() => {
    if (!me?.id || !user?.id) return;

    const likeDocId = `${me.id}_${user.id}`;
    const docRef = firestore().collection('Likes').doc(likeDocId);
    const unsubscribe = docRef.onSnapshot(async (docSnap) => {
      if (docSnap.exists) {
        setAddToFavorite(true);
      } else {
        // Backward compatibility: check for legacy like documents
        try {
          const legacy = await firestore()
            .collection('Likes')
            .where('sentFrom', '==', me.id)
            .where('sentTo', '==', user.id)
            .limit(1)
            .get();
          setAddToFavorite(!legacy.empty);
        } catch {
          setAddToFavorite(false);
        }
      }
    });

    return () => unsubscribe();
  }, [me?.id, user?.id]);

  handleToggleAddToFavorite = async () => {
    if (!me?.id || !user?.id) return;

    const isStandardOrSilver = [Membership.Standard, Membership.Silver].includes(me.membership);
    const likesLeft = Number(me?.likesAvailableCount ?? 0);

    try {
      if (!AddToFavorite) {
        // Add like
        if (isStandardOrSilver && likesLeft === 0) {
          Alert.alert(
            t('NOCOINSANYMORELIKES'),
            '',
            [
              { text: t('CANCEL'), style: 'cancel' },
              { text: t('UPGRADE'), onPress: () => navigate(routes.subscription) },
            ]
          );
          return;
        }

        const likeDocId = `${me.id}_${user.id}`;
        const docRef = firestore().collection('Likes').doc(likeDocId);
        await docRef.set({
          sentFrom: {
            id: me.id,
            username: me.username,
            profilePictures: me.profilePictures || null,
          },
          sentFromId: me.id,
          sentTo: user.id,
          createdAt: firestore.FieldValue.serverTimestamp(),
          seen: false,
        });

        // Decrement likesAvailableCount for Standard/Silver
        if (isStandardOrSilver) {
          const newCount = Math.max(likesLeft - 1, 0);
          await firestore().collection('Users').doc(me.id).update({ likesAvailableCount: newCount });
          // Update redux state
          dispatch(setUser({ user: { ...me, likesAvailableCount: newCount }, dataLoaded: true }));
        }

        setAddToFavorite(true);
      } else {
        // Remove like
        const likeDocId = `${me.id}_${user.id}`;
        const docRef = firestore().collection('Likes').doc(likeDocId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          await docRef.delete();
        } else {
          // Remove legacy like if present
          const legacy = await firestore()
            .collection('Likes')
            .where('sentFrom', '==', me.id)
            .where('sentTo', '==', user.id)
            .limit(1)
            .get();
          if (!legacy.empty) {
            await legacy.docs[0].ref.delete();
          }
        }
        // Note: old app does not refund likes on unlike
        setAddToFavorite(false);
      }
    } catch (error) {
      console.error('toggle favorite failed:', error);
    }
  };
  handleToggleAddToFriends = () => {
    setAddToFriends(!AddToFriends);
  };
  const handleEditProfileModal = () => {
    setEditProfileModal(!EditProfileModal);
  };
  const userAboutData = useMemo(() => {
    if (!user?.details || !me) return [];
    const details = [];
    // Sortierung wie in der alten App
    const keys = [
      'genderLookingFor',
      'ethnicity', 'nationality',
      'chest', 'waist', 'hips',
      'height', 'weight', 'eyeColor',
      'hairColor', 'hairLength'
    ];

    for (let key of keys) {
      if (user.details[key] || user[key]) {
        const value = getUserDetail(key, user, me?._settings, t);
        details.push({
          Label: String(t(key)),
          Value: String(value || ''),
        })
      }
    }

    return details;
  }, [user, me]);

  const userInterestsData = useMemo(() => {
    if (!user?.details || !me) return [];
    const details = [];

    if (user.details.interests) {
      // Group interests by category
      const grouped = user.details.interests.reduce((acc, interest) => {
        // Skip items with undefined or missing category
        if (!interest.category || interest.category === 'undefined') return acc;
        if (!acc[interest.category]) acc[interest.category] = new Set();
        const value = interest[me._settings?.currentLang || 'en'] || interest.en || interest.value;
        acc[interest.category].add(value);
        return acc;
      }, {});

      // Create one entry per category with comma-separated values
      for (const [category, values] of Object.entries(grouped)) {
        details.push({
          Label: String(t(category)),
          Value: String(Array.from(values).join(', ')),
        });
      }
    }

    return details;
  }, [user, me, t]);


  const userLifestyleData = useMemo(() => {
    if (!user?.details || !me) return [];
    const details = [];

    if (user.details.lifestyle) {
      for (const interest of user.details.lifestyle) {
        // Replace undefined category with default for lifestyle
        let category = interest.category;
        if (category === 'undefined' || !category) {
          category = 'Animals';
        }
        const value = interest[me._settings?.currentLang || 'en'];
        if (value) {
          details.push({
            Label: String(t(category)),
            Value: String(value),
          })
        }
      }
    }

    return details;
  }, [user, me, t]);

  const userMoreInfoData = useMemo(() => {
    if (!user?.details || !me) return [];
    const details = [];

    if (user.details.moreinfo) {
      for (const interest of user.details.moreinfo) {
        // Replace undefined category with default for moreinfo
        let category = interest.category;
        if (category === 'undefined' || !category) {
          category = 'Searching';
        }
        const value = interest[me._settings?.currentLang || 'en'];
        if (value) {
          details.push({
            Label: String(t(category)),
            Value: String(value),
          });
        }
      }
    }

    return details;
  }, [user, me, t]);


  const userBrandsData = useMemo(() => {
    if (!user?.details || !me) return [];
    
    if (user.details.brands) {
      // Group brands by category
      const groupedBrands = {};
      
      for (const brand of user.details.brands) {
        const category = brand.category;
        if (!groupedBrands[category]) {
          groupedBrands[category] = [];
        }
        groupedBrands[category].push(brand.value);
      }
      
      // Convert to array format with comma-separated values
      const details = Object.entries(groupedBrands).map(([category, values]) => ({
        Label: String(t(category)),
        Value: String(values.join(', ')),
      }));
      
      return details;
    }

    return [];
  }, [user, me, t]);


  const RequestAndRevokeData = useMemo(
    () => [
      {
        Label: t('REQUESTS'),
        Value: String(me?._privateGalleryRequests?.length || 0),
        isHighlighted: (me?._privateGalleryRequests?.length || 0) > 0, // Highlight if requests exist
        onPress: () => {
          navigate(routes.InComingRequest, { type: 'REQUESTS' });
        },
      },
      {
        Label: t('RELEASES'),
        Value: String(me?._privateGalleryAccessUsers?.length || 0),
        onPress: () => {
          navigate(routes.revoke, { type: 'RELEASES' });
        },
      },
    ],
    [me?._privateGalleryRequests, me?._privateGalleryAccessUsers, navigate, t],
  );

  // Check if current user can see private gallery
  const canSeePrivateGallery = useMemo(() => {
    if (!user || !me) return false;
    
    // Own profile
    if (me.id === user.id) return true;
    
    // Admin
    if (me.isAdmin) return true;
    
    // VIP, Phantom, or Celebrity membership
    if ([Membership.VIP, Membership.Phantom, Membership.Celebrity].includes(me.membership)) return true;
    
    // Explicitly granted access
    if (user._privateGalleryAccessUsers?.includes(me.id)) return true;
    
    return false;
  }, [user, me]);

  // Check if user already requested access
  const hasRequestedAccess = useMemo(() => {
    if (!user || !me) return false;
    return user._privateGalleryRequests?.includes(me.id) || false;
  }, [user?._privateGalleryRequests, me?.id]);

  // This function is now passed from parent component (index.js)
  // const handleSendPrivateGalleryRequest - moved to parent

  // Navigate to subscription page with specific filters
  const handleUpgradeToVip = () => {
    const showMemberships = me.membership === Membership.Silver 
      ? 'phantom,celebrity' 
      : 'vip';
    
    navigate(routes.subscription, {
      showOnlyMemberships: showMemberships
    });
  };

  return {
    userAboutData,
    userInterestsData,
    userLifestyleData,
    userMoreInfoData,
    userBrandsData,
    RequestAndRevokeData,
    EditProfileModal,
    handleEditProfileModal,
    //
    AddToFavorite,
    AddToFriends,
    handleToggleAddToFavorite,
    handleToggleAddToFriends,
    // Private Gallery
    canSeePrivateGallery,
    hasRequestedAccess,
    handleUpgradeToVip,
  };
};
