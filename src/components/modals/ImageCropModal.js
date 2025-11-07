import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { useTranslation } from 'react-i18next';
import { Icon } from '@rneui/themed';

// Self-developed Components
import { Wrapper, Text, Buttons } from '../index';
import { colors } from '../../services';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageCropModal = ({ visible, onClose, onImageSelected, aspectRatio = [3, 4] }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  console.log('ImageCropModal visible:', visible);

  const openImagePicker = (source) => {
    console.log('Opening image picker for source:', source);
    setLoading(true);
    
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      cropping: true,
      cropperToolbarTitle: t('IMAGECROP'),
      cropperChooseText: t('CHOOSE'),
      cropperCancelText: t('CANCEL'),
      width: 600,
      height: 800,
      quality: 1.0,
      compressImageQuality: 1.0,
      compressImageMaxWidth: 4000,
      compressImageMaxHeight: 4000,
      freeStyleCropEnabled: false,
      showCropGuidelines: true,
      hideBottomControls: false,
      enableRotationGesture: true,
      cropperStatusBarColor: colors.appPrimaryColor,
      cropperToolbarColor: colors.appPrimaryColor,
      cropperActiveWidgetColor: colors.appPrimaryColor,
      cropperToolbarWidgetColor: colors.appPrimaryColor,
    };

    const pickerMethod = source === 'camera' 
      ? ImagePicker.openCamera 
      : ImagePicker.openPicker;

    pickerMethod(options)
      .then(image => {
        console.log('Image selected:', image);
        setLoading(false);
        onImageSelected(image);
        onClose();
      })
      .catch(error => {
        console.log('Image picker error:', error);
        setLoading(false);
        if (error.code !== 'E_PICKER_CANCELLED') {
          Alert.alert(t('ERROR'), t('IMAGE_PICKER_ERROR'));
        }
      });
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text isMedium size={18} color={colors.appTextColor1}>
              {t('SELECT_IMAGE')}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" type="ionicon" size={24} color={colors.appTextColor1} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Buttons.Colored
              text={t('CAMERA')}
              onPress={() => openImagePicker('camera')}
              isLoading={loading}
              iconName="camera-outline"
              iconType="ionicon"
              buttonStyle={styles.button}
            />

            <Buttons.Colored
              text={t('GALLERY')}
              onPress={() => openImagePicker('gallery')}
              isLoading={loading}
              iconName="images-outline"
              iconType="ionicon"
              buttonStyle={styles.button}
            />
          </View>

          {loading && (
            <View style={styles.loadingOverlay}>
              <Text isMedium color={colors.appTextColor1}>
                {t('PROCESSING_IMAGE')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.appBackgroundColor,
    borderRadius: 12,
    padding: 20,
    width: screenWidth * 0.8,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    gap: 15,
  },
  button: {
    marginVertical: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});

export default ImageCropModal;
