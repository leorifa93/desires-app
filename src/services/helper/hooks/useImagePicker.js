import { useState, useCallback } from 'react';
import * as ImagePicker from 'react-native-image-picker';
import ImageCropPicker from 'react-native-image-crop-picker';
import { imagePickerOptions } from '../../constants';
import { Platform } from 'react-native';

const useImagePicker = () => {

    const options=imagePickerOptions
    const [image, setImage] = useState(null);
    const [video, setVideo] = useState(null);

    // Function to open the image picker for the camera
    const openCamera = useCallback(() => {
        ImageCropPicker.openCamera({
            mediaType: 'photo',
            includeBase64: true,
            cropping: true,
            cropperToolbarTitle: 'Bild zuschneiden',
            cropperChooseText: 'Auswählen',
            cropperCancelText: 'Abbrechen',
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
        }).then(image => {
            console.log('ImageCropPicker camera response: ', image)
            let imageObj = {
                uri: image.path,
                type: image.mime,
                name: image.filename || 'image.jpg'
            }
            setImage(imageObj)
        }).catch(error => {
            console.log('ImageCropPicker camera error: ', error)
        });
    }, []);

    // Function to open the image picker for the library
    const openLibrary = useCallback(() => {
        return ImageCropPicker.openPicker({
            mediaType: 'photo',
            includeBase64: true,
            cropping: true,
            cropperToolbarTitle: 'Bild zuschneiden',
            cropperChooseText: 'Auswählen',
            cropperCancelText: 'Abbrechen',
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
        }).then(image => {
            console.log('ImageCropPicker response: ', image)
            let imageObj = {
                uri: image.path,
                type: image.mime,
                name: image.filename || 'image.jpg'
            }
            setImage(imageObj)
            return imageObj; // Return the image object for immediate use
        }).catch(error => {
            console.log('ImageCropPicker error: ', error)
            throw error;
        });
    }, []);

    // Function to open video picker from library
    const openVideoLibrary = useCallback(() => {
        return new Promise((resolve, reject) => {
            const options = {
                mediaType: 'video',
                videoQuality: 'medium',
                durationLimit: 60, // 60 seconds max
                includeBase64: false,
                selectionLimit: 1,
            };

            console.log('Opening video picker with options:', options);

            ImagePicker.launchImageLibrary(options, (response) => {
                console.log('ImagePicker video response:', response);

                if (response.didCancel) {
                    console.log('User cancelled video picker');
                    reject({ code: 'E_PICKER_CANCELLED', message: 'User cancelled' });
                    return;
                }

                if (response.errorCode) {
                    console.log('ImagePicker Error Code:', response.errorCode);
                    console.log('ImagePicker Error Message:', response.errorMessage);
                    reject(new Error(response.errorMessage || 'Unknown error'));
                    return;
                }

                if (response.assets && response.assets.length > 0) {
                    const video = response.assets[0];
                    console.log('Video selected from response.assets:', video);
                    
                    // Duration is in seconds for react-native-image-picker
                    const durationInSeconds = video.duration || 0;
                    
                    console.log('Video duration in seconds:', durationInSeconds);
                    
                    let videoObj = {
                        uri: video.uri,
                        type: video.type,
                        name: video.fileName || 'video.mp4',
                        duration: durationInSeconds,
                        width: video.width,
                        height: video.height,
                        size: video.fileSize,
                    };
                    
                    console.log('Video object created:', videoObj);
                    setVideo(videoObj);
                    resolve(videoObj);
                } else {
                    console.log('No video in response');
                    reject(new Error('No video selected'));
                }
            });
        });
    }, []);

    return {
        image,
        video,
        openCamera,
        openLibrary,
        openVideoLibrary,
    };
};

export default useImagePicker;
