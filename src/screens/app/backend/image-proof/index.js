import React, {useState, useEffect} from 'react';
import {
  Headers,
  Spacer,
  StatusBars,
  Text,
  Wrapper,
  Images,
} from '../../../../components';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {Alert, ScrollView, TouchableOpacity, View, Image, StyleSheet, Dimensions, Platform, Modal} from 'react-native';
import {responsiveWidth, responsiveHeight, colors, fontSizes} from '../../../../services';
import {scale} from 'react-native-size-matters';
import firestore from '@react-native-firebase/firestore';
import {navigate} from '../../../../navigation/rootNavigation';
import {getUser} from '../../../../services/firebaseUtilities/user';
import {routes} from '../../../../services/constants';
const {width, height} = Dimensions.get('window');

const isTablet = () => {
  const aspectRatio = height / width;
  return (
    (Platform.OS === 'ios' && Platform.isPad) ||
    (Platform.OS === 'android' && width >= 600) ||
    (aspectRatio < 1.6 && width >= 600)
  );
};

export default function BackendImageProof() {
  const {t} = useTranslation();
  const user = useSelector(state => state.auth.user);
  
  const [provements, setProvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const snapshot = await firestore().collection('ImageProofQueue')
        .orderBy('uploadAt', 'desc')
        .limit(10)
        .get();
      
      const provementsData = [];
      
      for (const doc of snapshot.docs) {
        const provement = {id: doc.id, ...doc.data()};
        
        try {
          const userData = await getUser(provement.userId);
          provement.user = userData;
          
          const verificationDoc = await firestore().collection('VerificationQueue').doc(provement.userId).get();
          if (verificationDoc.exists) {
            provement.verificationData = verificationDoc.data();
          }
        } catch (error) {
          provement.user = null;
        }
        
        provementsData.push(provement);
      }
      
      setProvements(provementsData);
    } catch (error) {
      console.error('Error loading image proof data:', error);
      Alert.alert(t('ERROR'), 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const showImg = (imageUrl) => {
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setImageModalVisible(true);
    }
  };

  const remove = async (index, userData, isPublic = true) => {
    try {
      if (isPublic) {
        const updatedPublicAlbum = userData.publicAlbum.filter((picture, i) => i !== index);
        await firestore().collection('Users').doc(userData.id).update({publicAlbum: updatedPublicAlbum});
        userData.publicAlbum = updatedPublicAlbum;
      } else {
        const updatedPrivateAlbum = userData.privateAlbum.filter((picture, i) => i !== index);
        await firestore().collection('Users').doc(userData.id).update({privateAlbum: updatedPrivateAlbum});
        userData.privateAlbum = updatedPrivateAlbum;
      }
      
      await checkAllProvements(userData);
      loadData();
    } catch (error) {
      Alert.alert(t('ERROR'), 'Fehler');
    }
  };

  const removeProof = async (userId) => {
    await firestore().collection('ImageProofQueue').doc(userId).delete();
    loadData();
  };

  const checkAllProvements = async (userData) => {
    if (!userData.profilePictures?.approved) return false;
    if (userData.publicAlbum?.some(pic => !pic.approved)) return false;
    if (userData.privateAlbum?.some(pic => !pic.approved)) return false;
    await removeProof(userData.id);
    return true;
  };

  const setAllProved = async (userData) => {
    try {
      const userDoc = await firestore().collection('Users').doc(userData.id).get();
      if (!userDoc.exists) return;
      
      const currentUserData = userDoc.data();
      const updates = {};
      
      if (currentUserData.profilePictures) {
        updates['profilePictures.approved'] = true;
      }
      if (currentUserData.publicAlbum?.length > 0) {
        updates['publicAlbum'] = currentUserData.publicAlbum.map(pic => ({...pic, approved: true}));
      }
      if (currentUserData.privateAlbum?.length > 0) {
        updates['privateAlbum'] = currentUserData.privateAlbum.map(pic => ({...pic, approved: true}));
      }

      await firestore().collection('Users').doc(userData.id).update(updates);
      await removeProof(userData.id);
      
      Alert.alert(t('SUCCESS'), 'Alle Bilder freigegeben');
      loadData();
    } catch (error) {
      Alert.alert(t('ERROR'), 'Fehler');
    }
  };

  const showProfile = (userData) => {
    navigate(routes.userProfile, {visiterProfile: true, userId: userData.id});
  };

  const showChat = (userData) => {
    navigate(routes.chatScreen, {otherUserId: userData.id});
  };

  const toggleEnable = async (userData) => {
    try {
      if (userData.status === 1) {
        await firestore().collection('Users').doc(userData.id).update({status: 4});
        await removeProof(userData.id);
        Alert.alert(t('SUCCESS'), 'User deaktiviert');
      } else {
        await firestore().collection('Users').doc(userData.id).update({status: 1});
        Alert.alert(t('SUCCESS'), 'User aktiviert');
      }
      loadData();
    } catch (error) {
      Alert.alert(t('ERROR'), 'Fehler');
    }
  };

  const deleteUser = (userData) => {
    Alert.alert(
      'User löschen',
      `${userData.username} wirklich löschen?`,
      [
        {text: 'Abbrechen', style: 'cancel'},
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('Users').doc(userData.id).delete();
              await removeProof(userData.id);
              Alert.alert(t('SUCCESS'), 'User gelöscht');
              loadData();
            } catch (error) {
              Alert.alert(t('ERROR'), 'Fehler');
            }
          }
        }
      ]
    );
  };

  const acceptVerification = async (userData) => {
    try {
      const verificationDoc = await firestore().collection('VerificationQueue').doc(userData.id).get();
      if (!verificationDoc.exists) return;

      const verificationData = verificationDoc.data();
      
      await firestore().collection('Users').doc(userData.id).update({
        isVerified: true,
        verifiedImg: verificationData.pictures,
        verificationChoiceMade: true
      });

      await firestore().collection('VerificationQueue').doc(userData.id).delete();
      Alert.alert(t('SUCCESS'), 'Verifizierung akzeptiert');
      loadData();
    } catch (error) {
      Alert.alert(t('ERROR'), 'Fehler');
    }
  };

  const declineVerification = async (userData) => {
    try {
      await firestore().collection('Users').doc(userData.id).update({
        verificationChoiceMade: firestore.FieldValue.delete(),
        verifiedImg: firestore.FieldValue.delete()
      });

      await firestore().collection('VerificationQueue').doc(userData.id).delete();
      await removeProof(userData.id);
      
      Alert.alert(t('SUCCESS'), 'Verifizierung abgelehnt');
      loadData();
    } catch (error) {
      Alert.alert(t('ERROR'), 'Fehler');
    }
  };

  const getMembershipLabel = (membership) => {
    const labels = {1: 'Standard', 2: 'Gold', 3: 'VIP', 4: 'Ghost', 5: 'Phantom', 6: 'Celebrity'};
    return labels[membership] || 'Standard';
  };

  const formatUploadDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };

  const getMembershipColor = (membership) => {
    if (membership === 3) return colors.appPrimaryColor;
    if (membership === 2) return '#FFD700';
    if ([4, 5, 6].includes(membership)) return '#333';
    return '#999';
  };

  const renderProvementCard = (provement) => {
    if (!provement.user) {
      return (
        <View key={provement.id} style={styles.card}>
          <Text style={styles.deletedText}>⚠️ Profil gelöscht</Text>
          <TouchableOpacity onPress={() => removeProof(provement.userId)} style={[styles.btn, {backgroundColor: '#dc3545'}]}>
            <Text style={styles.btnText}>Entfernen</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const userData = provement.user;

    return (
      <View key={provement.id} style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{flex: 1}}>
            <Text style={styles.username}>{provement.username || userData.username}</Text>
            <View style={styles.badgesRow}>
              {userData.currentLocation?.city && (
                <View style={[styles.badge, {backgroundColor: '#6c757d'}]}>
                  <Text style={styles.badgeText}>📍 {userData.currentLocation.city}</Text>
                </View>
              )}
              {userData.membership && (
                <View style={[styles.badge, {backgroundColor: getMembershipColor(userData.membership)}]}>
                  <Text style={styles.badgeText}>🏅 {getMembershipLabel(userData.membership)}</Text>
                </View>
              )}
              {(userData.verificationChoiceMade || userData.isVerified) && (
                <View style={[styles.badge, {backgroundColor: '#28a745'}]}>
                  <Text style={styles.badgeText}>✓ Wahl</Text>
                </View>
              )}
              {userData.isVerified && (
                <View style={[styles.badge, {backgroundColor: '#17a2b8'}]}>
                  <Text style={styles.badgeText}>🛡️</Text>
                </View>
              )}
            </View>
          </View>
          {provement.uploadAt && (
            <View style={styles.uploadBox}>
              <Text style={{fontSize: 18}}>🕐</Text>
              <Text style={styles.uploadText}>{formatUploadDate(provement.uploadAt)}</Text>
            </View>
          )}
        </View>

        {/* Verification Section */}
        {provement.verificationData && !userData.isVerified && (
          <View style={styles.verificationBox}>
            <Text style={styles.sectionTitle}>⚠️ Verifizierung prüfen</Text>
            <View style={styles.verificationRow}>
              <View style={{flex: 1}}>
                <Text style={styles.verificationLabel}>Erwartete Geste</Text>
                <Image
                  source={{uri: `https://firebasestorage.googleapis.com/v0/b/desires-88d69.appspot.com/o/gesten%2F${provement.verificationData.verificationItem.padStart(3, '0')}.jpg?alt=media`}}
                  style={styles.verificationImg}
                  resizeMode="contain"
                />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.verificationLabel}>Hochgeladen</Text>
                <TouchableOpacity onPress={() => showImg(userData.verifiedImg?.thumbnails?.big)}>
                  <Image
                    source={{uri: userData.verifiedImg?.thumbnails?.medium}}
                    style={styles.verificationImg}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.verificationBtns}>
              <TouchableOpacity onPress={() => acceptVerification(userData)} style={[styles.btn, {backgroundColor: '#28a745', flex: 1}]}>
                <Text style={styles.btnText}>✓ Akzeptieren</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => declineVerification(userData)} style={[styles.btn, {backgroundColor: '#dc3545', flex: 1}]}>
                <Text style={styles.btnText}>✕ Ablehnen</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Profile & Verified Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Profilbilder</Text>
          <View style={{flexDirection: 'row', gap: 10}}>
            <View style={{flex: 1}}>
              <Text style={styles.imageTitle}>Profilbild</Text>
              <TouchableOpacity onPress={() => showImg(userData.profilePictures?.thumbnails?.big)}>
                <Image
                  source={{uri: userData.profilePictures?.thumbnails?.medium}}
                  style={styles.mainImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <View style={[styles.statusBadge, {backgroundColor: userData.profilePictures?.approved ? '#28a745' : '#dc3545'}]}>
                <Text style={styles.statusText}>{userData.profilePictures?.approved ? '✓ Geprüft' : '✕ Nicht geprüft'}</Text>
              </View>
              {!userData.profilePictures?.approved && (
                <TouchableOpacity
                  onPress={async () => {
                    await firestore().collection('Users').doc(userData.id).update({'profilePictures.approved': true});
                    await checkAllProvements(userData);
                    loadData();
                  }}
                  style={[styles.approveBtn, {backgroundColor: '#28a745'}]}>
                  <Text style={styles.btnText}>✓ Freigeben</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {userData.verifiedImg && userData.isVerified && (
              <View style={{flex: 1}}>
                <Text style={styles.imageTitle}>Verifiziert</Text>
                <TouchableOpacity onPress={() => showImg(userData.verifiedImg?.thumbnails?.big)}>
                  <Image
                    source={{uri: userData.verifiedImg?.thumbnails?.medium}}
                    style={styles.mainImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <View style={[styles.statusBadge, {backgroundColor: '#28a745'}]}>
                  <Text style={styles.statusText}>🛡️ Verifiziert</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Public Images */}
        {userData.publicAlbum && userData.publicAlbum.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🖼️ Öffentliche Bilder ({userData.publicAlbum.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 10}}>
              <View style={{flexDirection: 'row', gap: 10}}>
                {userData.publicAlbum.map((picture, index) => (
                  <View key={index} style={styles.albumImageWrapper}>
                    <TouchableOpacity onPress={() => showImg(picture.thumbnails?.big)}>
                      <Image source={{uri: picture.thumbnails?.medium}} style={styles.albumImage} resizeMode="cover" />
                    </TouchableOpacity>
                    <View style={[styles.miniStatusBadge, {backgroundColor: picture.approved ? '#28a745' : '#dc3545'}]}>
                      <Text style={styles.miniStatusText}>{picture.approved ? '✓' : '✕'}</Text>
                    </View>
                    {!picture.approved && (
                      <View style={styles.miniActions}>
                        <TouchableOpacity
                          onPress={async () => {
                            const updated = [...userData.publicAlbum];
                            updated[index].approved = true;
                            await firestore().collection('Users').doc(userData.id).update({publicAlbum: updated});
                            await checkAllProvements(userData);
                            loadData();
                          }}
                          style={[styles.miniBtn, {backgroundColor: '#28a745'}]}>
                          <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>✓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => remove(index, userData, true)}
                          style={[styles.miniBtn, {backgroundColor: '#dc3545'}]}>
                          <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>🗑</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Private Images */}
        {userData.privateAlbum && userData.privateAlbum.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔒 Private Bilder ({userData.privateAlbum.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 10}}>
              <View style={{flexDirection: 'row', gap: 10}}>
                {userData.privateAlbum.map((picture, index) => (
                  <View key={index} style={styles.albumImageWrapper}>
                    <TouchableOpacity onPress={() => showImg(picture.thumbnails?.big)}>
                      <Image source={{uri: picture.thumbnails?.medium}} style={styles.albumImage} resizeMode="cover" />
                    </TouchableOpacity>
                    <View style={[styles.miniStatusBadge, {backgroundColor: picture.approved ? '#28a745' : '#dc3545'}]}>
                      <Text style={styles.miniStatusText}>🔒 {picture.approved ? '✓' : '✕'}</Text>
                    </View>
                    {!picture.approved && (
                      <View style={styles.miniActions}>
                        <TouchableOpacity
                          onPress={async () => {
                            const updated = [...userData.privateAlbum];
                            updated[index].approved = true;
                            await firestore().collection('Users').doc(userData.id).update({privateAlbum: updated});
                            await checkAllProvements(userData);
                            loadData();
                          }}
                          style={[styles.miniBtn, {backgroundColor: '#28a745'}]}>
                          <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>✓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => remove(index, userData, false)}
                          style={[styles.miniBtn, {backgroundColor: '#dc3545'}]}>
                          <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>🗑</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => setAllProved(userData)} style={[styles.actionBtn, {backgroundColor: '#28a745', flex: 1.2}]}>
            <Text style={styles.actionIcon}>✓✓</Text>
            <Text style={styles.actionText}>Alle freigeben</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => showProfile(userData)} style={[styles.actionBtn, {backgroundColor: colors.appPrimaryColor}]}>
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Profil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => showChat(userData)} style={[styles.actionBtn, {backgroundColor: '#17a2b8'}]}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => toggleEnable(userData)} style={[styles.actionBtn, {backgroundColor: userData.status === 1 ? '#ffc107' : '#28a745'}]}>
            <Text style={styles.actionIcon}>👁</Text>
            <Text style={[styles.actionText, userData.status === 1 && {color: '#000'}]}>
              {userData.status === 1 ? 'Aus' : 'Ein'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => deleteUser(userData)} style={[styles.actionBtn, {backgroundColor: '#dc3545'}]}>
            <Text style={styles.actionIcon}>🗑</Text>
            <Text style={styles.actionText}>Löschen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <Wrapper isMain>
        <StatusBars.Dark />
        <Headers.Primary showBackArrow title="Bilderprüfung" />
        <Wrapper alignItemsCenter justifyContentCenter style={{flex: 1}}>
          <Text>Lädt...</Text>
        </Wrapper>
      </Wrapper>
    );
  }

  return (
    <Wrapper isMain>
      <StatusBars.Dark />
      <Headers.Primary showBackArrow title={`Bilderprüfung ${provements.length > 0 ? `(${provements.length})` : ''}`} />
      <Spacer height={scale(10)} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {provements.length === 0 ? (
          <View style={{alignItems: 'center', paddingVertical: 60}}>
            <Text style={{fontSize: 16, color: '#999'}}>Keine Prüfungen vorhanden</Text>
            <TouchableOpacity onPress={loadData} style={{marginTop: 20}}>
              <Text style={{color: colors.appPrimaryColor, fontWeight: 'bold', fontSize: 14}}>🔄 Aktualisieren</Text>
            </TouchableOpacity>
          </View>
        ) : (
          provements.map(renderProvementCard)
        )}
        <Spacer height={scale(40)} />
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal visible={imageModalVisible} transparent={true} onRequestClose={() => setImageModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setImageModalVisible(false)}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{uri: selectedImage}}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: colors.appPrimaryColor,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  username: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  uploadBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  uploadText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  verificationBox: {
    backgroundColor: '#fff8e1',
    padding: 14,
    margin: 12,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#ffc107',
  },
  verificationRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  verificationLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#856404',
    textAlign: 'center',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  verificationImg: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  verificationBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  section: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.appPrimaryColor,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.appPrimaryColor + '30',
  },
  imageTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.appPrimaryColor,
    textAlign: 'center',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  mainImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
  },
  statusBadge: {
    marginTop: 6,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  approveBtn: {
    marginTop: 6,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  albumImageWrapper: {
    width: 130,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  albumImage: {
    width: 118,
    height: 118,
    borderRadius: 8,
  },
  miniStatusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  miniActions: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  miniBtn: {
    flex: 1,
    height: 26,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
    padding: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  actionBtn: {
    minWidth: 70,
    height: 54,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  actionText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  deletedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  modalImage: {
    width: width,
    height: height,
  },
});
