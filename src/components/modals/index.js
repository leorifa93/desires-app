import React, { Fragment, useEffect, useLayoutEffect, useMemo, useState, useRef, startTransition, memo, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewPropTypes,
  FlatList,
  Platform,
  ScrollView,
  Alert,
  Modal as RNModal,
  Text as RNText,
  InteractionManager,
} from 'react-native';
import { Icon } from '@rneui/base';
import ImagePicker from 'react-native-image-crop-picker';
import {
  colors,
  sizes,
  appStyles,
  useKeyboardStatus,
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
  appIcons,
  fontSizes,
  useImagePicker,
  getUserDetail,
  saveUserData,
} from '../../services';
import locationService from '../../services/locationService';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../../store/reducers/auth';
import firestore from '@react-native-firebase/firestore';
import { geohashForLocation } from 'geofire-common';
import { getLocales } from 'react-native-localize';
import Modal from 'react-native-modal';
import Wrapper from '../wrapper';
import Text from '../text';
import Spacer from '../spacer';
import * as Icons from '../icons';
import * as Buttons from '../buttons';
import * as ScrollViews from '../scrollViews';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Labels, Lines, MyAnimated, TextInputs } from '..';
import Countries from '../../constants/Countries';
import { CloseSvgIcon } from '../icons/ProfileIcons';
import { scale, verticalScale } from 'react-native-size-matters';
import MapView, { Marker, Circle } from 'react-native-maps';
import { MapStyling } from '../../services/utilities/assets/mapStyling';
import { useTranslation } from 'react-i18next';
import { uploadImage, deleteAll } from '../../services/firebaseUtilities/storage';
// Passe den Pfad ggf. an

// export const Swipable = ({ children, title, isVisible, toggleModal, footerFlex, headerFlex }) => {
//     return (
//         <Modal
//             isVisible={isVisible}
//             swipeDirection="down"
//             onSwipeComplete={toggleModal}
//             style={{ margin: 0 }}
//             // backdropOpacity={0}
//             onBackdropPress={toggleModal}
//         >
//             <Wrapper flex={1}>
//                 <Wrapper flex={headerFlex ? headerFlex : 1.5} />
//                 <Wrapper flex={footerFlex ? footerFlex : 8.5} style={[styles.swipableModalFooter]}>
//                     {children}
//                     <Wrapper style={[styles.barContainer]}>
//                         <Wrapper style={[appStyles.center]}>
//                             <TouchableOpacity onPress={toggleModal}>
//                                 <Lines.Horizontal
//                                     height={4}
//                                     width={responsiveWidth(15)}
//                                     style={{ borderRadius: 5 }}
//                                     color={colors.appBgColor3}
//                                 />
//                             </TouchableOpacity>
//                             <Spacer isBasic />
//                             <Text isTinyTitle>{title}</Text>
//                         </Wrapper>
//                     </Wrapper>
//                     <Wrapper isAbsolute style={[{ top: sizes.baseMargin * 1.5, left: sizes.marginHorizontal }]}>
//                         <Icon
//                             name="close"
//                         />
//                     </Wrapper>
//                 </Wrapper>
//             </Wrapper>
//         </Modal>
//     );
// }

export function Swipable({
  visible,
  toggle,
  disableSwipe,
  disableBackdropPress,
  topMargin,
  headerTitle,
  headerRight,
  headerLeft,
  hideHeader,
  children,
  backdropOpacity,
  backdropColor,
  containerStyle,
  isBlur,
  onKeyborderOpenHeightDown,
}) {
  const [blurStart, setBlurStart] = useState(false);
  // manage keyboard
  const keyboardVisible = useKeyboardStatus();

  useEffect(() => {
    if (visible) {
      if (!blurStart) {
        setTimeout(() => setBlurStart(!blurStart), 400);
      }
    } else {
      setBlurStart(false);
    }
  }, [visible, toggle, keyboardVisible]);

  const defaultTopMargin = topMargin
    ? (Platform.OS === 'ios' ? topMargin : topMargin + responsiveHeight(5))
    : (keyboardVisible && Platform.OS === 'ios')
      ? responsiveHeight(12)
      : responsiveHeight(12);
  return (
    <Modal
      isVisible={visible} // Comment on video User
      style={{ margin: 0 }}
      onSwipeComplete={toggle}
      swipeDirection={disableSwipe ? null : 'down'}
      onBackdropPress={disableBackdropPress ? null : toggle}
      backdropOpacity={backdropOpacity !== undefined ? backdropOpacity : 0.6}
      backdropColor={backdropColor || 'black'}
      avoidKeyboard={Platform.OS === 'ios'}>
      <Wrapper flex={1}>
        <Wrapper flex={1} justifyContentFlexend>
          <MyAnimated.AnimatedView
            NotFlexed
            onPressStart={Platform.OS === 'ios' && keyboardVisible && onKeyborderOpenHeightDown}
            onPressClosed={Platform.OS === 'ios' && !keyboardVisible && onKeyborderOpenHeightDown}
            height={-onKeyborderOpenHeightDown}>
            <Wrapper
              style={[
                {
                  //flex: 1,
                  marginTop: defaultTopMargin,
                  backgroundColor: colors.appBgColor1,
                  borderTopRightRadius: 25,
                  borderTopLeftRadius: 25,
                  maxHeight: responsiveHeight(88), // Verhindert endloses Scrollen
                  //...appStyles.shadowExtraDark
                },
                containerStyle,
              ]}>
              {hideHeader ? null : (
                <Wrapper style={appStyles.rowCompContainer}>
                  <Wrapper style={{ alignItems: 'center', right: 0, left: 0 }}>
                    <Text isTinyTitle style={[appStyles.headerTitleStyle]}>
                      {/* {data ? data.length + ' People' : 0 + ' People'} */}
                      {headerTitle ? headerTitle : 'Title'}
                    </Text>
                  </Wrapper>
                  <Wrapper>
                    {headerLeft ? (
                      headerLeft
                    ) : (
                      // <BackIcon
                      //     onPress={toggle}
                      //     color={colors.appTextColor6}
                      // />
                      <Icon
                        name="x"
                        type="feather"
                        size={responsiveFontSize(2.5)}
                        color={colors.appTextColor1}
                        onPress={toggle}
                      />
                    )}
                  </Wrapper>

                  <Wrapper style={{}}>{headerRight}</Wrapper>
                </Wrapper>
              )}
              {children}
              <Spacer height={responsiveHeight(12)} />
            </Wrapper>
            {/* Removed decorative background strip that caused a bar to appear above modals */}
          </MyAnimated.AnimatedView>
        </Wrapper>
      </Wrapper>
    </Modal>
  );
}

export function PopupPrimary({
  visible,
  toggle,
  isBlur,
  title,
  info,
  iconName,
  iconType,
  customIcon,
  buttonText1,
  buttonText2,
  onPressButton1,
  onPressButton2,
  topMargin,
  children,
  scrollEnabled,
  backdropColor,
  backdropOpacity,
  onPressClose,
  button1Style,
  button2Style,
  keyboardShouldPersistTaps,
  headerTitle,
  topImage,
  headerRight,
  closeIconColor,
  disableSwipe,
  icon,
  disableBackdropPress,
  headerTitleStyle,
  preBottom,
  headerStyle,
  closeIconSize,
  rightContainerStyle,
  closeIconContainerSize,
  buttonWrapperShadow,
  headerBottom,
  titleStyle,
  buttonText1Style,
  buttonText2Style,
  headerSubtitleStyle,
  headerSubtitle,
  buttonsDirection,
  buttonsContainerStyle,
  mainContainerStyle,
  containerStyle,
  onKeyborderOpenHeightDown,
  wrapContentInScroll = true,

  //loaders
  loadingButton1,
  loadingButton2,
}) {
  const isRowButtons =
    buttonsDirection === 'row' || buttonsDirection === 'row-reverse';
  return (
    <Swipable
      visible={visible}
      toggle={toggle}
      disableSwipe={disableSwipe}
      disableBackdropPress={disableBackdropPress}
      containerStyle={mainContainerStyle}
      isBlur={isBlur}
      topMargin={topMargin}
      onKeyborderOpenHeightDown={onKeyborderOpenHeightDown}>
      <Wrapper style={containerStyle}>
        {headerTitle ? (
          <Wrapper style={{}}>
            <Wrapper
              style={[
                {
                  paddingHorizontal: sizes.marginHorizontal,
                  backgroundColor: 'transparent',
                  paddingBottom: sizes.marginVertical,
                  paddingTop: sizes.marginVertical * 2.5,
                  justifyContent: 'center',
                },
                headerStyle,
              ]}>
              <Text
                isSmallTitle
                style={[appStyles.textCenter, headerTitleStyle]}>
                {headerTitle}
              </Text>
              {headerSubtitle ? (
                <Text
                  isRegular
                  style={[
                    appStyles.textCenter,
                    { marginTop: sizes.smallMargin },
                    headerSubtitleStyle,
                  ]}>
                  {headerSubtitle}
                </Text>
              ) : null}
              <Wrapper
                isAbsolute
                style={[
                  {
                    right: sizes.marginHorizontal,
                    top: sizes.marginVertical * 1.3,
                    zIndex: 1000,
                  },
                  rightContainerStyle,
                ]}>
                {headerRight ? (
                  headerRight
                ) : onPressClose ? (
                  <TouchableOpacity onPress={onPressClose} activeOpacity={0.7}
                    style={{ padding: sizes.smallMargin, alignItems: 'center', justifyContent: 'center' }}>
                    <Wrapper flexDirectionRow alignItemsCenter>
                      <CloseSvgIcon size={responsiveFontSize(3.8)} color={closeIconColor ? closeIconColor : colors.appTextColor1} />
                      <Spacer width={sizes.tinyMargin} />
                      <Text isSmallTitle style={{ color: closeIconColor ? closeIconColor : colors.appTextColor1 }}>X</Text>
                    </Wrapper>
                  </TouchableOpacity>
                ) : null}
              </Wrapper>
            </Wrapper>
            {headerBottom && headerBottom}
          </Wrapper>
        ) : (
          <Spacer height={sizes.baseMargin} />
        )}

        {wrapContentInScroll ? (
          <ScrollViews.WithKeyboardAvoidingView
            containerStyle={{ flex: 0 }}
            scrollEnabled={scrollEnabled}>
            <Wrapper style={[appStyles.alignItemsCenter]}>
              {icon || iconName || customIcon ? (
                <>
                  {icon ? (
                    icon
                  ) : (
                    <Icons.Button
                      iconName={iconName}
                      iconType={iconType}
                      customIcon={customIcon}
                      iconColor={colors.appTextColor6}
                      buttonColor={colors.appColor1}
                      buttonSize={responsiveFontSize(10)}
                      iconSize={responsiveFontSize(4)}
                      buttonStyle={{ borderRadius: 100 }}
                    />
                  )}
                  <Spacer height={sizes.baseMargin * 1.5} />
                </>
              ) : null}
            </Wrapper>
            {title ? (
              <>
                <Wrapper
                  marginHorizontalBase
                  style={{ backgroundColor: 'transparent' }}>
                  <Text
                    isSmallTitle
                    isBoldFont
                    style={[appStyles.textCenter, titleStyle]}>
                    {title}
                  </Text>
                </Wrapper>
                <Spacer height={sizes.baseMargin} />
              </>
            ) : null}
            {info ? (
              <>
                <Wrapper
                  marginHorizontalLarge
                  style={{ backgroundColor: 'transparent' }}>
                  <Text isRegular style={[appStyles.textCenter]}>
                    {info}
                  </Text>
                </Wrapper>
                <Spacer isBasic />
              </>
            ) : null}
            {children}
          </ScrollViews.WithKeyboardAvoidingView>
        ) : (
          <>
            <Wrapper style={[appStyles.alignItemsCenter]}>
            {icon || iconName || customIcon ? (
              <>
                {icon ? (
                  icon
                ) : (
                  <Icons.Button
                    iconName={iconName}
                    iconType={iconType}
                    customIcon={customIcon}
                    iconColor={colors.appTextColor6}
                    buttonColor={colors.appColor1}
                    buttonSize={responsiveFontSize(10)}
                    iconSize={responsiveFontSize(4)}
                    buttonStyle={{ borderRadius: 100 }}
                  />
                )}
                <Spacer height={sizes.baseMargin * 1.5} />
              </>
            ) : null}
            </Wrapper>
            {title ? (
              <>
                <Wrapper
                  marginHorizontalBase
                  style={{ backgroundColor: 'transparent' }}>
                  <Text
                    isSmallTitle
                    isBoldFont
                    style={[appStyles.textCenter, titleStyle]}>
                    {title}
                  </Text>
                </Wrapper>
                <Spacer height={sizes.baseMargin} />
              </>
            ) : null}
            {info ? (
              <>
                <Wrapper
                  marginHorizontalLarge
                  style={{ backgroundColor: 'transparent' }}>
                  <Text isRegular style={[appStyles.textCenter]}>
                    {info}
                  </Text>
                </Wrapper>
                <Spacer isBasic />
              </>
            ) : null}
            {children}
          </>
        )}
        {preBottom}
        {/* </KeyboardAvoidingView> */}
        {/* <Spacers.Spacer height={sizes.baseMargin} /> */}

        {onPressButton1 || onPressButton2 ? (
          <Wrapper
            marginHorizontalBase
            style={[
              {
                backgroundColor: colors.appBgColor1,
                paddingBottom: sizes.baseMargin * 1.5,
                paddingTop: sizes.baseMargin,
                flexDirection: buttonsDirection || 'column-reverse',
              },
              buttonWrapperShadow && appStyles.shadowDark,
              buttonsContainerStyle,
            ]}>
            {onPressButton2 ? (
              <Wrapper style={[isRowButtons && { flex: 1 }]}>
                <Buttons.Bordered
                  text={buttonText2}
                  onPress={onPressButton2}
                  tintColor={colors.appColor1}
                  //tintColor={colors.appTextColor1}
                  buttonStyle={[appStyles.marginHorizontalZero, button2Style]}
                  textStyle={[buttonText2Style]}
                  isLoading={loadingButton2}
                />
              </Wrapper>
            ) : null}
            {onPressButton2 && onPressButton1 ? (
              isRowButtons ? (
                <Spacer width={sizes.marginHorizontal} />
              ) : (
                <Spacer height={sizes.marginVertical} />
              )
            ) : null}

            {onPressButton1 ? (
              <Wrapper style={[isRowButtons && { flex: 1 }]}>
                <Buttons.Colored
                  text={buttonText1}
                  onPress={onPressButton1}
                  shadow
                  buttonStyle={[{ marginHorizontal: 0 }, button1Style]}
                  textStyle={[buttonText1Style]}
                  isLoading={loadingButton1}
                />
              </Wrapper>
            ) : null}
          </Wrapper>
        ) : null}
        {/* <Spacers.Spacer height={sizes.baseMargin} /> */}
      </Wrapper>
    </Swipable>
  );
}

export function ImagePickerPopup({
  visible,
  toggle,
  onPressButton1,
  onPressButton2,
  title,
  button1Text,
  button2Text,
  cancelText,
}) {
  return (
    <PopupPrimary
      visible={visible}
      title={title || 'Choose Image'}
      // buttonText2="Cancel"
      // onPressButton2={toggle}
      toggle={toggle}
      topMargin={responsiveHeight(60)}>
      <Wrapper>
        <Wrapper marginHorizontalBase>
          {onPressButton1 ? (
            <>
              <Buttons.Colored
                text={button1Text || 'Take Photo'}
                //  iconName="camera"
                buttonStyle={{ backgroundColor: colors.appBgColor2 }}
                textStyle={[{ color: colors.appTextColor3 }]}
                onPress={() => {
                  toggle();
                  setTimeout(() => {
                    onPressButton1();
                  }, 500);
                }}
                disableShadow
              />
              <Spacer isBasic />
            </>
          ) : null}

          <Buttons.Colored
            text={button2Text || 'Select from Gallery'}
            //iconName="image"
            buttonStyle={{ backgroundColor: colors.appBgColor2 }}
            textStyle={[{ color: colors.appTextColor3 }]}
            onPress={() => {
              toggle();
              setTimeout(() => {
                onPressButton2();
              }, 500);
            }}
            disableShadow
          />
          <Spacer isBasic />
          <Buttons.Colored
            text={cancelText || 'Cancel'}
            //iconName="image"
            buttonStyle={{ backgroundColor: colors.transparent }}
            textStyle={[{ color: colors.appTextColor1 }]}
            onPress={() => {
              toggle();
            }}
            disableShadow
          />
        </Wrapper>
      </Wrapper>
    </PopupPrimary>
  );
}

export function PlacesAutocomplete({ visible, toggle, OnMapPage, onPress, selectedLocation, onApply }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const me = useSelector(state => state.auth.user);
  const [userData, setUserData] = useState(me);

  // Ensure me.details has the required structure
  const safeMe = me ? {
    ...me,
    details: {
      nationality: { code: '' },
      moreinfo: [],
      lifestyle: [],
      interests: [],
      brands: [],
      height: { cm: null, inch: null },
      weight: { kg: null, lbs: null },
      chest: { cm: null, inch: null },
      waist: { cm: null, inch: null },
      hips: { cm: null, inch: null },
      // Preserve existing details if they exist
      ...me.details
    },
    _settings: {
      units: {
        lengthType: 'Inch',
        distanceType: 'Mi',
        weightType: 'Lbs'
      },
      currentLang: 'de',
      showInDiscover: false,
      showCall: true,
      notifications: {
        messages: true,
        friendRequests: true,
        likes: true,
        call: true
      },
      // Preserve existing settings if they exist
      ...me._settings
    }
  } : {
    // Fallback when me is null
    details: {
      nationality: { code: '' },
      moreinfo: [],
      lifestyle: [],
      interests: [],
      brands: [],
      height: { cm: null, inch: null },
      weight: { kg: null, lbs: null },
      chest: { cm: null, inch: null },
      waist: { cm: null, inch: null },
      hips: { cm: null, inch: null }
    },
    _settings: {
      units: {
        lengthType: 'Inch',
        distanceType: 'Mi',
        weightType: 'Lbs'
      },
      currentLang: 'de',
      showInDiscover: false,
      showCall: true,
      notifications: {
        messages: true,
        friendRequests: true,
        likes: true,
        call: true
      }
    }
  };

  // Function to prepare location data (NOT saving to Firestore yet)
  // Location will be saved only when user clicks "Apply" button
  const prepareLocationData = async (data, details) => {
    try {
      const lat = details.geometry.location.lat;
      const lng = details.geometry.location.lng;
      
      // Get city name from coordinates using reverse geocoding (like old project)
      const city = await locationService.getCityFromLatLng(lat, lng);
      
      // Prepare location data (will be saved on "Apply")
      const locationData = {
        lat: lat,
        lng: lng,
        city: city,
        hash: geohashForLocation([lat, lng])
      };
      
      console.log('Location prepared (not saved yet):', city);
      
      return locationData;
    } catch (error) {
      console.error('Error preparing location:', error);
      return null;
    }
  };
  
  // Default coordinates - always from currentLocation (like old project)
  const defaultLat = safeMe?.currentLocation?.lat || 52.5200;
  const defaultLng = safeMe?.currentLocation?.lng || 13.4050;
  
  const [mapRegion, setMapRegion] = useState({
    latitude: defaultLat,
    longitude: defaultLng,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [currentLocation, setCurrentLocation] = useState({
    latitude: defaultLat,
    longitude: defaultLng,
  });
  
  // Zoom functions
  const zoomIn = () => {
    setMapRegion(prev => ({
      ...prev,
      latitudeDelta: Math.max(0.001, prev.latitudeDelta * 0.7),
      longitudeDelta: Math.max(0.001, prev.longitudeDelta * 0.7),
    }));
  };
  
  const zoomOut = () => {
    setMapRegion(prev => ({
      ...prev,
      latitudeDelta: Math.min(1, prev.latitudeDelta * 1.4),
      longitudeDelta: Math.min(1, prev.longitudeDelta * 1.4),
    }));
  };
  const styles = StyleSheet.create({
    autocompleteContainer: {
      flex: 0,
      zIndex: 1000,
    },
    textInputContainer: {
      ...appStyles.inputFieldBorderd,
      alignItems: 'center',
      paddingHorizontal: responsiveWidth(4.5),
      borderRadius: responsiveWidth(100),
      borderColor: colors.appBorderColor2,
      //justifyContent: 'center',
      zIndex: 1000,
    },
    textInput: {
      fontSize: fontSizes.medium,
      marginHorizontal: sizes.smallMargin,
    },
    listView: {
      //backgroundColor: 'red',
      marginHorizontal: sizes.mediumMargin,
      maxHeight: responsiveHeight(40),
      backgroundColor: colors.appBgColor1,
      borderRadius: responsiveWidth(2),
      zIndex: 1000,
      elevation: 10,
      position: 'absolute',
      top: scale(60),
      left: 0,
      right: 0,
    },
    row: {
      fontSize: fontSizes.medium,
      padding: 13,
    },
    description: {
      fontSize: fontSizes.medium,
    },
    MapMainContainer: {
      margin: sizes.baseMargin,
      height: responsiveHeight(24),
      //backgroundColor: 'red',
      borderRadius: responsiveWidth(3),
      overflow: 'hidden',
    },
  });

  return (
    <PopupPrimary
      visible={visible}
      toggle={toggle}
      disableSwipe
      isBlur
      wrapContentInScroll={false}
      children={
        <Wrapper>
            <Labels.ModalLabelWithCross
              Title={OnMapPage ? t('SELECTCITY') : t('LOCATION')}
              onPress={toggle}
            />
            <Spacer isTiny />
            <Wrapper style={{ zIndex: 1000 }}>
              <GooglePlacesAutocomplete
              placeholder={t('SEARCHPLACE')}
              fetchDetails
              textInputProps={{
                placeholderTextColor: colors.appBorderColor1,
                returnKeyType: 'search',
              }}
              keyboardShouldPersistTaps="always"
              enablePoweredByContainer={false}
              onPress={async (data, details) => {
                console.log('GooglePlacesAutocomplete onPress called:', data, details);
                console.log('Data:', data);
                console.log('Details:', details);
                console.log('Details geometry:', details?.geometry);
                console.log('Details location:', details?.geometry?.location);
                
                if (details?.geometry?.location) {
                  console.log('Valid location found, updating...');
                  setMapRegion({
                    latitude: details.geometry.location.lat,
                    longitude: details.geometry.location.lng,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  });
                  setCurrentLocation({
                    latitude: details.geometry.location.lat,
                    longitude: details.geometry.location.lng,
                  });
                  setUserData({
                    ...userData,
                    location: {
                      location: data.description,
                      placeId: data.place_id
                    },
                  });
                  
                  // Prepare location data
                  const locationData = await prepareLocationData(data, details);
                  
                  // If OnMapPage is true, just call onPress (don't close modal, don't save)
                  if (OnMapPage && onPress) {
                    console.log('OnMapPage: Calling parent onPress callback with location data (not saving)');
                    onPress(data, details, locationData);
                    // Don't close modal - user needs to click "Anwenden"
                  } else if (onPress) {
                    // Filter screen - call onPress and close
                    console.log('Filter screen: Calling parent onPress callback with location data');
                    onPress(data, details, locationData);
                    setTimeout(() => {
                      toggle();
                    }, 100);
                  } else if (locationData && me?.id) {
                    // No callback provided - save directly (for profile settings)
                    console.log('No callback, saving location directly to Firestore');
                    await firestore().collection('Users').doc(me.id).update({
                      currentLocation: locationData,
                      location: { type: 'customLocation' }
                    });
                    
                    // Update Redux store
                    const updatedUser = { 
                      ...me, 
                      currentLocation: locationData,
                      location: { type: 'customLocation' } 
                    };
                    dispatch(setUser({ user: updatedUser, dataLoaded: true }));
                    console.log('Location saved successfully:', locationData.city);
                    
                    // Close the modal after save
                    setTimeout(() => {
                      toggle();
                    }, 100);
                  }
                } else {
                  console.log('No valid location found in details');
                  console.log('Calling onPress anyway for debugging...');
                  if (onPress) {
                    onPress(data, details);
                  }
                }
              }}
              onFail={(error) => {
                console.log('GooglePlacesAutocomplete error:', error);
              }}
              onNotFound={() => {
                console.log('No results found');
              }}
              onTimeout={() => {
                console.log('Request timeout');
              }}
              query={{
                key: 'AIzaSyBxdsntNvOw3i8qUwDC_rqpEDOMvlQJgIQ', // Use the same API key as in Around Me
                language: 'en',
                types: '(cities)'
              }}
              styles={{
                textInputContainer: styles.textInputContainer,
                textInput: styles.textInput,
                predefinedPlacesDescription: {
                  color: '#1faadb',
                },
                listView: styles.listView,
                container: styles.autocompleteContainer,
                row: styles.row,
                description: styles.description,
              }}
              renderLeftButton={() => (
                <Icons.Custom
                  icon={appIcons.Search}
                  size={scale(23)}
                  color={colors.appBorderColor1}
                />
              )}
            />
            <Spacer height={sizes.smallMargin} />
            </Wrapper>

            <Spacer isTiny />
            <Wrapper style={styles.MapMainContainer}>
              <MapView
                style={{ width: scale(320), height: scale(250) }}
                customMapStyle={MapStyling}
                region={mapRegion}
                onPress={(event) => {
                  const { latitude, longitude } = event.nativeEvent.coordinate;
                  setCurrentLocation({ latitude, longitude });
                  setMapRegion(prev => ({
                    ...prev,
                    latitude,
                    longitude,
                  }));
                }}>
                <Marker
                  coordinate={currentLocation}
                  pinColor={colors.appPrimaryColor}>
                  <Icons.Custom
                    icon={appIcons.LocationLogo1}
                    size={scale(34)}
                  />
                </Marker>
              </MapView>
              <Wrapper
                isAbsolute
                style={{ right: 5, bottom: scale(80), ...appStyles.shadowDark }}>
                <TouchableOpacity
                  onPress={zoomIn}
                  style={{
                    backgroundColor: colors.appBgColor1,
                    borderRadius: scale(27),
                    width: scale(54),
                    height: scale(54),
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.appBorderColor2,
                  }}>
                  <Text style={{ color: colors.appTextColor1, fontSize: scale(22), fontWeight: 'bold' }}>+</Text>
                </TouchableOpacity>
              </Wrapper>
              <Wrapper
                isAbsolute
                style={{ right: 5, bottom: scale(40), ...appStyles.shadowDark }}>
                <TouchableOpacity
                  onPress={() => {
                    if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
                      setMapRegion(prev => ({
                        ...prev,
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                      }));
                    }
                  }}
                  style={{
                    backgroundColor: colors.appBgColor1,
                    borderRadius: scale(27),
                    width: scale(54),
                    height: scale(54),
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.appBorderColor2,
                  }}>
                  <Icons.Custom
                    icon={appIcons.LocationLogo1}
                    size={scale(26)}
                    color={colors.appTextColor1}
                  />
                </TouchableOpacity>
              </Wrapper>
              <Wrapper
                isAbsolute
                style={{ right: 5, bottom: scale(5), ...appStyles.shadowDark }}>
                <TouchableOpacity
                  onPress={zoomOut}
                  style={{
                    backgroundColor: colors.appBgColor1,
                    borderRadius: scale(27),
                    width: scale(54),
                    height: scale(54),
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.appBorderColor2,
                  }}>
                  <Text style={{ color: colors.appTextColor1, fontSize: scale(22), fontWeight: 'bold' }}>-</Text>
                </TouchableOpacity>
              </Wrapper>
            </Wrapper>
            <Spacer isTiny />
            {OnMapPage ? (
              // For map page - show "Anwenden" button only if location selected
              selectedLocation && (
                <Buttons.Colored
                  text={t('APPLY')}
                  onPress={() => {
                    if (onApply) {
                      onApply();
                    }
                  }}
                />
              )
            ) : (
              // For other pages - show "SAVE" button
              <Buttons.Colored
                text={t('SAVE')}
                onPress={async () => {
                  // If onPress is provided, call it with the selected location data
                  if (onPress && userData.location) {
                    const mockDetails = {
                      geometry: {
                        location: {
                          lat: currentLocation.latitude,
                          lng: currentLocation.longitude
                        }
                      }
                    };
                    onPress(userData.location, mockDetails);
                  }
                  
                  await saveUserData(userData, () => {
                    toggle();
                  });

                  // Preserve critical auth/navigation fields to prevent unwanted OTP redirect
                  const mergedForRedux = {
                    ...me,
                    ...userData,
                    id: me?.id,
                    status: me?.status,
                    verifiedPhoneNumber: me?.verifiedPhoneNumber,
                    verificationChoiceMade: me?.verificationChoiceMade,
                    isVerified: me?.isVerified,
                    profileCompleted: me?.profileCompleted,
                  };
                  dispatch(setUser({ user: mergedForRedux, dataLoaded: true }));
                }}
              />
            )}
          </Wrapper>
      }
    />
  );
}

export function EditProfile({ visible, toggle }) {
  // Get Redux state and hooks FIRST before anything else
  const { t, i18n } = useTranslation();
  const lang = useMemo(() => i18n.language || 'en', [i18n.language]);
  
  // Memoized selector to prevent unnecessary re-renders
  const me = useSelector(state => state.auth.user, (prev, next) => {
    // Only re-render if critical fields changed
    return prev?.id === next?.id && 
           prev?.publicAlbum?.length === next?.publicAlbum?.length &&
           prev?.details === next?.details &&
           prev?._settings === next?._settings;
  });
  const dispatch = useDispatch();
  
  const [CurrentStage, setCurrentStage] = useState(1);
  const [MoreInfos, setMoreInfos] = useState(false);
  const [LifeStyle, setLifeStyle] = useState(false);
  const [Interests, setInterests] = useState(false);
  const [ILove, setILove] = useState(false);
  const [userData, setUserData] = useState(me || {});
  const scrollViewRef = useRef(null);
  // Removed scrollOffset state to prevent re-renders on scroll
  
  // Separate state for images to prevent unnecessary re-renders
  const [profilePictureState, setProfilePictureState] = useState(null);
  const [publicAlbumState, setPublicAlbumState] = useState([]);
  const [privateAlbumState, setPrivateAlbumState] = useState([]);
  
  // Initialize userData and images only when modal opens (not on every me change)
  useEffect(() => {
    if (visible && me) {
      setUserData(me);
      setProfilePictureState(me.profilePictures || null);
      setPublicAlbumState(me.publicAlbum || []);
      setPrivateAlbumState(me.privateAlbum || []);
    }
  }, [visible]); // Removed 'me' dependency to prevent unnecessary re-renders
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageType, setSelectedImageType] = useState(null); // 'profile', 'public', 'private'
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [interestsData, setInterestsData] = useState([]);
  const [lifestyleData, setLifestyleData] = useState([]);
  const [moreInfoData, setMoreInfoData] = useState([]);
  const [brandsData, setBrandsData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localImageUri, setLocalImageUri] = useState(null);
  const [newImageToUpload, setNewImageToUpload] = useState(null);
  const lastUploadedImageRef = useRef(null);
  const uploadProgressRef = useRef(0);
  const uploadingRef = useRef(false); // Ref for uploading state to prevent re-renders
  const meRef = useRef(me); // Ref for me to prevent re-renders in callbacks
  const maxPublicAlbumPictures = 5; // Maximum public album pictures (profile picture counts as +1, total 6 public)
  const maxPrivateAlbumPictures = 6; // Maximum private album pictures
  
  // Update meRef when me changes
  useEffect(() => {
    meRef.current = me;
  }, [me]);

  // Update uploadingRef when uploading changes
  useEffect(() => {
    uploadingRef.current = uploading;
  }, [uploading]);
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const [ethnicityPickerVisible, setEthnicityPickerVisible] = useState(false);
  const [nationalityPickerVisible, setNationalityPickerVisible] = useState(false);
  const [nationalitySearchText, setNationalitySearchText] = useState('');
  const [debouncedNationalitySearch, setDebouncedNationalitySearch] = useState('');
  const [eyeColorPickerVisible, setEyeColorPickerVisible] = useState(false);
  const [hairColorPickerVisible, setHairColorPickerVisible] = useState(false);
  const [hairLengthPickerVisible, setHairLengthPickerVisible] = useState(false);
  const [heightPickerVisible, setHeightPickerVisible] = useState(false);
  const [weightPickerVisible, setWeightPickerVisible] = useState(false);
  const [chestPickerVisible, setChestPickerVisible] = useState(false);
  const [waistPickerVisible, setWaistPickerVisible] = useState(false);
  const [hipsPickerVisible, setHipsPickerVisible] = useState(false);
  const [measurementPickerKey, setMeasurementPickerKey] = useState(null); // 'height' | 'weight' | 'chest' | 'waist' | 'hips' | null
  
  // Temporary values for measurement pickers
  const [tempHeightValue, setTempHeightValue] = useState(null);
  const [tempWeightValue, setTempWeightValue] = useState(null);
  const [tempChestValue, setTempChestValue] = useState(null);
  const [tempWaistValue, setTempWaistValue] = useState(null);
  const [tempHipsValue, setTempHipsValue] = useState(null);

  // Ensure me.details has the required structure
  const safeMe = me ? {
    ...me,
    details: {
      nationality: { code: '' },
      moreinfo: [],
      lifestyle: [],
      interests: [],
      brands: [],
      height: { cm: null, inch: null },
      weight: { kg: null, lbs: null },
      chest: { cm: null, inch: null },
      waist: { cm: null, inch: null },
      hips: { cm: null, inch: null },
      // Preserve existing details if they exist
      ...me.details
    },
    _settings: {
      units: {
        lengthType: 'Inch',
        distanceType: 'Mi',
        weightType: 'Lbs'
      },
      currentLang: 'de',
      showInDiscover: false,
      showCall: true,
      notifications: {
        messages: true,
        friendRequests: true,
        likes: true,
        call: true
      },
      // Preserve existing settings if they exist
      ...me._settings
    }
  } : {
    // Fallback when me is null
    details: {
      nationality: { code: '' },
      moreinfo: [],
      lifestyle: [],
      interests: [],
      brands: [],
      height: { cm: null, inch: null },
      weight: { kg: null, lbs: null },
      chest: { cm: null, inch: null },
      waist: { cm: null, inch: null },
      hips: { cm: null, inch: null }
    },
    _settings: {
      units: {
        lengthType: 'Inch',
        distanceType: 'Mi',
        weightType: 'Lbs'
      },
      currentLang: 'de',
      showInDiscover: false,
      showCall: true,
      notifications: {
        messages: true,
        friendRequests: true,
        likes: true,
        call: true
      }
    }
  };

  // Define currentSettings at component level so it's available everywhere
  const currentSettings = userData._settings || safeMe?._settings;

  // Memoize country options to avoid recalculating on every render
  const countryOptions = useMemo(() => 
    (Array.isArray(Countries) ? Countries : []).map(c => ({ 
      code: c.key || c.code || c.alpha2 || '', 
      country: c.country || c.name || '',
      searchKey: (c.country || c.name || '').toLowerCase() // Pre-compute lowercase for search
    })),
    []
  );
  
  // Use ref to track if nationality picker is mounted to prevent state updates after unmount
  const nationalityPickerMountedRef = useRef(false);
  const [nationalityListReady, setNationalityListReady] = useState(false);
  
  useEffect(() => {
    if (nationalityPickerVisible) {
      nationalityPickerMountedRef.current = true;
      // Wait for modal animation to complete before showing list (prevents Hermes crashes)
      const handle = InteractionManager.runAfterInteractions(() => {
        if (nationalityPickerMountedRef.current) {
          setNationalityListReady(true);
        }
      });
      
      return () => {
        handle.cancel();
      };
    } else {
      nationalityPickerMountedRef.current = false;
      setNationalityListReady(false);
      // Clear search when picker closes
      setNationalitySearchText('');
      setDebouncedNationalitySearch('');
    }
  }, [nationalityPickerVisible]);
  
  // Debounce nationality search to reduce filter operations (longer debounce for Hermes/Production)
  useEffect(() => {
    if (!nationalityPickerMountedRef.current) return;
    
    const timer = setTimeout(() => {
      if (nationalityPickerMountedRef.current) {
        setDebouncedNationalitySearch(nationalitySearchText);
      }
    }, 500); // Increased to 500ms for better Hermes performance
    
    return () => clearTimeout(timer);
  }, [nationalitySearchText]);
  
  // Memoize filtered nationality list for better performance
  const filteredNationalities = useMemo(() => {
    if (!debouncedNationalitySearch.trim()) return countryOptions;
    const searchLower = debouncedNationalitySearch.toLowerCase();
    return countryOptions.filter(opt => opt.searchKey.includes(searchLower));
  }, [debouncedNationalitySearch, countryOptions]);
  
  // Memoize nationality selection handler to prevent re-creating on every render
  const handleNationalitySelect = useCallback((opt) => {
    setUserData(prev => ({
      ...prev,
      details: { ...prev.details, nationality: { code: opt.code, country: opt.country } },
    }));
    setNationalityPickerVisible(false);
    setNationalitySearchText('');
  }, []);
  
  // Memoize styles for nationality items
  const nationalityItemStyle = useMemo(() => ({ 
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.appBorderColor2
  }), []);
  
  // Memoize renderItem for nationality picker
  const renderNationalityItem = useCallback(({ item: opt }) => (
    <TouchableOpacity
      onPress={() => handleNationalitySelect(opt)}
      style={nationalityItemStyle}
    >
      <Text>{opt.country}</Text>
    </TouchableOpacity>
  ), [handleNationalitySelect, nationalityItemStyle]);
  
  // Memoize empty component
  const nationalityEmptyComponent = useMemo(() => (
    <Wrapper paddingVerticalLarge alignItemsCenter>
      <Text isTextColor2>{t('NO_RESULTS') || 'No results found'}</Text>
    </Wrapper>
  ), [t]);
  
  // Memoize getItemLayout for better FlatList performance
  const nationalityItemHeight = scale(12) * 2 + 1;
  const getNationalityItemLayout = useCallback((data, index) => ({
    length: nationalityItemHeight,
    offset: nationalityItemHeight * index,
    index,
  }), [nationalityItemHeight]);
  
  // Memoize keyExtractor
  const nationalityKeyExtractor = useCallback((item) => item.code || `country-${item.country}`, []);
  
  // Memoize FlatList styles
  const nationalityFlatListStyle = useMemo(() => ({ 
    flex: 1,
    height: responsiveHeight(50)
  }), []);
  
  const nationalityContentContainerStyle = useMemo(() => ({ 
    paddingBottom: scale(20) 
  }), []);

  // Initialize user data with defaults when user is loaded (only once)
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (me && !hasInitializedRef.current) {
      // Ensure details object exists and has required measurement fields
      const needsUpdate = !me.details || 
                         !me.details.height || 
                         !me.details.weight || 
                         !me.details.chest || 
                         !me.details.waist || 
                         !me.details.hips;
      
      if (needsUpdate) {
        hasInitializedRef.current = true;
        // Update user in Firestore with default details structure
        const updatedUser = {
          ...me,
          details: {
            nationality: { code: '' },
            moreinfo: [],
            lifestyle: [],
            interests: [],
            brands: [],
            height: { cm: null, inch: null },
            weight: { kg: null, lbs: null },
            chest: { cm: null, inch: null },
            waist: { cm: null, inch: null },
            hips: { cm: null, inch: null },
            // Preserve existing details if they exist
            ...me.details
          },
        _settings: {
          units: {
            lengthType: 'Inch',
            distanceType: 'Mi',
            weightType: 'Lbs'
          },
          currentLang: 'de',
          showInDiscover: false,
          showCall: true,
          notifications: {
            messages: true,
            friendRequests: true,
            likes: true,
            call: true
          }
        }
      };
      
        // Update in Firestore
        if (me?.id) {
          firestore().collection('Users').doc(me.id).update({
            details: updatedUser.details,
            _settings: updatedUser._settings
          }).catch(console.error);
        }
      }
    }
  }, [me?.id]);

  useEffect(() => {
    const fetchInterests = async () => {
      const snapshot = await firestore().collection('UserInterests').get();
      const data = snapshot.docs.map(doc => doc.data());
      setInterestsData(data);
    };
    fetchInterests();
  }, []);

  // Memoize cleanDuplicates function
  const cleanDuplicates = useCallback((data) => {
    return data.filter((item, index, arr) => {
      return arr.findIndex(existingItem => {
        const itemId = item.id || item.value || item.label || item[lang] || item.en;
        const existingId = existingItem.id || existingItem.value || existingItem.label || existingItem[lang] || existingItem.en;
        return itemId === existingId && item.category === existingItem.category;
      }) === index;
    });
  }, [lang]);

  useEffect(() => {
    const fetchAll = async () => {
      const [lifestyleSnap, moreInfoSnap, brandsSnap] = await Promise.all([
        firestore().collection('UserLifestyle').get(),
        firestore().collection('UserMoreInfo').get(),
        firestore().collection('UserMyBrands').get(),
      ]);

      setLifestyleData(cleanDuplicates(lifestyleSnap.docs.map(doc => doc.data())));
      setMoreInfoData(cleanDuplicates(moreInfoSnap.docs.map(doc => doc.data())));
      setBrandsData(cleanDuplicates(brandsSnap.docs.map(doc => doc.data())));
    };
    fetchAll();
  }, [cleanDuplicates]);

  // Memoize grouped data to avoid recalculation on every render
  const groupedInterests = useMemo(() => {
    return interestsData.reduce((acc, item) => {
      // Skip items with undefined or missing category for interests
      if (!item.category || item.category === 'undefined') return acc;
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [interestsData]);

  const groupedLifestyle = useMemo(() => {
    return lifestyleData.reduce((acc, item) => {
      // Replace undefined category with default for lifestyle
      let category = item.category;
      if (category === 'undefined' || !category) {
        category = 'Animals';
      }
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [lifestyleData]);

  const groupedMoreInfo = useMemo(() => {
    return moreInfoData.reduce((acc, item) => {
      // Replace undefined category with default for moreinfo
      let category = item.category;
      if (category === 'undefined' || !category) {
        category = 'Searching';
      }
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [moreInfoData]);
  
  const groupedBrands = useMemo(() => {
    return brandsData.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      // Each item from Firestore has a 'data' array with brand names
      if (item.data && Array.isArray(item.data)) {
        item.data.forEach(brandName => {
          // Deduplicate brand names within the category
          if (!acc[item.category].includes(brandName)) {
            acc[item.category].push(brandName);
          }
        });
      }
      return acc;
    }, {});
  }, [brandsData]);
  
  // Define image picker BEFORE it's used in handleImagePress
  const { image, openLibrary } = useImagePicker();

  const showImageOptions = (imageType, index = null, isProfile = false) => {
    setSelectedImageType(imageType);
    setSelectedImageIndex(index);
    setSelectedImage(isProfile ? me?.profilePictures :
      imageType === 'public' ? me?.publicAlbum?.[index] :
        me?.privateAlbum?.[index]);
  };

  const handleImagePress = useCallback((imageType, index = null, isProfile = false) => {
    if (uploadingRef.current) {
      Alert.alert(t('UPLOADING'), '');
      return;
    }
    // Optionen: Ersetzen oder Löschen (Profil nur Ersetzen)
    const canDelete = !isProfile;
    const doReplace = async () => {
      setSelectedImageType(imageType);
      setSelectedImageIndex(index);
      // Erst Bild auswählen, dann cropper
      const result = await openLibrary();
      // Handle upload immediately if image was selected
      if (result?.uri && !uploadingRef.current && lastUploadedImageRef.current !== result.uri) {
        lastUploadedImageRef.current = result.uri;
        // Batch state updates to minimize re-renders
        startTransition(() => {
          setLocalImageUri(result.uri);
          uploadSelectedImage(result.uri, imageType, index);
        });
      }
    };
    const doDelete = async () => {
      try {
        const currentMe = meRef.current;
        console.log('Deleting image:', { imageType, index, isProfile });
        console.log('Current publicAlbum before delete:', currentMe?.publicAlbum?.length, currentMe?.publicAlbum);
        
        // Delete from Firebase Storage
        if (isProfile) {
          const basePath = `${currentMe?.id}/Public/0`;
          console.log('Deleting profile picture from storage:', basePath);
          try {
        await deleteAll(basePath);
          } catch (deleteError) {
            console.warn('Could not delete profile picture from storage:', deleteError);
          }
        } else if (imageType === 'public' || imageType === 'private') {
          // Extract path from the image URL for timestamp-based filenames
          const album = imageType === 'public' ? currentMe?.publicAlbum : currentMe?.privateAlbum;
          const picture = album?.[index];
          console.log('[Delete] Picture to delete at index', index, ':', picture);
          console.log('[Delete] Full URL:', picture?.original);
          console.log('[Delete] Full album:', album);
          if (picture?.original) {
            const url = picture.original;
            // Extract storage path: match everything between /o/ and ?
            const pathMatch = url.match(/\/o\/(.+?)\?/);
            console.log('[Delete] Path match result:', pathMatch);
            if (pathMatch) {
              const encodedPath = pathMatch[1];
              const decodedPath = decodeURIComponent(encodedPath);
              console.log('[Delete] Decoded path:', decodedPath);
              
              // Extract base path: remove 'Dexxire/' prefix and everything after last segment
              let basePath = decodedPath.replace('Dexxire/', '');
              
              // Handle both old index-based paths (e.g., "userId/Public/0") and new timestamp-based paths
              // If path contains /image or /thumbnails, remove it to get base folder
              if (basePath.includes('/image')) {
                basePath = basePath.substring(0, basePath.lastIndexOf('/image'));
              } else if (basePath.includes('/thumbnails')) {
                basePath = basePath.substring(0, basePath.lastIndexOf('/thumbnails'));
              }
              
              // For old-style paths like "userId/Public/0", we need to ensure proper deletion
              // For new-style paths like "userId/publicAlbum/timestamp_random", this will also work
              console.log('[Delete] Final base path for deleteAll:', basePath);
              try {
                await deleteAll(basePath);
                console.log('[Delete] Storage deletion completed');
              } catch (deleteError) {
                console.error('[Delete] Storage deletion failed:', deleteError);
              }
            } else {
              console.warn('[Delete] Could not extract path from URL');
            }
          } else {
            console.warn('[Delete] No original URL found for picture');
          }
        }
        
        // Get fresh user data from Ref (not local state)
        const updatedUser = JSON.parse(JSON.stringify(currentMe || {}));
        console.log('[Delete] Working with user data from Ref, publicAlbum length:', updatedUser.publicAlbum?.length);
        if (isProfile) {
          updatedUser.profilePictures = null;
        } else if (imageType === 'public') {
          if (Array.isArray(updatedUser.publicAlbum)) {
            const imageToDelete = updatedUser.publicAlbum[index];
            console.log('[Delete] Image to delete:', imageToDelete);
            console.log('[Delete] Current publicAlbum:', updatedUser.publicAlbum);
            
            if (imageToDelete && imageToDelete.original) {
              const beforeLength = updatedUser.publicAlbum.length;
              updatedUser.publicAlbum = updatedUser.publicAlbum.filter(img => {
                const shouldKeep = img.original !== imageToDelete.original;
                console.log('[Delete] Comparing:', img.original, '!==', imageToDelete.original, '=', shouldKeep);
                return shouldKeep;
              });
              console.log('[Delete] publicAlbum length after filter:', beforeLength, '->', updatedUser.publicAlbum.length);
            } else {
              console.warn('[Delete] Using fallback splice method');
              updatedUser.publicAlbum.splice(index, 1);
            }
          }
        } else if (imageType === 'private') {
          if (Array.isArray(updatedUser.privateAlbum)) {
            const imageToDelete = updatedUser.privateAlbum[index];
            if (imageToDelete && imageToDelete.original) {
              updatedUser.privateAlbum = updatedUser.privateAlbum.filter(img => img.original !== imageToDelete.original);
            } else {
              updatedUser.privateAlbum.splice(index, 1);
            }
          }
        }
        
        // Update Firestore - only update the specific fields
        const updateData = {};
        if (isProfile) {
          updateData.profilePictures = null;
        } else if (imageType === 'public') {
          updateData.publicAlbum = updatedUser.publicAlbum || [];
        } else if (imageType === 'private') {
          updateData.privateAlbum = updatedUser.privateAlbum || [];
        }
        
        console.log('[Delete] Updating Firestore with:', updateData);
        await firestore().collection('Users').doc(updatedUser.id).update(updateData);
        console.log('[Delete] Firestore update completed');
        
        // Reload fresh data from Firestore to ensure consistency - force server fetch
        const freshUserDoc = await firestore().collection('Users').doc(updatedUser.id).get({ source: 'server' });
        const freshUserData = { ...freshUserDoc.data(), id: freshUserDoc.id };
        
        console.log('[Delete] Fresh data from Firestore, publicAlbum length:', freshUserData.publicAlbum?.length);
        console.log('[Delete] Fresh publicAlbum:', freshUserData.publicAlbum);
        
        // Update Redux with fresh data - this will trigger re-render
        // Create a completely new object to force useSelector to detect the change
        const completelyNewUser = JSON.parse(JSON.stringify(freshUserData));
        dispatch(setUser({ user: completelyNewUser, dataLoaded: true }));
        
        // Force re-render by setting local state with a new reference
        setUserData(completelyNewUser);
        // Update local image states to prevent re-renders
        setProfilePictureState(completelyNewUser.profilePictures || null);
        setPublicAlbumState(completelyNewUser.publicAlbum || []);
        setPrivateAlbumState(completelyNewUser.privateAlbum || []);
        
        console.log('[Delete] Image deleted successfully');
        console.log('[Delete] Redux state updated, new publicAlbum length:', freshUserData.publicAlbum?.length);
      } catch (e) {
        console.error('Error deleting image:', e);
        Alert.alert(t('ERROR'), t('DELETE_IMAGE_ERROR'));
      }
    };
    if (canDelete) {
      Alert.alert(
        t('IMAGE_OPTIONS'),
        '',
        [
          { text: t('CANCEL'), style: 'cancel' },
          { text: t('DELETE'), style: 'destructive', onPress: () => doDelete() },
          { text: t('REPLACE'), onPress: () => doReplace() },
        ],
        { cancelable: true }
      );
      return;
    }
    // Profile image: only replace
    Alert.alert(
      t('IMAGE_OPTIONS'),
      '',
      [
        { text: t('CANCEL'), style: 'cancel' },
        { text: t('REPLACE'), onPress: () => doReplace() },
      ],
      { cancelable: true }
    );
  }, [t, openLibrary, dispatch]); // Removed 'uploading' and 'me' to prevent re-renders

  // Multi-select function for public pictures
  const selectMultiplePublicPictures = async () => {
    try {
      const currentMe = meRef.current;
      const currentPublicAlbum = currentMe?.publicAlbum || [];
      const availableSlots = maxPublicAlbumPictures - currentPublicAlbum.length;
      
      if (availableSlots === 0) {
        Alert.alert(t('ERROR'), t('MAX_PICTURES_REACHED'));
        return;
      }

      const images = await ImagePicker.openPicker({
        multiple: true,
        maxFiles: availableSlots,
        mediaType: 'photo',
        cropping: true,
        width: 1200,
        height: 1600,
        compressImageQuality: 0.8,
        includeBase64: false,
        freeStyleCropEnabled: false,
      });

      if (images && images.length > 0) {
        // Upload each image sequentially with preview
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          if (uploadingRef.current) break; // Stop if already uploading
          
          // Set local preview for this image
          startTransition(() => {
            setLocalImageUri(image.path);
            setSelectedImageType('public');
            setSelectedImageIndex(null);
          });
          
          await uploadSelectedImage(image.path, 'public', null);
        }
      }
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('Error selecting multiple public images:', error);
        Alert.alert(t('ERROR'), t('IMAGE_SELECTION_ERROR') || 'Fehler beim Auswählen der Bilder');
      }
    }
  };

  // Multi-select function for private pictures
  const selectMultiplePrivatePictures = async () => {
    try {
      const currentMe = meRef.current;
      const currentPrivateAlbum = currentMe?.privateAlbum || [];
      const availableSlots = maxPrivateAlbumPictures - currentPrivateAlbum.length;
      
      if (availableSlots === 0) {
        Alert.alert(t('ERROR'), t('MAX_PICTURES_REACHED'));
        return;
      }

      const images = await ImagePicker.openPicker({
        multiple: true,
        maxFiles: availableSlots,
        mediaType: 'photo',
        cropping: true,
        width: 1200,
        height: 1600,
        compressImageQuality: 0.8,
        includeBase64: false,
        freeStyleCropEnabled: false,
      });

      if (images && images.length > 0) {
        // Upload each image sequentially with preview
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          if (uploadingRef.current) break; // Stop if already uploading
          
          // Set local preview for this image
          startTransition(() => {
            setLocalImageUri(image.path);
            setSelectedImageType('private');
            setSelectedImageIndex(null);
          });
          
          await uploadSelectedImage(image.path, 'private', null);
        }
      }
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('Error selecting multiple private images:', error);
        Alert.alert(t('ERROR'), t('IMAGE_SELECTION_ERROR') || 'Fehler beim Auswählen der Bilder');
      }
    }
  };

  useEffect(() => {
    if (me) {
      // Initialize userData with complete user object
      setUserData({
        ...me,
        // Ensure details and settings have proper structure
        details: me?.details || {
          nationality: {},
          moreinfo: [],
          lifestyle: [],
          interests: [],
          brands: []
        },
        _settings: me?._settings || {
          units: {
            lengthType: 'Cm',
            distanceType: 'Km',
            weightType: 'Kg'
          },
          currentLang: (() => {
            // Get device language and map to our supported languages
            const deviceLang = getLocales()[0]?.languageCode?.toLowerCase() || 'en';
            const supportedLangs = ['de', 'en', 'es', 'fr'];
            return supportedLangs.includes(deviceLang) ? deviceLang : 'en';
          })(),
          showInDiscover: false,
          showCall: true,
          notifications: {
            messages: true,
            friendRequests: true,
            likes: true,
            call: true
          }
        }
      });
    }
  }, [me]);

  const styles = StyleSheet.create({
    ImportedImageContainer: {
      height: responsiveHeight(16),
      width: responsiveWidth(22),
      borderRadius: responsiveWidth(3),
      resizeMode: 'cover',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFDDDE',
    },
    imageContainer: {
      height: responsiveHeight(16),
      width: responsiveWidth(22),
      borderRadius: responsiveWidth(3),
      overflow: 'hidden',
    },
    placeholderContainer: {
      height: responsiveHeight(16),
      width: responsiveWidth(22),
      borderRadius: responsiveWidth(3),
      backgroundColor: colors.appBorderColor2,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  // Language options (codes align with i18n keys) - sorted by translated values
  const languageOptions = [
    { key: 'ARABIC', value: t('ARABIC') },
    { key: 'CHINESE', value: t('CHINESE') },
    { key: 'ENGLISH', value: t('ENGLISH') },
    { key: 'FRENCH', value: t('FRENCH') },
    { key: 'GERMAN', value: t('GERMAN') },
    { key: 'HINDI', value: t('HINDI') },
    { key: 'ITALY', value: t('ITALY') },
    { key: 'JAPANESE', value: t('JAPANESE') },
    { key: 'PORTUGUESE', value: t('PORTUGUESE') },
    { key: 'RUSSIAN', value: t('RUSSIAN') },
    { key: 'SPANISH', value: t('SPANISH') },
    { key: 'EASTINDIAN', value: t('EASTINDIAN') },
  ].sort((a, b) => a.value.localeCompare(b.value));

  const ethnicityOptions = [
    { key: 'ASIAN', value: t('ASIAN') },
    { key: 'CAUCASIAN', value: t('CAUCASIAN') },
    { key: 'EASTINDIAN', value: t('EASTINDIAN') },
    { key: 'EBONY', value: t('EBONY') },
    { key: 'EXOTIC', value: t('EXOTIC') },
    { key: 'LATIN', value: t('LATIN') },
    { key: 'MIDDLEEAST', value: t('MIDDLEEAST') },
    { key: 'NATIVEAMERICAN', value: t('NATIVEAMERICAN') },
  ].sort((a, b) => a.value.localeCompare(b.value));

  const eyeColorOptions = [
    { key: 'BROWN', value: t('BROWN') },
    { key: 'BLUE', value: t('BLUE') },
    { key: 'HAZEL', value: t('HAZEL') },
    { key: 'GREEN', value: t('GREEN') },
    { key: 'GRAY', value: t('GRAY') },
  ].sort((a, b) => a.value.localeCompare(b.value));

  const hairColorOptions = [
    { key: 'BLONDE', value: t('BLONDE') },
    { key: 'BRUNETTE', value: t('BRUNETTE') },
    { key: 'BLACK', value: t('BLACK') },
    { key: 'PLATINUM', value: t('PLATINUM') },
    { key: 'RED', value: t('RED') },
  ].sort((a, b) => a.value.localeCompare(b.value));

  const hairLengthOptions = [
    { key: 'NOHAIR', value: t('NOHAIR') },
    { key: 'SHORT', value: t('SHORT') },
    { key: 'SHOULDERLONG', value: t('SHOULDERLONG') },
    { key: 'LONG', value: t('LONG') },
    { key: 'VERYLONG', value: t('VERYLONG') },
  ].sort((a, b) => a.value.localeCompare(b.value));

  const chestCupOptions = [
    { key: 'AA', value: 'AA' },
    { key: 'A', value: 'A' },
    { key: 'B', value: 'B' },
    { key: 'C', value: 'C' },
    { key: 'D', value: 'D' },
    { key: 'DD', value: 'DD' },
    { key: 'DDD', value: 'DDD' },
    { key: 'DDDD', value: 'DDDD' },
    { key: 'E', value: 'E' },
    { key: 'F', value: 'F' },
    { key: 'G', value: 'G' },
    { key: 'H', value: 'H' },
  ];

  const ImageWithFallback = memo(({ source, style, onPress, isProfile = false, isUploading = false, localSource = null, imageType, pictureUrl }) => {
    const [imageError, setImageError] = useState(false);
    const [currentProgress, setCurrentProgress] = useState(0);

    // Poll uploadProgressRef when uploading to avoid re-rendering all images
    useEffect(() => {
      if (isUploading) {
        const interval = setInterval(() => {
          setCurrentProgress(uploadProgressRef.current);
        }, 100); // Update progress every 100ms
        return () => clearInterval(interval);
      } else {
        setCurrentProgress(0);
      }
    }, [isUploading]);

    // Create stable onPress function - use pictureUrl to find index dynamically
    const handlePress = useCallback(() => {
      if (onPress) {
        onPress();
      } else if (imageType && pictureUrl) {
        // Find current index dynamically based on URL
        const currentAlbum = imageType === 'public' ? publicAlbumState : imageType === 'private' ? privateAlbumState : [];
        const currentIndex = currentAlbum.findIndex(pic => pic.original === pictureUrl || pic.thumbnails?.big === pictureUrl);
        if (currentIndex >= 0 || isProfile) {
          handleImagePress(imageType, currentIndex >= 0 ? currentIndex : null, isProfile);
        }
      }
    }, [onPress, imageType, pictureUrl, isProfile, handleImagePress, publicAlbumState, privateAlbumState]);

    // Show local image during upload if available
    const displaySource = isUploading && localSource ? localSource : source;

    if (imageError || !displaySource?.uri) {
      return (
        <Wrapper>
          <TouchableOpacity onPress={handlePress} disabled={isUploading}>
            <Wrapper style={[styles.placeholderContainer, isProfile && { borderWidth: 2, borderColor: colors.appPrimaryColor }]}>
              <Icons.Custom
                icon={appIcons.user}
                color={colors.appTextColor2}
                size={scale(24)}
              />
            </Wrapper>
          </TouchableOpacity>
          {isUploading && (
            <Wrapper style={{ marginTop: scale(8) }}>
              <View style={{
                height: scale(4),
                backgroundColor: colors.appBorderColor2,
                borderRadius: scale(2),
                overflow: 'hidden'
              }}>
                <View style={{
                  height: '100%',
                  backgroundColor: colors.appPrimaryColor,
                  width: `${currentProgress}%`,
                  borderRadius: scale(2)
                }} />
              </View>
            </Wrapper>
          )}
        </Wrapper>
      );
    }

    return (
      <Wrapper>
        <TouchableOpacity onPress={handlePress} disabled={isUploading} activeOpacity={0.8}>
          <Image
            source={{
              ...displaySource,
              // CRITICAL: Force caching to prevent image reload on re-render
              cache: 'force-cache',
            }}
            style={[styles.imageContainer, style, isUploading && { opacity: 0.7 }]}
            onError={() => setImageError(true)}
            // CRITICAL: Prevent image flicker during re-renders
            resizeMode="cover"
            // CRITICAL: Prevent image from being unloaded when scrolled
            fadeDuration={0}
          />
        </TouchableOpacity>
        {isUploading && (
          <Wrapper style={{ marginTop: scale(8) }}>
            <View style={{
              height: scale(4),
              backgroundColor: colors.appBorderColor2,
              borderRadius: scale(2),
              overflow: 'hidden'
            }}>
              <View style={{
                height: '100%',
                backgroundColor: colors.appPrimaryColor,
                width: `${currentProgress}%`,
                borderRadius: scale(2)
              }} />
            </View>
          </Wrapper>
        )}
      </Wrapper>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    // CRITICAL: Compare pictureUrl instead of index
    // This prevents re-rendering when other images are added/removed and indices shift
    return (
      prevProps.source?.uri === nextProps.source?.uri &&
      prevProps.isUploading === nextProps.isUploading &&
      prevProps.localSource?.uri === nextProps.localSource?.uri &&
      prevProps.isProfile === nextProps.isProfile &&
      prevProps.imageType === nextProps.imageType &&
      prevProps.pictureUrl === nextProps.pictureUrl
      // Using pictureUrl (which is stable) instead of index (which shifts)
    );
  });

  // CRITICAL: Separate components for image lists to prevent re-rendering
  const PublicImagesGrid = memo(() => {
    return (
      <>
        {/* Profile Picture */}
        <ImageWithFallback
          key="profile-picture"
          source={profilePictureState?.thumbnails?.big ? { uri: profilePictureState.thumbnails.big } : null}
          imageType="profile"
          pictureUrl={profilePictureState?.original || profilePictureState?.thumbnails?.big}
          isProfile={true}
          isUploading={uploading && selectedImageType === 'profile'}
          localSource={uploading && selectedImageType === 'profile' && localImageUri ? { uri: localImageUri } : null}
        />
        {/* Public Pictures */}
        {publicAlbumState.map((picture, idx) => {
          // CRITICAL: Use ONLY the URL as key - never use index or timestamps
          const stableKey = picture.original || picture.thumbnails?.big || picture.thumbnails?.small;
          const pictureUrl = picture.original || picture.thumbnails?.big;
          const isThisUploading = uploading && selectedImageType === 'public' && selectedImageIndex === idx;
          return (
            <ImageWithFallback
              key={stableKey}
              source={{ uri: picture.thumbnails?.big || picture.original }}
              imageType="public"
              pictureUrl={pictureUrl}
              isUploading={isThisUploading}
              localSource={isThisUploading && localImageUri ? { uri: localImageUri } : null}
            />
          );
        })}
      </>
    );
  }, [profilePictureState, publicAlbumState, uploading, selectedImageType, selectedImageIndex, localImageUri]);

  const PrivateImagesGrid = memo(() => {
    return (
      <>
        {privateAlbumState.map((picture, idx) => {
          // CRITICAL: Use ONLY the URL as key - never use index or timestamps
          const stableKey = picture.original || picture.thumbnails?.big || picture.thumbnails?.small;
          const pictureUrl = picture.original || picture.thumbnails?.big;
          const isThisUploading = uploading && selectedImageType === 'private' && selectedImageIndex === idx;
          return (
            <ImageWithFallback
              key={stableKey}
              source={{ uri: picture.thumbnails?.big || picture.original }}
              imageType="private"
              pictureUrl={pictureUrl}
              isUploading={isThisUploading}
              localSource={isThisUploading && localImageUri ? { uri: localImageUri } : null}
            />
          );
        })}
      </>
    );
  }, [privateAlbumState, uploading, selectedImageType, selectedImageIndex, localImageUri]);

  const renderFirstStep = useMemo(() => {
    return (
      <Wrapper>
        <Labels.Normal Label={t('PUBLICPICTURES')} />
        <Spacer isSmall />
        <Wrapper
          marginHorizontalBase
          flexDirectionRow
          alignItemsCenter
          style={{ flexWrap: 'wrap', gap: scale(14) }}>
          <PublicImagesGrid />
          {/* Show uploading preview for new public pictures */}
          {uploading && selectedImageType === 'public' && (selectedImageIndex === null || selectedImageIndex >= publicAlbumState.length) && localImageUri && (
            <ImageWithFallback
              source={{ uri: localImageUri }}
              isUploading={true}
              localSource={{ uri: localImageUri }}
            />
          )}
          {/* Add new public picture button */}
          {!uploading && publicAlbumState.length < maxPublicAlbumPictures && (
          <Wrapper>
            <TouchableOpacity
              onPress={() => {
                selectMultiplePublicPictures();
              }}>
              <Wrapper style={styles.ImportedImageContainer}>
                <Icons.Custom
                  icon={appIcons.UploadImage}
                  color={colors.appPrimaryColor}
                  size={scale(24)}
                />
              </Wrapper>
            </TouchableOpacity>
          </Wrapper>
          )}
        </Wrapper>
        <Spacer isDoubleBase />
        <Labels.Normal Label={t('PRIVATEGALLERY')} />
        <Spacer isSmall />
        <Wrapper
          marginHorizontalBase
          flexDirectionRow
          alignItemsCenter
          style={{ flexWrap: 'wrap', gap: scale(14) }}>
          <PrivateImagesGrid />
          {/* Show uploading preview for new private pictures */}
          {uploading && selectedImageType === 'private' && (selectedImageIndex === null || selectedImageIndex >= privateAlbumState.length) && localImageUri && (
            <ImageWithFallback
              source={{ uri: localImageUri }}
              isUploading={true}
              localSource={{ uri: localImageUri }}
            />
          )}
          {/* Add new private picture button */}
          {!uploading && privateAlbumState.length < maxPrivateAlbumPictures && (
          <Wrapper>
            <TouchableOpacity
              onPress={() => {
                selectMultiplePrivatePictures();
              }}>
              <Wrapper style={styles.ImportedImageContainer}>
                <Icons.Custom
                  icon={appIcons.UploadImage}
                  color={colors.appPrimaryColor}
                  size={scale(24)}
                />
              </Wrapper>
            </TouchableOpacity>
          </Wrapper>
          )}
        </Wrapper>
        <Spacer height={responsiveHeight(10)} />
      </Wrapper>
    );
  }, [publicAlbumState, privateAlbumState, uploading, selectedImageType, localImageUri, t]);

  // Upload function called manually when image is selected
  const uploadSelectedImage = async (imageUri, imageType, imageIndex) => {
      try {
      const currentMe = meRef.current;
      if (!imageUri || !currentMe?.id || !imageType) return;
        if (uploading) return; // prevent parallel uploads
      
      // Check if maximum number of pictures is reached
      if (imageType === 'public') {
        const currentPublicAlbum = currentMe?.publicAlbum || [];
        if (currentPublicAlbum.length >= maxPublicAlbumPictures) {
          Alert.alert(t('ERROR'), t('MAX_PICTURES_REACHED'));
          return;
        }
      } else if (imageType === 'private') {
        const currentPrivateAlbum = currentMe?.privateAlbum || [];
        if (currentPrivateAlbum.length >= maxPrivateAlbumPictures) {
          Alert.alert(t('ERROR'), t('MAX_PICTURES_REACHED'));
          return;
        }
      }
      
      // Store local image URI for preview during upload
      setLocalImageUri(imageUri);
      
        setUploading(true);
        setUploadProgress(0);
      setUploadingImageIndex(imageIndex);
      
      const isPublic = imageType === 'public';
      const isPrivate = imageType === 'private';
      const isProfile = imageType === 'profile';
      
        // Use timestamp-based unique filename to avoid any conflicts
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const path = isProfile
          ? `${currentMe?.id}/Public/0/image`
          : isPublic
            ? `${currentMe?.id}/publicAlbum/${timestamp}_${randomSuffix}/image`
            : `${currentMe?.id}/privateAlbum/${timestamp}_${randomSuffix}/image`;

      // Real progress tracking with throttling to reduce re-renders
      const pictures = await uploadImage(imageUri, path, (progress) => {
        uploadProgressRef.current = progress;
        // Only update state every 10% to reduce re-renders
        if (progress % 10 === 0 || progress === 100) {
          setUploadProgress(progress);
        }
      });
        pictures.approved = false;
        pictures.uploadAt = Date.now();

        setUploadProgress(100);

        const updatedUser = JSON.parse(JSON.stringify(currentMe || {}));
        console.log('[Upload] imageIndex:', imageIndex, 'imageType:', imageType);
        console.log('[Upload] Current publicAlbum before update:', updatedUser.publicAlbum);
        
        if (isProfile) {
          updatedUser.profilePictures = pictures;
          // never touch publicAlbum here
        } else if (isPublic) {
          if (!Array.isArray(updatedUser.publicAlbum)) updatedUser.publicAlbum = [];
          
          // If imageIndex is provided, we're replacing an existing image
          if (imageIndex !== null && imageIndex !== undefined && updatedUser.publicAlbum[imageIndex]) {
            console.log('[Upload] Replacing image at index:', imageIndex);
            // Delete old image from storage before replacing
            const oldPicture = updatedUser.publicAlbum[imageIndex];
            if (oldPicture?.original) {
              const pathMatch = oldPicture.original.match(/\/o\/(.+?)\?/);
              if (pathMatch) {
                const encodedPath = pathMatch[1];
                const decodedPath = decodeURIComponent(encodedPath);
                let basePath = decodedPath.replace('Dexxire/', '');
                if (basePath.includes('/image')) {
                  basePath = basePath.substring(0, basePath.lastIndexOf('/image'));
                }
                console.log('[Upload] Deleting old image at path:', basePath);
                try {
                  await deleteAll(basePath);
                } catch (err) {
                  console.warn('[Upload] Could not delete old image:', err);
                }
              }
            }
            updatedUser.publicAlbum[imageIndex] = pictures;
          } else {
            // Otherwise, we're adding a new image
            console.log('[Upload] Adding new image to publicAlbum');
            updatedUser.publicAlbum.push(pictures);
          }
        } else {
          if (!Array.isArray(updatedUser.privateAlbum)) updatedUser.privateAlbum = [];
          
          if (imageIndex !== null && imageIndex !== undefined && updatedUser.privateAlbum[imageIndex]) {
            // Delete old image from storage before replacing
            const oldPicture = updatedUser.privateAlbum[imageIndex];
            if (oldPicture?.original) {
              const pathMatch = oldPicture.original.match(/\/o\/(.+?)\?/);
              if (pathMatch) {
                const encodedPath = pathMatch[1];
                const decodedPath = decodeURIComponent(encodedPath);
                let basePath = decodedPath.replace('Dexxire/', '');
                if (basePath.includes('/image')) {
                  basePath = basePath.substring(0, basePath.lastIndexOf('/image'));
                }
                try {
                  await deleteAll(basePath);
                } catch (err) {
                  console.warn('[Upload] Could not delete old image:', err);
                }
              }
            }
            updatedUser.privateAlbum[imageIndex] = pictures;
          } else {
            updatedUser.privateAlbum.push(pictures);
          }
        }
        
        console.log('[Upload] publicAlbum after update:', updatedUser.publicAlbum);

      // Update Firestore - only update the specific fields
        const updateData = {};
        if (isProfile) {
          updateData.profilePictures = updatedUser.profilePictures;
        } else if (isPublic) {
          updateData.publicAlbum = updatedUser.publicAlbum;
        } else if (isPrivate) {
          updateData.privateAlbum = updatedUser.privateAlbum;
        }
        
        console.log('[Upload] Updating Firestore with:', updateData);
        await firestore().collection('Users').doc(updatedUser.id).update(updateData);
      
      // Reload fresh data from Firestore
        const freshUserDoc = await firestore().collection('Users').doc(updatedUser.id).get();
        const freshUserData = { ...freshUserDoc.data(), id: freshUserDoc.id };
        
      // Batch all state updates at the end to minimize re-renders
        setUserData(freshUserData);
        // Update local image states to prevent re-renders
        setProfilePictureState(freshUserData.profilePictures || null);
        setPublicAlbumState(freshUserData.publicAlbum || []);
        setPrivateAlbumState(freshUserData.privateAlbum || []);
      dispatch(setUser({ user: freshUserData, dataLoaded: true }));
      } catch (err) {
        console.error('Error uploading image:', err);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      setUploadingImageIndex(null);
      setLocalImageUri(null);
      setNewImageToUpload(null);
      // Clear selected image to prevent re-upload
      setSelectedImage(null);
      setSelectedImageType(null);
      setSelectedImageIndex(null);
    }
  };

  // Conversion functions for units
  const getLbsFromKg = (kg) => Math.round(kg * 2.2046);
  const getKgFromLbs = (lbs) => Math.round(lbs / 2.20462);
  const getInchFromCm = (cm) => Math.round(cm / 2.54);
  const getCmFromInch = (inch) => Math.round(inch * 2.54);

  // ULTIMATE wheel - no auto-scroll, global position storage
  const wheelPositions = useRef({});
  
  const WheelInput = React.memo(({ min = 0, max = 100, step = 1, unit = '', heightPx = responsiveHeight(30), onValueChange, initialValue = null, style = {} }) => {
    const itemHeight = scale(40);
    const scrollRef = useRef(null);
    const wheelId = `wheel_${min}_${max}_${step}`;
    
    // Simple state for visual highlighting only - start with initialValue
    const [currentValue, setCurrentValue] = useState(initialValue || min);
    
    const data = useMemo(() => {
      const arr = [];
      for (let v = min; v <= max; v += step) arr.push(v);
      return arr;
    }, [min, max, step]);

    // Always scroll to initialValue when it's provided - prioritize initialValue over saved position
    useEffect(() => {
      if (scrollRef.current && initialValue !== null && initialValue !== undefined) {
        const index = data.indexOf(initialValue);
        if (index !== -1) {
          const scrollY = index * itemHeight;
          setTimeout(() => {
            scrollRef.current?.scrollTo({ y: scrollY, animated: false });
            setCurrentValue(initialValue);
            wheelPositions.current[wheelId] = scrollY; // Update saved position
          }, 100);
        }
      }
    }, [data, itemHeight, initialValue, wheelId]);

    const handleScrollEnd = (e) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = Math.round(y / itemHeight);
      const newValue = data[index];

      if (newValue !== undefined) {
        console.log('Wheel scroll ended - setting currentValue to:', newValue);
        setCurrentValue(newValue);
        wheelPositions.current[wheelId] = y; // Save position globally
        if (onValueChange) {
          onValueChange(newValue);
        }
      }
    };

    return (
      <View style={{ 
        height: heightPx, 
        width: '100%', 
        borderRadius: scale(12), 
        borderWidth: 1, 
        borderColor: colors.appBorderColor2,
        overflow: 'hidden',
        ...style 
      }}>
        {/* Selection indicator */}
        <View style={{
          position: 'absolute',
          top: (heightPx - itemHeight) / 2,
          left: 0,
          right: 0,
          height: itemHeight - scale(8),
          backgroundColor: colors.appBgColor2 || 'rgba(255,255,255,0.1)',
          borderRadius: scale(8),
          zIndex: 1,
          marginVertical: scale(4),
        }} />
        
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          snapToAlignment="start"
          decelerationRate="normal"
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          contentContainerStyle={{ 
            paddingTop: (heightPx - itemHeight) / 2,
            paddingBottom: (heightPx - itemHeight) / 2
          }}
          style={{ 
            height: heightPx,
            zIndex: 2 
          }}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          bounces={true}
          keyboardShouldPersistTaps="always"
          removeClippedSubviews={false}
          pointerEvents="auto"
          overScrollMode="always"
          scrollsToTop={false}
        >
          {data.map((v) => (
            <View key={v} style={{ 
              height: itemHeight, 
              width: '100%',
              justifyContent: 'center', 
              alignItems: 'center'
            }}>
              <Text 
                style={{ 
                  fontSize: v === currentValue ? scale(20) : scale(16),
                  fontWeight: v === currentValue ? 'bold' : 'normal',
                  color: v === currentValue ? colors.appTextColor1 : colors.appTextColor2,
                  backgroundColor: v === currentValue ? 'rgba(255,255,255,0.2)' : 'transparent',
                  textAlign: 'center',
                  borderRadius: v === currentValue ? scale(4) : 0,
                  padding: v === currentValue ? scale(2) : 0
                }}
              >
                {v}{unit ? ` ${unit}` : ''}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  });

  const SecondStep = () => {
    
    const userDataFields = useMemo(
      () => [
        { label: t('height'), placeholder: '', rightText: currentSettings?.units?.lengthType === 'Inch' ? 'inch' : 'cm', key: 'height' },
        { label: t('weight'), placeholder: '', rightText: currentSettings?.units?.weightType === 'Lbs' ? 'lbs' : 'kg', key: 'weight' },
        { label: me?.gender === 1 ? t('chest') : t('chestgirl'), placeholder: '', rightText: currentSettings?.units?.lengthType === 'Inch' ? 'inch' : 'cm', key: 'chest' },
        { label: t('waist'), placeholder: '', rightText: currentSettings?.units?.lengthType === 'Inch' ? 'inch' : 'cm', key: 'waist' },
        { label: t('hips'), placeholder: '', rightText: currentSettings?.units?.lengthType === 'Inch' ? 'inch' : 'cm', key: 'hips' },
        { label: t('eyeColor'), placeholder: '', rightText: '', key: 'eyeColor' },
        { label: t('hairColor'), placeholder: '', rightText: '', key: 'hairColor' },
        { label: t('hairLength'), placeholder: '', rightText: '', key: 'hairLength' },
      ],
      [t, me?.gender, currentSettings?.units?.lengthType, currentSettings?.units?.weightType, me?.details],
    );
    return (
      <Wrapper>
        <Labels.Normal Label={t('MYDETAILS')} />
        <Spacer isSmall />
        <Text
          isRegular
          isRegularFont
          isTextColor2
          style={{ marginHorizontal: sizes.baseMargin }}
          children={t('TELLUSABOUTYOURSELF')}
        />
        <Spacer height={responsiveHeight(6)} />
        {/* Height and Weight Bar */}
        <Wrapper
          marginHorizontalBase
          paddingHorizontalBase
          paddingVerticalSmall
          flexDirectionRow
          alignItemsCenter
          justifyContentSpaceBetween
          style={{
            borderWidth: 1,
            borderRadius: 150,
            borderColor: colors.appBorderColor2,
          }}>
          <Wrapper
            flexDirectionRow
            alignItemsCenter
            justifyContentSpaceBetween
            //backgroundColor={'red'}
            style={{ width: responsiveWidth(80) }}>
            <TouchableOpacity 
              onPress={() => {
                const newWeightType = currentSettings?.units?.weightType === 'Lbs' ? 'Kg' : 'Lbs';
                setUserData(prev => ({
                  ...prev,
                  _settings: {
                    ...prev._settings,
                    units: {
                      ...prev._settings?.units,
                      weightType: newWeightType
                    }
                  }
                }));
              }}
              style={{ paddingVertical: scale(8), paddingHorizontal: scale(12) }}
            >
            <Wrapper flexDirectionRow alignItemsCenter>
                <Text isSmall isRegularFont isTextColor2 style={{ 
                  color: currentSettings?.units?.weightType === 'Lbs' ? colors.appPrimaryColor : colors.appTextColor2,
                  fontWeight: currentSettings?.units?.weightType === 'Lbs' ? 'bold' : 'normal'
                }}>
                lbs
              </Text>
              <Wrapper marginHorizontalBase>
                <Lines.Horizontal height={responsiveHeight(2)} width={1} />
              </Wrapper>
                <Text isSmall isBoldFont isPrimaryColor style={{ 
                  color: currentSettings?.units?.weightType === 'Kg' ? colors.appPrimaryColor : colors.appTextColor2,
                  fontWeight: currentSettings?.units?.weightType === 'Kg' ? 'bold' : 'normal'
                }}>
                kg
              </Text>
            </Wrapper>
            </TouchableOpacity>
            <Wrapper marginHorizontalBase>
              <Lines.Horizontal width={responsiveWidth(10)} height={1} />
            </Wrapper>
            <TouchableOpacity 
              onPress={() => {
                const newLengthType = currentSettings?.units?.lengthType === 'Cm' ? 'Inch' : 'Cm';
                setUserData(prev => ({
                  ...prev,
                  _settings: {
                    ...prev._settings,
                    units: {
                      ...prev._settings?.units,
                      lengthType: newLengthType
                    }
                  }
                }));
              }}
              style={{ paddingVertical: scale(8), paddingHorizontal: scale(12) }}
            >
            <Wrapper flexDirectionRow alignItemsCenter>
                <Text isSmall isBoldFont isPrimaryColor style={{ 
                  color: currentSettings?.units?.lengthType === 'Cm' ? colors.appPrimaryColor : colors.appTextColor2,
                  fontWeight: currentSettings?.units?.lengthType === 'Cm' ? 'bold' : 'normal'
                }}>
                cm
              </Text>
              <Wrapper marginHorizontalBase>
                <Lines.Horizontal height={responsiveHeight(2)} width={1} />
              </Wrapper>
                <Text isSmall isRegularFont isTextColor2 style={{ 
                  color: currentSettings?.units?.lengthType === 'Inch' ? colors.appPrimaryColor : colors.appTextColor2,
                  fontWeight: currentSettings?.units?.lengthType === 'Inch' ? 'bold' : 'normal'
                }}>
                inch
              </Text>
            </Wrapper>
            </TouchableOpacity>
          </Wrapper>
        </Wrapper>
        <Spacer height={responsiveHeight(6)} />
        {/* Input User Name */}
        <TextInputs.Bordered
          InputLabel={t('USERNAME')}
          placeholder={me?.username || ''}
          value={userData.username || me?.username || ''}
          onChangeText={(text) => setUserData(prev => ({ ...prev, username: text }))}
        />
        <Spacer height={responsiveHeight(6)} />
        {/* Language - multi select like old project */}
        <Wrapper marginHorizontalBase>
          <Text isSmall isMediumFont>{t('LANGUAGE')}</Text>
          <Spacer isTiny />
        </Wrapper>
        <Wrapper marginHorizontalBase>
          <TouchableOpacity
            onPress={() => {
              if (!uploading) setLanguagePickerVisible(true);
            }}
          >
            <Wrapper
              style={[
                appStyles.inputContainerBorderd,
                {
                  borderRadius: sizes.inputRadius,
                  borderWidth: 1.5,
                  borderColor: colors.appBgColor3,
                  marginHorizontal: 0,
                },
              ]}
            >
              <Wrapper marginHorizontalBase style={{ height: sizes.inputHeight, justifyContent: 'center' }}>
                <Text isMedium style={{ color: colors.appTextColor2 }}>
                  {(() => {
                    const current = Array.isArray(userData.languages) ? userData.languages : [];
                    if (!current.length) return t('CHOOSELANGUAGE');
                    const labels = current.map(k => {
                      const opt = languageOptions.find(o => o.key === k);
                      return opt ? opt.value : k;
                    });
                    return labels.join(', ');
                  })()}
                </Text>
              </Wrapper>
            </Wrapper>
          </TouchableOpacity>
        </Wrapper>
        <Spacer isBasic />
        {/* Age */}
        <TextInputs.Bordered
          InputLabel={t('fakeAge')}
          placeholder={me?.fakeAge?.toString() || '25'}
          value={userData.fakeAge?.toString() || me?.fakeAge?.toString() || ''}
          onChangeText={(text) => setUserData(prev => ({ ...prev, fakeAge: parseInt(text) || 0 }))}
        />
        <Spacer isBasic />
        {/* Nationality - select */}
        <Wrapper marginHorizontalBase>
          <Text isSmall isMediumFont>{t('nationality')}</Text>
          <Spacer isTiny />
        </Wrapper>
        <Wrapper marginHorizontalBase>
          <TouchableOpacity 
            onPress={() => setNationalityPickerVisible(true)}
              style={[
                appStyles.inputContainerBorderd,
                {
                  borderRadius: sizes.inputRadius,
                  borderWidth: 1.5,
                  borderColor: colors.appBgColor3,
                  marginHorizontal: 0,
                height: sizes.inputHeight,
                justifyContent: 'center',
                paddingHorizontal: 16,
                },
              ]}
            activeOpacity={0.7}
            >
                <Text isMedium style={{ color: colors.appTextColor2 }}>
                  {userData.details?.nationality?.country || t('SELECT_COUNTRY')}
                </Text>
          </TouchableOpacity>
        </Wrapper>
        <Spacer isBasic />
        {/* Ethnicity - select */}
        <Wrapper marginHorizontalBase>
          <Text isSmall isMediumFont>{t('ethnicity')}</Text>
          <Spacer isTiny />
        </Wrapper>
        <Wrapper marginHorizontalBase>
          <TouchableOpacity 
            onPress={() => setEthnicityPickerVisible(true)}
              style={[
                appStyles.inputContainerBorderd,
                {
                  borderRadius: sizes.inputRadius,
                  borderWidth: 1.5,
                  borderColor: colors.appBgColor3,
                  marginHorizontal: 0,
                height: sizes.inputHeight,
                justifyContent: 'center',
                paddingHorizontal: 16,
                },
              ]}
            activeOpacity={0.7}
            >
                <Text isMedium style={{ color: colors.appTextColor2 }}>
                  {userData.ethnicity ? t(userData.ethnicity) : t('PLEASECHOOSE')}
                </Text>
          </TouchableOpacity>
        </Wrapper>
        <Spacer isBasic />
        <Wrapper flexDirectionRow style={{ flexWrap: 'wrap' }}>
          {userDataFields.map((item, index) => {
            const measurementKeys = ['height', 'weight', 'chest', 'waist', 'hips'];
            const isMeasurement = measurementKeys.includes(item.key);
            const isSimpleSelect = ['eyeColor', 'hairColor', 'hairLength'].includes(item.key);

            if (isMeasurement) {
              const ranges = {
                height: { min: 130, max: 220, step: 1, unit: 'cm' },
                weight: { min: 30, max: 200, step: 1, unit: 'kg' },
                chest:  { min: 60, max: 140, step: 1, unit: 'cm' },
                waist:  { min: 50, max: 130, step: 1, unit: 'cm' },
                hips:   { min: 60, max: 140, step: 1, unit: 'cm' },
              };
              const range = ranges[item.key];
              const isInch = currentSettings?.units?.lengthType === 'Inch';
              const isLbs = currentSettings?.units?.weightType === 'Lbs';
              
              
              // Dynamic unit based on settings
              let dynamicUnit = range.unit;
              if (item.key === 'height' || ['chest', 'waist', 'hips'].includes(item.key)) {
                dynamicUnit = isInch ? 'inch' : 'cm';
              } else if (item.key === 'weight') {
                dynamicUnit = isLbs ? 'lbs' : 'kg';
              }
              
              // Get current value in the correct unit - NO DEFAULTS
              let currentVal = null;
              
              // First check userData.details (most recent), then me.details
              const detailsSource = userData?.details || me?.details;
              if (detailsSource?.[item.key] && typeof detailsSource[item.key] === 'object') {
                // If it's an object with both units (like {cm: 130, inch: 33})
                const value = detailsSource[item.key][dynamicUnit];
                currentVal = value ? Math.round(value) : null;
              } else {
                // Fallback to old format - but no defaults
                const value = (userData?.details && Number(userData.details[item.key])) ||
                            (me?.details && Number(me.details[item.key])) ||
                            (Number(userData[item.key]));
                currentVal = value || null;
              }
              

              const openMeasurement = () => {
                // Don't open measurement pickers if user is not logged in
                if (!me) {
                  return;
                }
                
                if (item.key === 'height') {
                  // Reset temp value when opening
                  const isInch = currentSettings?.units?.lengthType === 'Inch';
                  const min = isInch ? getInchFromCm(130) : 130;
                  const currentValue = me?.details?.height?.[isInch ? 'inch' : 'cm'];
                  
                  let defaultValue;
                  if (currentValue) {
                    defaultValue = Math.round(currentValue);
                  } else {
                    // Default values based on gender like in old project
                    const isMale = me?.gender === 1;
                    const defaultCm = isMale ? 180 : 165;
                    defaultValue = isInch ? Math.round(getInchFromCm(defaultCm)) : defaultCm;
                  }
                  
                  setTempHeightValue(defaultValue);
                  setHeightPickerVisible(true);
                }
                else if (item.key === 'weight') {
                  // Reset temp value when opening with gender-based defaults
                  const isLbs = currentSettings?.units?.weightType === 'Lbs';
                  const currentValue = me?.details?.weight?.[isLbs ? 'lbs' : 'kg'];
                  let defaultValue;
                  
                  if (currentValue) {
                    defaultValue = Math.round(currentValue);
                  } else {
                    // Default values based on gender like in old project
                    const isMale = me?.gender === 1;
                    const defaultKg = isMale ? 80 : 60;
                    defaultValue = isLbs ? Math.round(getLbsFromKg(defaultKg)) : defaultKg;
                  }
                  
                  setTempWeightValue(defaultValue);
                  setWeightPickerVisible(true);
                }
                else if (item.key === 'chest') {
                  // Reset temp value when opening with gender-based defaults
                  const isInch = currentSettings?.units?.lengthType === 'Inch';
                  const currentValue = me?.details?.chest?.[isInch ? 'inch' : 'cm'];
                  let defaultValue;
                  
                  if (currentValue) {
                    defaultValue = Math.round(currentValue);
                  } else {
                    // Default values based on gender like in old project
                    const isMale = me?.gender === 1;
                    const defaultCm = isMale ? 90 : 90; // Both genders get 90cm default like in old project
                    defaultValue = isInch ? Math.round(getInchFromCm(defaultCm)) : defaultCm;
                  }
                  
                  setTempChestValue(defaultValue);
                  setChestPickerVisible(true);
                }
                else if (item.key === 'waist') {
                  // Reset temp value when opening with gender-based defaults
                  const isInch = currentSettings?.units?.lengthType === 'Inch';
                  const currentValue = me?.details?.waist?.[isInch ? 'inch' : 'cm'];
                  let defaultValue;
                  
                  if (currentValue) {
                    defaultValue = Math.round(currentValue);
                  } else {
                    // Default values based on gender like in old project
                    const isMale = me?.gender === 1;
                    const defaultCm = isMale ? 90 : 60; // Men 90cm, Women 60cm like in old project
                    defaultValue = isInch ? Math.round(getInchFromCm(defaultCm)) : defaultCm;
                  }
                  
                  setTempWaistValue(defaultValue);
                  setWaistPickerVisible(true);
                }
                else if (item.key === 'hips') {
                  // Reset temp value when opening with gender-based defaults
                  const isInch = currentSettings?.units?.lengthType === 'Inch';
                  const currentValue = me?.details?.hips?.[isInch ? 'inch' : 'cm'];
                  let defaultValue;
                  
                  if (currentValue) {
                    defaultValue = Math.round(currentValue);
                  } else {
                    // Default values based on gender like in old project
                    const isMale = me?.gender === 1;
                    const defaultCm = isMale ? 110 : 90; // Men 110cm, Women 90cm like in old project
                    defaultValue = isInch ? Math.round(getInchFromCm(defaultCm)) : defaultCm;
                  }
                  
                  setTempHipsValue(defaultValue);
                  setHipsPickerVisible(true);
                }
              };

              return (
                <Wrapper
                  key={index}
                  style={{
                    marginBottom: sizes.baseMargin,
                    width: responsiveWidth(50),
                  }}>
                  <Wrapper marginHorizontalBase>
                    <Text isSmall isMediumFont>{item?.label}</Text>
                    <Spacer isTiny />
                  </Wrapper>
                  <Wrapper marginHorizontalBase>
                    <TouchableOpacity 
                      onPress={openMeasurement}
                        style={[
                          appStyles.inputContainerBorderd,
                          {
                            borderRadius: sizes.inputRadius,
                            borderWidth: 1.5,
                            borderColor: colors.appBgColor3,
                            marginHorizontal: 0,
                          height: sizes.inputHeight,
                          justifyContent: 'center',
                          paddingHorizontal: 16,
                          },
                        ]}
                      activeOpacity={0.7}
                      >
                          <Text isMedium style={{ color: colors.appTextColor2 }}>
                            {currentVal ? `${currentVal} ${dynamicUnit}` : t('PLEASECHOOSE')}
                          </Text>
                    </TouchableOpacity>
                  </Wrapper>
                </Wrapper>
              );
            }

            if (isSimpleSelect) {
              return (
                <Wrapper
                  key={index}
                  style={{
                    marginBottom: sizes.baseMargin,
                    width: responsiveWidth(50),
                  }}>
                  <Wrapper marginHorizontalBase>
                    <Text isSmall isMediumFont>{item?.label}</Text>
                    <Spacer isTiny />
                  </Wrapper>
                  <Wrapper marginHorizontalBase>
                    <TouchableOpacity 
                      onPress={() => {
                      if (item.key === 'eyeColor') setEyeColorPickerVisible(true);
                      else if (item.key === 'hairColor') setHairColorPickerVisible(true);
                      else if (item.key === 'hairLength') setHairLengthPickerVisible(true);
                      }}
                        style={[
                          appStyles.inputContainerBorderd,
                          {
                            borderRadius: sizes.inputRadius,
                            borderWidth: 1.5,
                            borderColor: colors.appBgColor3,
                            marginHorizontal: 0,
                          height: sizes.inputHeight,
                          justifyContent: 'center',
                          paddingHorizontal: 16,
                          },
                        ]}
                      activeOpacity={0.7}
                      >
                          <Text isMedium style={{ color: colors.appTextColor2 }}>
                            {userData[item.key] ? t(userData[item.key]) : t('PLEASECHOOSE')}
                          </Text>
                    </TouchableOpacity>
                  </Wrapper>
                </Wrapper>
              );
            }
            
            // Regular input field
            return (
              <Wrapper
                key={index}
                style={{
                  marginBottom: sizes.baseMargin,
                  width: responsiveWidth(50),
                }}>
                <TextInputs.Bordered
                  InputLabel={item?.label}
                  placeholder={(() => {
                    // For measurement fields, show the correct value as placeholder since TextInputs.Bordered uses placeholder as value
                    if (['height', 'chest', 'waist', 'hips', 'weight'].includes(item.key)) {
                      const isInch = currentSettings?.units?.lengthType === 'Inch';
                      const isLbs = currentSettings?.units?.weightType === 'Lbs';
                      const currentValue = me?.details?.[item.key];
                      
                      if (currentValue) {
                        if (['height', 'chest', 'waist', 'hips'].includes(item.key)) {
                          const value = isInch ? Math.round(currentValue.inch || 0) : Math.round(currentValue.cm || 0);
                          return `${value}`;
                        }
                        if (item.key === 'weight') {
                          const value = isLbs ? Math.round(currentValue.lbs || 0) : Math.round(currentValue.kg || 0);
                          return `${value}`;
                        }
                      }
                      return '';
                    }
                    // For other fields, use the existing logic
                    return getUserDetail(item.key, me, me?._settings?.currentLang || 'de', t) || '';
                  })()}
                  containerStyle={{ width: responsiveWidth(40) }}
                  value={(() => {
                    // For measurement fields, show the value based on current unit settings
                    if (['height', 'chest', 'waist', 'hips'].includes(item.key)) {
                      const isInch = currentSettings?.units?.lengthType === 'Inch';
                      const currentValue = me?.details?.[item.key];
                      if (currentValue) {
                        const value = isInch ? Math.round(currentValue.inch || 0) : Math.round(currentValue.cm || 0);
                        return `${value}`;
                      }
                      return '';
                    }
                    if (item.key === 'weight') {
                      const isLbs = currentSettings?.units?.weightType === 'Lbs';
                      const currentValue = me?.details?.[item.key];
                      if (currentValue) {
                        const value = isLbs ? Math.round(currentValue.lbs || 0) : Math.round(currentValue.kg || 0);
                        return `${value}`;
                      }
                      return '';
                    }
                    // For other fields, use the existing logic
                    return userData[item.key] || getUserDetail(item.key, me, me?._settings?.currentLang || 'de', t) || '';
                  })()}
                  onChangeText={(['height', 'chest', 'waist', 'hips', 'weight'].includes(item.key)) ? undefined : (text) => setUserData(prev => ({ ...prev, [item.key]: text }))}
                  editable={!['height', 'chest', 'waist', 'hips', 'weight'].includes(item.key)}
                  right={
                    item?.rightText ? (
                      <Text isSmall isBoldFont isPrimaryColor>
                        {item?.rightText}
                      </Text>
                    ) : null
                  }
                />
              </Wrapper>
            );
          })}
        </Wrapper>
        <Spacer isBasic />
      </Wrapper>
    );
  };
  const ThirdStep = () => {
    return (
      <Wrapper style={{}}>
        <Labels.Normal Label={t('ABOUTME_SINGLE_LINE')} />
        <Spacer isSmall />
        <Text
          isRegular
          isRegularFont
          isTextColor2
          style={{ marginHorizontal: sizes.baseMargin }}
          children={t('TELLUSSOMETHING')}
        />
        <Spacer isBasic />
        {/* Who i am */}
        <TextInputs.Bordered
          InputLabel={t('WHOIAM')}
          placeholder={t('WHOIAM')}
          right={
            <Icons.WithText
              direction={'row-reverse'}
              customIcon={appIcons.Forward}
              iconSize={scale(24)}
              text={`${userData.details?.moreinfo?.length || 0} ${t('SELECTED')}`}
              textStyle={{
                fontSize: fontSizes.regular,
                color: colors.appTextColor2,
              }}
            />
          }
          onPress={() => setMoreInfos(true)}
        />
        <Spacer isBasic />
        {/* Life Style */}
        <TextInputs.Bordered
          InputLabel={t('LIFESTYLE')}
          placeholder={t('LIFESTYLE')}
          right={
            <Icons.WithText
              direction={'row-reverse'}
              customIcon={appIcons.Forward}
              iconSize={scale(24)}
              text={`${userData.details?.lifestyle?.length || 0} ${t('SELECTED')}`}
              textStyle={{
                fontSize: fontSizes.regular,
                color: colors.appTextColor2,
              }}
            />
          }
          onPress={() => setLifeStyle(true)}
        />
        <Spacer isBasic />
        {/* What do I Love */}
        <TextInputs.Bordered
          InputLabel={t('WHATDOILOVE')}
          placeholder={t('WHATDOILOVE')}
          right={
            <Icons.WithText
              direction={'row-reverse'}
              customIcon={appIcons.Forward}
              iconSize={scale(24)}
              text={`${userData.details?.interests?.length || 0} ${t('SELECTED')}`}
              textStyle={{
                fontSize: fontSizes.regular,
                color: colors.appTextColor2,
              }}
            />
          }
          onPress={() => setInterests(true)}
        />
        <Spacer isBasic />
        {/* I Love */}
        <TextInputs.Bordered
          InputLabel={t('MYBRANDS')}
          placeholder={t('MYBRANDS')}
          right={
            <Icons.WithText
              direction={'row-reverse'}
              customIcon={appIcons.Forward}
              iconSize={scale(24)}
              text={`${userData.details?.brands?.length || 0} ${t('SELECTED')}`}
              textStyle={{
                fontSize: fontSizes.regular,
                color: colors.appTextColor2,
              }}
            />
          }
          onPress={() => setILove(true)}
        />

        <Spacer isBasic />
      </Wrapper>
    );
  };

  // Removed onScroll handler to prevent re-renders on scroll

  const saveUserData = useCallback(async () => {
    try {
      // Only apply non-undefined values from userData to preserve me's properties
      const userToSave = { ...me }; // Start with complete current user
      
      // List of fields that are managed separately and should NOT be overwritten from userData
      const excludedFields = ['publicAlbum', 'privateAlbum', 'profilePictures'];
      
      // Only update properties that have actual values in userData
      // EXCEPT for fields that are managed separately (like images)
      Object.keys(userData).forEach(key => {
        if (!excludedFields.includes(key) && userData[key] !== undefined && userData[key] !== null) {
          userToSave[key] = userData[key];
        }
      });
      
      await firestore().collection('Users').doc(userToSave.id).update(userToSave);
      dispatch(setUser({ user: userToSave, dataLoaded: true }));
      toggle();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }, [me, userData, dispatch, toggle]);
  return (
    <>
      <PopupPrimary
        visible={visible}
        isBlur
        disableSwipe
        toggle={toggle}
        wrapContentInScroll={false}
        containerStyle={{ maxHeight: responsiveHeight(75) }}
        children={
        <View 
          pointerEvents={MoreInfos || LifeStyle || Interests || ILove ? 'box-none' : 'auto'}
          style={MoreInfos || LifeStyle || Interests || ILove ? {height: responsiveHeight(90)} : {}}>
          <ScrollView
            ref={scrollViewRef}
            scrollEnabled={!MoreInfos && !LifeStyle && !Interests && !ILove}
            showsVerticalScrollIndicator={false}
          >
                <Labels.ModalLabelWithCross
                  Title={t('EDITPROFILE')}
                  onPress={toggle}
                />
                {/* Language Picker Modal */}
            <PopupPrimary
              visible={languagePickerVisible}
              toggle={() => setLanguagePickerVisible(false)}
              headerTitle={t('LANGUAGE')}
              backdropOpacity={0.4}
              isBlur
              onPressClose={() => setLanguagePickerVisible(false)}
              headerRight={
                <TouchableOpacity
                  onPress={() => setLanguagePickerVisible(false)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                >
                  <Text isSmallTitle style={{ color: colors.appTextColor1 }}>X</Text>
                </TouchableOpacity>
              }
              scrollEnabled={false}
              headerStyle={{ paddingTop: sizes.marginVertical }}
              containerStyle={{ paddingBottom: sizes.marginVertical * 2 }}
            >
              <Wrapper marginHorizontalBase>
                {languageOptions.map((opt, idx) => {
                  const current = Array.isArray(userData?.languages) ? userData.languages : [];
                  const selected = current.includes(opt.key);
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setUserData(prev => {
                          const curr = Array.isArray(prev.languages) ? prev.languages : [];
                          const next = selected ? curr.filter(k => k !== opt.key) : [...curr, opt.key];
                          return { ...prev, languages: next };
                        });
                      }}
                    >
                      <Wrapper
                        flexDirectionRow
                        alignItemsCenter
                        justifyContentSpaceBetween
                        paddingVerticalSmall
                      >
                        <Text>{opt.value}</Text>
                        <Text isPrimaryColor>{selected ? '✓' : ''}</Text>
                      </Wrapper>
                    </TouchableOpacity>
                  );
                })}
                <Spacer isSmall />
                <Buttons.Colored
                  text={t('APPLY')}
                  onPress={() => setLanguagePickerVisible(false)}
                />
              </Wrapper>
            </PopupPrimary>
            {/* Ethnicity Picker */}
            <PopupPrimary
              visible={ethnicityPickerVisible}
              toggle={() => setEthnicityPickerVisible(false)}
              headerTitle={t('ethnicity')}
              backdropOpacity={0.4}
              isBlur
              onPressClose={() => setEthnicityPickerVisible(false)}
              headerRight={
                <TouchableOpacity
                  onPress={() => setEthnicityPickerVisible(false)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                >
                  <Text isSmallTitle style={{ color: colors.appTextColor1 }}>X</Text>
                </TouchableOpacity>
              }
              scrollEnabled={false}
              headerStyle={{ paddingTop: sizes.marginVertical }}
              containerStyle={{ paddingBottom: sizes.marginVertical * 2 }}
            >
              <Wrapper marginHorizontalBase>
                {ethnicityOptions.map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setUserData(prev => ({ ...prev, ethnicity: opt.key }));
                      setEthnicityPickerVisible(false);
                    }}
                  >
                    <Wrapper paddingVerticalSmall>
                      <Text>{opt.value}</Text>
                    </Wrapper>
                  </TouchableOpacity>
                ))}
              </Wrapper>
            </PopupPrimary>

            {/* Eye Color Picker */}
            <PopupPrimary
              visible={eyeColorPickerVisible}
              toggle={() => setEyeColorPickerVisible(false)}
              headerTitle={t('eyeColor')}
              backdropOpacity={0.4}
              isBlur
              onPressClose={() => setEyeColorPickerVisible(false)}
              headerRight={
                <TouchableOpacity
                  onPress={() => setEyeColorPickerVisible(false)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                >
                  <Text isSmallTitle style={{ color: colors.appTextColor1 }}>X</Text>
                </TouchableOpacity>
              }
              scrollEnabled={false}
              headerStyle={{ paddingTop: sizes.marginVertical }}
              containerStyle={{ paddingBottom: sizes.marginVertical * 2 }}
            >
              <Wrapper marginHorizontalBase>
                {eyeColorOptions.map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setUserData(prev => ({ ...prev, eyeColor: opt.key }));
                      setEyeColorPickerVisible(false);
                    }}
                  >
                    <Wrapper paddingVerticalSmall>
                      <Text>{opt.value}</Text>
                    </Wrapper>
                  </TouchableOpacity>
                ))}
              </Wrapper>
            </PopupPrimary>

            {/* Height Picker */}
            <PopupPrimary
              visible={heightPickerVisible && !!me}
              toggle={() => {
                // Just close without applying - user should use Apply button
                setHeightPickerVisible(false);
              }}
              headerTitle={t('height')}
              backdropOpacity={0.4}
              isBlur
              onPressClose={() => {
                // Just close without applying - user should use Apply button
                setHeightPickerVisible(false);
              }}
              headerRight={
                <TouchableOpacity
                  onPress={() => {
                    // Just close without applying - user should use Apply button
                    setHeightPickerVisible(false);
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                >
                  <Text isSmallTitle style={{ color: colors.appTextColor1 }}>X</Text>
                </TouchableOpacity>
              }
              scrollEnabled={false}
              headerStyle={{ paddingTop: sizes.marginVertical }}
              rightContainerStyle={{ top: sizes.marginVertical }}
              containerStyle={{ 
                height: responsiveHeight(50), 
                paddingBottom: sizes.marginVertical * 2,
                paddingHorizontal: 0
              }}
              wrapContentInScroll={false}
              disableSwipe={true}
            >
              <Wrapper style={{ flex: 1, paddingHorizontal: 0 }}>
                <Wrapper flexDirectionRow alignItemsCenter justifyContentCenter style={{ height: '100%', zIndex: 1000, pointerEvents: 'auto' }}>
                  <WheelInput
                    key={`height-wheel-${tempHeightValue}-${heightPickerVisible}`}
                    onChange={(value) => {
                      // Don't update immediately - just store temp value
                    }}
                    onValueChange={(value) => {
                      setTempHeightValue(value);
                    }}
                    min={currentSettings?.units?.lengthType === 'Inch' ? getInchFromCm(130) : 130}
                    max={currentSettings?.units?.lengthType === 'Inch' ? getInchFromCm(220) : 220}
                    step={1}
                    unit={currentSettings?.units?.lengthType === 'Inch' ? 'inch' : 'cm'}
                    initialValue={tempHeightValue || (me?.gender === 1 
                      ? (currentSettings?.units?.lengthType === 'Inch' ? getInchFromCm(180) : 180)
                      : (currentSettings?.units?.lengthType === 'Inch' ? getInchFromCm(165) : 165)
                    )}
                    heightPx={responsiveHeight(20)}
                    style={{ width: '100%', height: '100%', zIndex: 1000 }}
                  />
                </Wrapper>
              </Wrapper>
              {/* Footer with Apply Button */}
              <Wrapper style={{ 
                paddingHorizontal: sizes.baseMargin, 
                paddingVertical: sizes.smallMargin,
                borderTopWidth: 1,
                borderTopColor: colors.appBorderColor2
              }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.appPrimaryColor,
                    paddingVertical: sizes.smallMargin,
                    paddingHorizontal: sizes.baseMargin,
                    borderRadius: sizes.inputRadius,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onPress={() => {
                    // Apply the temporary value when pressing apply
                    if (tempHeightValue !== null && tempHeightValue !== undefined && tempHeightValue > 0) {
                      const isInch = currentSettings?.units?.lengthType === 'Inch';
                      setUserData(prev => ({
                        ...prev,
                        details: { 
                          ...prev.details, 
                          height: isInch ? { inch: tempHeightValue, cm: getCmFromInch(tempHeightValue) } : { cm: tempHeightValue, inch: getInchFromCm(tempHeightValue) }
                        },
                      }));
                    }
                    setHeightPickerVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ 
                    color: 'white', 
                    fontSize: scale(16), 
                    fontWeight: 'bold' 
                  }}>
                    {t('APPLY')}
                  </Text>
                </TouchableOpacity>
              </Wrapper>
            </PopupPrimary>

            {/* Weight Picker */}
            <PopupPrimary
              visible={weightPickerVisible && !!me}
              toggle={() => setWeightPickerVisible(false)}
              headerTitle={t('weight')}
              backdropOpacity={0.4}
              isBlur
              onPressClose={() => setWeightPickerVisible(false)}
              headerRight={
                <TouchableOpacity
                  onPress={() => setWeightPickerVisible(false)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                >
                  <Text isSmallTitle style={{ color: colors.appTextColor1 }}>X</Text>
                </TouchableOpacity>
              }
              scrollEnabled={false}
              headerStyle={{ paddingTop: sizes.marginVertical }}
              rightContainerStyle={{ top: sizes.marginVertical }}
              containerStyle={{ 
                height: responsiveHeight(50), 
                paddingBottom: sizes.marginVertical * 2,
                paddingHorizontal: 0
              }}
              wrapContentInScroll={false}
              disableSwipe={true}
            >
              <Wrapper style={{ flex: 1, paddingHorizontal: 0 }}>
                <Wrapper flexDirectionRow alignItemsCenter justifyContentCenter style={{ height: '100%', zIndex: 1000, pointerEvents: 'auto' }}>
                  <WheelInput
                    initialValue={tempWeightValue || (me?.gender === 1 
                      ? (currentSettings?.units?.weightType === 'Lbs' ? getLbsFromKg(80) : 80)
                      : (currentSettings?.units?.weightType === 'Lbs' ? getLbsFromKg(60) : 60)
                    )}
                    min={currentSettings?.units?.weightType === 'Lbs' ? getLbsFromKg(30) : 30}
                    max={currentSettings?.units?.weightType === 'Lbs' ? getLbsFromKg(200) : 200}
                    step={1}
                    unit={currentSettings?.units?.weightType === 'Lbs' ? 'lbs' : 'kg'}
                    heightPx={responsiveHeight(20)}
                    style={{ width: '100%', height: '100%', zIndex: 1000 }}
                    onValueChange={(value) => {
                      setTempWeightValue(value);
                    }}
                  />
                </Wrapper>
              </Wrapper>
              {/* Footer with Apply Button */}
              <Wrapper style={{ 
                paddingHorizontal: sizes.baseMargin, 
                paddingVertical: sizes.smallMargin,
                borderTopWidth: 1,
                borderTopColor: colors.appBorderColor2
              }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.appPrimaryColor,
                    paddingVertical: sizes.smallMargin,
                    paddingHorizontal: sizes.baseMargin,
                    borderRadius: sizes.inputRadius,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onPress={() => {
                    const isLbs = currentSettings?.units?.weightType === 'Lbs';
                    setUserData(prev => ({
                      ...prev,
                      details: {
                        ...prev.details,
                        weight: {
                          [isLbs ? 'lbs' : 'kg']: tempWeightValue,
                          [isLbs ? 'kg' : 'lbs']: isLbs ? getKgFromLbs(tempWeightValue) : getLbsFromKg(tempWeightValue)
                        }
                      }
                    }));
                    setWeightPickerVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ 
                    color: 'white', 
                    fontSize: scale(16), 
                    fontWeight: 'bold' 
                  }}>
                    {t('APPLY')}
                  </Text>
                </TouchableOpacity>
              </Wrapper>
            </PopupPrimary>

            {/* Chest Picker */}
            <PopupPrimary
              visible={chestPickerVisible && !!me}
              toggle={() => setChestPickerVisible(false)}
              headerTitle={t('chest')}
              backdropOpacity={0.4}
              isBlur
              onPressClose={() => setChestPickerVisible(false)}
              headerRight={
                <TouchableOpacity
                  onPress={() => setChestPickerVisible(false)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                >
                  <Text isSmallTitle style={{ color: colors.appTextColor1 }}>X</Text>
                </TouchableOpacity>
              }
              scrollEnabled={false}
              headerStyle={{ paddingTop: sizes.marginVertical }}
              rightContainerStyle={{ top: sizes.marginVertical }}
              containerStyle={{ 
                height: responsiveHeight(50), 
                paddingBottom: sizes.marginVertical * 2,
                paddingHorizontal: 0
              }}
              wrapContentInScroll={false}
              disableSwipe={true}
            >
              <Wrapper style={{ flex: 1, paddingHorizontal: 0 }}>
                <Wrapper flexDirectionRow alignItemsCenter justifyContentCenter style={{ height: '100%', zIndex: 1000, pointerEvents: 'auto' }}>
                  <WheelInput
                    initialValue={tempChestValue || (currentSettings?.units?.lengthType === 'Inch' ? getInchFromCm(90) : 90)}
                    onValueChange={(value) => {
                      setTempChestValue(value);
                    }}
                    min={currentSettings?.units?.lengthType === 'Inch' ? getInchFromCm(60) : 60}
                    max={currentSettings?.units?.lengthType === 'Inch' ? getInchFromCm(140) : 140}
                    step={1}
                    unit={currentSettings?.units?.lengthType === 'Inch' ? 'inch' : 'cm'}
                    heightPx={responsiveHeight(20)}
                    style={{ width: '100%', height: '100%', zIndex: 1000 }}
                  />
                </Wrapper>
              </Wrapper>
              {/* Footer with Apply Button */}
              <Wrapper style={{ 
                paddingHorizontal: sizes.baseMargin, 
                paddingVertical: sizes.smallMargin,
                borderTopWidth: 1,
                borderTopColor: colors.appBorderColor2
              }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.appPrimaryColor,
                    paddingVertical: sizes.smallMargin,
                    paddingHorizontal: sizes.baseMargin,
                    borderRadius: sizes.inputRadius,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onPress={() => {
                    const isInch = currentSettings?.units?.lengthType === 'Inch';
                    setUserData(prev => ({
                      ...prev,
                      details: {
                        ...prev.details,
                        chest: {
                          [isInch ? 'inch' : 'cm']: tempChestValue,
                          [isInch ? 'cm' : 'inch']: isInch ? getCmFromInch(tempChestValue) : getInchFromCm(tempChestValue)
                        }
                      }
                    }));
                    setChestPickerVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ 
                    color: 'white', 
                    fontSize: scale(16), 
                    fontWeight: 'bold' 
                  }}>
                    {t('APPLY')}
                  </Text>
                </TouchableOpacity>
              </Wrapper>
            </PopupPrimary>

            {/* Waist Picker */}
            <PopupPrimary
              visible={waistPickerVisible && !!me}
              toggle={() => setWaistPickerVisible(false)}
              headerTitle={t('waist')}
              backdropOpacity={0.4}
              isBlur
              onPressClose={() => setWaistPickerVisible(false)}
              headerRight={
                <TouchableOpacity
                  onPress={() => setWaistPickerVisible(false)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                >
                  <Text isSmallTitle style={{ color: colors.appTextColor1 }}>X</Text>
                </TouchableOpacity>
              }
              scrollEnabled={false}
              headerStyle={{ paddingTop: sizes.marginVertical }}
              rightContainerStyle={{ top: sizes.marginVertical }}
              containerStyle={{ 
                height: responsiveHeight(50), 
                paddingBottom: sizes.marginVertical * 2,
                paddingHorizontal: 0
              }}
              wrapContentInScroll={false}
              disableSwipe={true}
            >
              <Wrapper style={{ flex: 1, paddingHorizontal: 0 }}>
                <Wrapper flexDirectionRow alignItemsCenter justifyContentCenter style={{ height: '100%', zIndex: 1000, pointerEvents: 'auto' }}>
                  <WheelInput
                    initialValue={tempWaistValue || (() => {
                      const isInch = currentSettings?.units?.lengthType === 'Inch';
                      const value = safeMe?.details?.waist?.[isInch ? 'inch' : 'cm'];
                      if (value) {
                        return Math.round(value);
                      }
                      // Default values based on gender (Männer 90cm, Frauen 60cm)
                      const isMale = safeMe?.details?.gender === 'male' || safeMe?.details?.gender === 'M';
                      const defaultCm = isMale ? 90 : 60;
                      return isInch ? Math.round(getInchFromCm(defaultCm)) : defaultCm;
                    })()}
                    onValueChange={(value) => {
                      setTempWaistValue(value);
                    }}
                    min={currentSettings?.units?.lengthType === 'Inch' ? getInchFromCm(50) : 50}
                    max={currentSettings?.units?.lengthType === 'Inch' ? getInchFromCm(130) : 130}
                    step={1}
                    unit={currentSettings?.units?.lengthType === 'Inch' ? 'inch' : 'cm'}
                    heightPx={responsiveHeight(20)}
                    style={{ width: '100%', height: '100%', zIndex: 1000 }}
                  />
                </Wrapper>
              </Wrapper>
              {/* Footer with Apply Button */}
              <Wrapper style={{ 
                paddingHorizontal: sizes.baseMargin, 
                paddingVertical: sizes.smallMargin,
                borderTopWidth: 1,
                borderTopColor: colors.appBorderColor2
              }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.appPrimaryColor,
                    paddingVertical: sizes.smallMargin,
                    paddingHorizontal: sizes.baseMargin,
                    borderRadius: sizes.inputRadius,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onPress={() => {
                    const isInch = currentSettings?.units?.lengthType === 'Inch';
                    setUserData(prev => ({
                      ...prev,
                      details: {
                        ...prev.details,
                        waist: {
                          [isInch ? 'inch' : 'cm']: tempWaistValue,
                          [isInch ? 'cm' : 'inch']: isInch ? getCmFromInch(tempWaistValue) : getInchFromCm(tempWaistValue)
                        }
                      }
                    }));
                    setWaistPickerVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ 
                    color: 'white', 
                    fontSize: scale(16), 
                    fontWeight: 'bold' 
                  }}>
                    {t('APPLY')}
                  </Text>
                </TouchableOpacity>
              </Wrapper>
            </PopupPrimary>

            {/* Hips Picker */}
            <PopupPrimary
              visible={hipsPickerVisible && !!me}
              toggle={() => setHipsPickerVisible(false)}
              headerTitle={t('hips')}
              backdropOpacity={0.4}
              isBlur
              onPressClose={() => setHipsPickerVisible(false)}
              headerRight={
                <TouchableOpacity
                  onPress={() => setHipsPickerVisible(false)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                >
                  <Text isSmallTitle style={{ color: colors.appTextColor1 }}>X</Text>
                </TouchableOpacity>
              }
              scrollEnabled={false}
              headerStyle={{ paddingTop: sizes.marginVertical }}
              rightContainerStyle={{ top: sizes.marginVertical }}
              containerStyle={{ 
                height: responsiveHeight(50), 
                paddingBottom: sizes.marginVertical * 2,
                paddingHorizontal: 0
              }}
              wrapContentInScroll={false}
              disableSwipe={true}
            >
              <Wrapper style={{ flex: 1, paddingHorizontal: 0 }}>
                <Wrapper flexDirectionRow alignItemsCenter justifyContentCenter style={{ height: '100%', zIndex: 1000, pointerEvents: 'auto' }}>
                  <WheelInput
                    initialValue={tempHipsValue || (() => {
                      const isInch = currentSettings?.units?.lengthType === 'Inch';
                      const value = safeMe?.details?.hips?.[isInch ? 'inch' : 'cm'];
                      if (value) {
                        return Math.round(value);
                      }
                      // Default values based on gender (Männer 110cm, Frauen 90cm)
                      const isMale = safeMe?.details?.gender === 'male' || safeMe?.details?.gender === 'M';
                      const defaultCm = isMale ? 110 : 90;
                      return isInch ? Math.round(getInchFromCm(defaultCm)) : defaultCm;
                    })()}
                    onValueChange={(value) => {
                      setTempHipsValue(value);
                    }}
                    min={currentSettings?.units?.lengthType === 'Inch' ? getInchFromCm(60) : 60}
                    max={currentSettings?.units?.lengthType === 'Inch' ? getInchFromCm(140) : 140}
                    step={1}
                    unit={currentSettings?.units?.lengthType === 'Inch' ? 'inch' : 'cm'}
                    heightPx={responsiveHeight(20)}
                    style={{ width: '100%', height: '100%', zIndex: 1000 }}
                  />
                </Wrapper>
              </Wrapper>
              {/* Footer with Apply Button */}
              <Wrapper style={{ 
                paddingHorizontal: sizes.baseMargin, 
                paddingVertical: sizes.smallMargin,
                borderTopWidth: 1,
                borderTopColor: colors.appBorderColor2
              }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.appPrimaryColor,
                    paddingVertical: sizes.smallMargin,
                    paddingHorizontal: sizes.baseMargin,
                    borderRadius: sizes.inputRadius,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onPress={() => {
                    const isInch = currentSettings?.units?.lengthType === 'Inch';
                    setUserData(prev => ({
                      ...prev,
                      details: {
                        ...prev.details,
                        hips: {
                          [isInch ? 'inch' : 'cm']: tempHipsValue,
                          [isInch ? 'cm' : 'inch']: isInch ? getCmFromInch(tempHipsValue) : getInchFromCm(tempHipsValue)
                        }
                      }
                    }));
                    setHipsPickerVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ 
                    color: 'white', 
                    fontSize: scale(16), 
                    fontWeight: 'bold' 
                  }}>
                    {t('APPLY')}
                  </Text>
                </TouchableOpacity>
              </Wrapper>
            </PopupPrimary>

            {/* Hair Color Picker */}
            <PopupPrimary
              visible={hairColorPickerVisible}
              toggle={() => setHairColorPickerVisible(false)}
              headerTitle={t('hairColor')}
              backdropOpacity={0.4}
              isBlur
              onPressClose={() => setHairColorPickerVisible(false)}
              headerRight={
                <TouchableOpacity
                  onPress={() => setHairColorPickerVisible(false)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                >
                  <Text isSmallTitle style={{ color: colors.appTextColor1 }}>X</Text>
                </TouchableOpacity>
              }
              scrollEnabled={false}
              headerStyle={{ paddingTop: sizes.marginVertical }}
              containerStyle={{ paddingBottom: sizes.marginVertical * 2 }}
            >
              <Wrapper marginHorizontalBase>
                {hairColorOptions.map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setUserData(prev => ({ ...prev, hairColor: opt.key }));
                      setHairColorPickerVisible(false);
                    }}
                  >
                    <Wrapper paddingVerticalSmall>
                      <Text>{opt.value}</Text>
                    </Wrapper>
                  </TouchableOpacity>
                ))}
              </Wrapper>
            </PopupPrimary>

            {/* Hair Length Picker */}
            <PopupPrimary
              visible={hairLengthPickerVisible}
              toggle={() => setHairLengthPickerVisible(false)}
              headerTitle={t('hairLength')}
              backdropOpacity={0.4}
              isBlur
              onPressClose={() => setHairLengthPickerVisible(false)}
              headerRight={
                <TouchableOpacity
                  onPress={() => setHairLengthPickerVisible(false)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                >
                  <Text isSmallTitle style={{ color: colors.appTextColor1 }}>X</Text>
                </TouchableOpacity>
              }
              scrollEnabled={false}
              headerStyle={{ paddingTop: sizes.marginVertical }}
              containerStyle={{ paddingBottom: sizes.marginVertical * 2 }}
            >
              <Wrapper marginHorizontalBase>
                {hairLengthOptions.map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setUserData(prev => ({ ...prev, hairLength: opt.key }));
                      setHairLengthPickerVisible(false);
                    }}
                  >
                    <Wrapper paddingVerticalSmall>
                      <Text>{opt.value}</Text>
                    </Wrapper>
                  </TouchableOpacity>
                ))}
              </Wrapper>
            </PopupPrimary>

            {/* Nationality Picker - with fixed size and scrollable list */}
            <PopupPrimary
              visible={nationalityPickerVisible}
              toggle={() => {
                setNationalityPickerVisible(false);
                setNationalitySearchText('');
              }}
              headerTitle={t('nationality')}
              backdropOpacity={0.4}
              isBlur
              onPressClose={() => {
                setNationalityPickerVisible(false);
                setNationalitySearchText('');
              }}
              headerRight={
                <TouchableOpacity
                  onPress={() => {
                    setNationalityPickerVisible(false);
                    setNationalitySearchText('');
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                >
                  <Text isSmallTitle style={{ color: colors.appTextColor1 }}>X</Text>
                </TouchableOpacity>
              }
              headerStyle={{ paddingTop: sizes.marginVertical }}
              rightContainerStyle={{ top: sizes.marginVertical }}
              containerStyle={{ 
                height: responsiveHeight(80), 
                paddingBottom: sizes.marginVertical * 2,
                paddingHorizontal: 0
              }}
              wrapContentInScroll={false}
              disableSwipe={true}
            >
              <Wrapper style={{ height: '100%', paddingHorizontal: sizes.marginHorizontal }}>
                {/* Search Input */}
                <TextInputs.Bordered
                  placeholder={t('SEARCH_COUNTRY')}
                  value={nationalitySearchText}
                  onChangeText={setNationalitySearchText}
                  style={{ marginBottom: scale(15) }}
                  editable={nationalityListReady}
                />
                
                {/* Show loading indicator while list is preparing */}
                {!nationalityListReady ? (
                  <Wrapper flex={1} alignItemsCenter justifyContentCenter>
                    <ActivityIndicator size="large" color={colors.appPrimaryColor} />
                  </Wrapper>
                ) : (
                  /* Filtered Country List - Fixed height with FlatList for better performance */
                  <FlatList
                  data={filteredNationalities}
                  keyExtractor={nationalityKeyExtractor}
                  style={nationalityFlatListStyle}
                  contentContainerStyle={nationalityContentContainerStyle}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  initialNumToRender={15}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  removeClippedSubviews={true}
                  updateCellsBatchingPeriod={50}
                  getItemLayout={getNationalityItemLayout}
                  ListEmptyComponent={nationalityEmptyComponent}
                  renderItem={renderNationalityItem}
                />
                )}
              </Wrapper>
            </PopupPrimary>
                <Spacer isBasic />
                <ProgressBar CurrentStandIndex={CurrentStage} setCurrentStage={setCurrentStage} />
                <Spacer height={responsiveHeight(8)} />
                {CurrentStage == 1 ? (
                  renderFirstStep
                ) : CurrentStage == 2 ? (
                  <SecondStep />
                ) : (
                  <ThirdStep />
                )}
                <Spacer height={responsiveHeight(2)} />
                <Wrapper
                  paddingVerticalBase
                  style={{
                    backgroundColor: colors.appBgColor1,
                    borderTopWidth: 1,
                    borderTopColor: colors.appBorderColor2,
                  }}
                >
                  <Buttons.Colored
                    text={t('SAVE')}
                    onPress={() => {
                      if (CurrentStage == 3) {
                        saveUserData();
                      } else {
                        setCurrentStage(perv => perv + 1);
                      }
                    }}
                  />
                </Wrapper>
                <Spacer isBasic />
                <Spacer height={responsiveHeight(3)} />
          </ScrollView>
          
          {/* Inline Selection Modals */}
          {MoreInfos ? (
              <View style={{
                position: 'absolute',
                  top: 0,
                left: 0,
                  bottom: 0,
                right: 0,
                backgroundColor: colors.appBgColor1,
                  borderTopLeftRadius: responsiveWidth(5),
                  borderTopRightRadius: responsiveWidth(5),
                height: responsiveHeight(90),
                paddingTop: 0,
                }}>
                    <Labels.ModalLabelWithCross
                      Title={t('INFOS')}
                      onPress={() => {
                        setMoreInfos(false);
                      }}
                    />
                <FlatList
                  data={Object.entries(groupedMoreInfo)}
                  keyExtractor={([category]) => category}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ 
                    paddingTop: sizes.baseMargin,
                    paddingBottom: responsiveHeight(15),
                  }}
            renderItem={({item: [category, items]}) => (
              <Wrapper style={{ marginBottom: scale(20), paddingHorizontal: sizes.baseMargin }}>
                      <ChoseToCompleteYourProfile
                  Label={t(category) || category}
                  originalCategory={category}
                        TotalSelectedValues={1}
                        ButtonsData={items}
                        initialSelectedValues={userData.details?.moreinfo?.filter(i => i.category === category) || []}
                        type="moreinfo"
                        userData={userData}
                        setUserData={setUserData}
                        lang={lang}
                      />
                    </Wrapper>
            )}
            ListFooterComponent={
              <View 
                style={{ 
                  backgroundColor: colors.appBgColor1,
                  paddingHorizontal: sizes.baseMargin,
                  paddingVertical: sizes.baseMargin,
                  paddingBottom: sizes.doubleBaseMargin,
                  borderTopWidth: 1,
                  borderTopColor: colors.appBorderColor2,
                  marginTop: scale(10),
                }}
              >
                <Buttons.Colored text={t('DONE')} onPress={() => setMoreInfos(false)} />
              </View>
            }
          />
              </View>
            ) : null}
            {LifeStyle ? (
              <View style={{
                position: 'absolute',
                  top: 0,
                left: 0,
                  bottom: 0,
                right: 0,
                backgroundColor: colors.appBgColor1,
                  borderTopLeftRadius: responsiveWidth(5),
                  borderTopRightRadius: responsiveWidth(5),
                height: responsiveHeight(90),
                paddingTop: 0,
                }}>
                  <Labels.ModalLabelWithCross
                    Title={t('LIFESTYLE')}
                    onPress={() => {
                      setLifeStyle(false);
                    }}
                  />
                <FlatList
                  data={Object.entries(groupedLifestyle)}
                  keyExtractor={([category]) => category}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ 
                    paddingTop: sizes.baseMargin,
                    paddingBottom: responsiveHeight(15),
                  }}
            renderItem={({item: [category, items]}) => (
              <Wrapper style={{ marginBottom: scale(20), paddingHorizontal: sizes.baseMargin }}>
                    <ChoseToCompleteYourProfile
                  Label={t(category) || category}
                  originalCategory={category}
                      TotalSelectedValues={1}
                      ButtonsData={items}
                      initialSelectedValues={userData.details?.lifestyle?.filter(i => i.category === category) || []}
                      type="lifestyle"
                      userData={userData}
                      setUserData={setUserData}
                      lang={lang}
                    />
                  </Wrapper>
            )}
            ListFooterComponent={
              <View 
                style={{ 
                  backgroundColor: colors.appBgColor1,
                  paddingHorizontal: sizes.baseMargin,
                  paddingVertical: sizes.baseMargin,
                  paddingBottom: sizes.doubleBaseMargin,
                  borderTopWidth: 1,
                  borderTopColor: colors.appBorderColor2,
                  marginTop: scale(10),
                }}
              >
                <Buttons.Colored text={t('DONE')} onPress={() => setLifeStyle(false)} />
              </View>
            }
          />
              </View>
            ) : null}
            {Interests ? (
              <View style={{
                position: 'absolute',
                  top: 0,
                left: 0,
                  bottom: 0,
                right: 0,
                backgroundColor: colors.appBgColor1,
                  borderTopLeftRadius: responsiveWidth(5),
                  borderTopRightRadius: responsiveWidth(5),
                height: responsiveHeight(90),
                paddingTop: 0,
                }}>
                  <Labels.ModalLabelWithCross
                    Title={t('INTERESTS')}
                    onPress={() => {
                      setInterests(false);
                    }}
                  />
                <FlatList
                  data={Object.entries(groupedInterests)}
                  keyExtractor={([category]) => category}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ 
                    paddingTop: sizes.baseMargin,
                    paddingBottom: responsiveHeight(15),
                  }}
            renderItem={({item: [category, items]}) => (
              <Wrapper style={{ marginBottom: scale(20), paddingHorizontal: sizes.baseMargin }}>
                    <ChoseToCompleteYourProfile
                  Label={t(category) || category}
                  originalCategory={category}
                      TotalSelectedValues={5}
                      ButtonsData={items}
                      initialSelectedValues={userData.details?.interests?.filter(i => i.category === category) || []}
                      type="interests"
                      userData={userData}
                      setUserData={setUserData}
                      lang={lang}
                    />
                  </Wrapper>
            )}
            ListFooterComponent={
              <View 
                style={{ 
                  backgroundColor: colors.appBgColor1,
                  paddingHorizontal: sizes.baseMargin,
                  paddingVertical: sizes.baseMargin,
                  paddingBottom: sizes.doubleBaseMargin,
                  borderTopWidth: 1,
                  borderTopColor: colors.appBorderColor2,
                  marginTop: scale(10),
                }}
              >
                <Buttons.Colored text={t('DONE')} onPress={() => setInterests(false)} />
              </View>
            }
          />
              </View>
            ) : null}
            {ILove ? (
              <View style={{
                position: 'absolute',
                  top: 0,
                left: 0,
                  bottom: 0,
                right: 0,
                backgroundColor: colors.appBgColor1,
                  borderTopLeftRadius: responsiveWidth(5),
                  borderTopRightRadius: responsiveWidth(5),
                height: responsiveHeight(90),
                paddingTop: 0,
                }}>
                  <Labels.ModalLabelWithCross
                    Title={t('MYBRANDS')}
                    onPress={() => {
                      setILove(false);
                    }}
                  />
                <FlatList
                  data={Object.entries(groupedBrands)}
                  keyExtractor={([category]) => category}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ 
                    paddingTop: sizes.baseMargin,
                    paddingBottom: responsiveHeight(15),
                  }}
            renderItem={({item: [category, items]}) => (
              <Wrapper style={{ marginBottom: scale(20), paddingHorizontal: sizes.baseMargin }}>
                    <ChoseToCompleteYourProfile
                  Label={t(category) || category}
                  originalCategory={category}
                      TotalSelectedValues={5}
                      ButtonsData={items}
                      initialSelectedValues={(() => {
                        const filtered = userData.details?.brands?.filter(i => i.category === category) || [];
                        console.log('Brands initialSelectedValues for category', category, ':', filtered);
                        return filtered;
                      })()}
                      type="brands"
                      userData={userData}
                      setUserData={setUserData}
                      lang={lang}
                      isBrands={true}
                    />
                  </Wrapper>
            )}
            ListFooterComponent={
              <View 
                style={{ 
                  backgroundColor: colors.appBgColor1,
                  paddingHorizontal: sizes.baseMargin,
                  paddingVertical: sizes.baseMargin,
                  paddingBottom: sizes.doubleBaseMargin,
                  borderTopWidth: 1,
                  borderTopColor: colors.appBorderColor2,
                  marginTop: scale(10),
                }}
              >
                <Buttons.Colored text={t('DONE')} onPress={() => setILove(false)} />
              </View>
            }
          />
              </View>
            ) : null}
        </View>
      }
      />
    </>
  );
}
const ProgressBar = React.memo(({ CurrentStandIndex, setCurrentStage }) => {
  const CompletedStage = CurrentStandIndex - 1;
  const { t } = useTranslation();

  return (
    <Wrapper marginHorizontalBase>
      <Wrapper flexDirectionRow alignItemsCenter justifyContentSpaceBetween>
        {['PICTURES', 'MYDETAILS', 'ABOUTME'].map((item, index) => (
          <Wrapper key={index} alignItemsCenter style={{ 
            minHeight: responsiveHeight(8),
            marginLeft: index === 0 ? -responsiveWidth(2) : 0 // Nur die erste Bubble etwas nach links
          }}>
            <TouchableOpacity onPress={() => setCurrentStage(index + 1)}>
              <View
                style={{
                  width: scale(28),
                  height: scale(28),
                  borderRadius: 150,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor:
                    CompletedStage >= 0 && CompletedStage == index + 1
                      ? colors.appPrimaryColor
                      : CompletedStage == 2 && index == 0
                        ? colors.appPrimaryColor
                        : CurrentStandIndex == index + 1
                          ? colors.appPrimaryColor
                          : colors.appBorderColor2,
                }}>
                {(CompletedStage >= 0 && CompletedStage == index + 1) ||
                  (CompletedStage == 2 && index == 0) ? (
                  <Icons.Custom icon={appIcons.Tick} size={scale(14)} />
                ) : (
                  <Text
                    isWhite={CurrentStandIndex - 1 == index}
                    isTextColor2
                    isSmall
                    isMediumFont
                    alignTextCenter>{`0${index + 1}`}</Text>
                )}
              </View>
            </TouchableOpacity>
            <Spacer isTiny />
            <Text
              isSmall
              isRegularFont
              isPrimaryColor={CurrentStandIndex == index + 1}
              numberOfLines={2}
              style={{ textAlign: 'center', maxWidth: responsiveWidth(25) }}>
              {t(item)}
            </Text>
          </Wrapper>
        ))}
      </Wrapper>
      <Wrapper
        isAbsolute
        style={{
          top: scale(14),
          left: scale(18),
          zIndex: -1,
          width: responsiveWidth(80),
        }}>
        <View
          style={{
            flex: 1,
            height: 1,
            backgroundColor: colors.appBorderColor2,
          }}>
          <View
            style={{
              height: 1,
              backgroundColor: colors.appPrimaryColor,
              width:
                CurrentStandIndex == 1
                  ? responsiveWidth(25)
                  : CurrentStandIndex == 2
                    ? responsiveWidth(60)
                    : CurrentStandIndex == 3
                      ? 'auto'
                      : 0,
            }}
          />
        </View>
      </Wrapper>
    </Wrapper>
  );
});

// Tinder-style Chip Layout - simple flow layout
const SmartChipLayout = React.memo(({ children }) => {
  return (
    <View 
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: scale(6),
        rowGap: scale(6),
      }}
    >
      {children}
    </View>
  );
});

const ChoseToCompleteYourProfile = React.memo(
  ({ TotalSelectedValues, Label, originalCategory, ButtonsData, initialSelectedValues = [], type, userData, setUserData, lang, isBrands = false }) => {
    const [SelectedValues, setSelectedValues] = useState(initialSelectedValues);
    
    // Track if user has made changes to prevent external updates from overriding
    const userChangedRef = useRef(false);
    
    useEffect(() => {
      console.log('initialSelectedValues changed:', { initialSelectedValues, type, Label });
      // Only update from external changes if user hasn't made local changes
      if (!userChangedRef.current) {
        const currentValues = JSON.stringify(SelectedValues.sort());
        const newValues = JSON.stringify(initialSelectedValues.sort());
        if (currentValues !== newValues) {
          console.log('Updating SelectedValues with:', initialSelectedValues);
      setSelectedValues(initialSelectedValues);
        }
      }
    }, [initialSelectedValues]);

    const isSelected = useCallback((item) => {
      console.log('isSelected check:', { 
        isBrands, 
        item, 
        SelectedValues, 
        Label, 
        type,
        originalCategory 
      });
      
      if (isBrands) {
        // Für Brands: Prüfe verschiedene mögliche Strukturen
        const result = SelectedValues.some(sel => {
          console.log('Brand comparison:', { sel, item, Label });
          // Mögliche Strukturen:
          // 1. sel.value === item && sel.category === Label
          // 2. sel.value === item && sel.category === originalCategory
          // 3. sel === item (falls item direkt der Wert ist)
          return (sel.value === item && sel.category === Label) ||
                 (sel.value === item && sel.category === originalCategory) ||
                 (sel === item);
        });
        console.log('Brand selection result:', result);
        return result;
      } else {
        // Für andere: Vergleiche wie im alten Projekt (en + category)
        const result = SelectedValues.some(sel => {
          const matches = sel.en === item.en && sel.category === item.category;
          console.log('Non-brand selection check:', { sel, item, matches });
          return matches;
        });
        console.log('Non-brand selection result:', result);
        return result;
      }
    }, [SelectedValues, isBrands, Label, originalCategory, type]);

    const handleSelect = useCallback((item) => {
      const selected = isSelected(item);
      const categoryToUse = originalCategory || Label;
      
      // Mark that user has made changes
      userChangedRef.current = true;
      
      let updated;
      if (selected) {
        // Deselect the item
        if (isBrands) {
          // Für Brands: Entferne basierend auf verschiedenen möglichen Strukturen
          updated = SelectedValues.filter(sel => {
            return !((sel.value === item && sel.category === categoryToUse) ||
                     (sel.value === item && sel.category === Label) ||
                     (sel === item));
          });
        } else {
          // Entferne das Item basierend auf eindeutiger Identifikation
          const itemId = item.id || item.value || item.label || item[lang] || item.en;
          updated = SelectedValues.filter(sel => {
            const selId = sel.id || sel.value || sel.label || sel[lang] || sel.en;
            return !(itemId === selId && sel.category === item.category);
          });
        }
      } else {
        // Check if we can add more items (limit not reached)
        const currentCategoryItems = SelectedValues.filter(sel => sel.category === (isBrands ? categoryToUse : item.category));
        if (currentCategoryItems.length < TotalSelectedValues) {
          if (isBrands) {
            updated = [...SelectedValues, { value: item, category: categoryToUse }];
          } else {
            updated = [...SelectedValues, item];
          }
        } else if (TotalSelectedValues === 1) {
          // For single-select: replace the old selection with the new one
          const otherCategoryItems = SelectedValues.filter(sel => sel.category !== (isBrands ? categoryToUse : item.category));
          if (isBrands) {
            updated = [...otherCategoryItems, { value: item, category: categoryToUse }];
          } else {
            updated = [...otherCategoryItems, item];
          }
        } else {
          // Multi-select limit reached - don't add more items
          updated = SelectedValues;
          return; // Exit early if limit is reached
        }
      }
      setSelectedValues(updated);
      
      // For all types, merge with existing items from other categories
        setUserData(prev => {
        const existingItems = prev.details?.[type] || [];
        const otherCategoryItems = existingItems.filter(item => item.category !== categoryToUse);
        
        // Deduplicate the updated items before merging
        const deduplicatedUpdated = updated.filter((newItem, index, arr) => {
          return arr.findIndex(item => {
            if (isBrands) {
              return item.value === newItem.value && item.category === newItem.category;
            } else {
              const newItemId = newItem.id || newItem.value || newItem.label || newItem[lang] || newItem.en;
              const itemId = item.id || item.value || item.label || item[lang] || item.en;
              return newItemId === itemId && item.category === newItem.category;
            }
          }) === index;
        });
        
        const allItems = [...otherCategoryItems, ...deduplicatedUpdated];
          
          return {
            ...prev,
            details: {
              ...prev.details,
            [type]: allItems
            }
          };
        });
    }, [SelectedValues, isBrands, originalCategory, Label, TotalSelectedValues, type, setUserData, lang, isSelected]);

    // Count only items from this category (use originalCategory for comparison)
    const currentCategoryCount = useMemo(() => {
      const categoryToCompare = originalCategory || Label;
      return SelectedValues.filter(item => {
        return item.category === categoryToCompare;
      }).length;
    }, [SelectedValues, originalCategory, Label]);

    return (
      <Wrapper marginHorizontalBase>
        <Wrapper flexDirectionRow alignItemsCenter justifyContentSpaceBetween>
          <Text isMedium isBoldFont>
            {Label}
          </Text>
          <Text isTextColor2 isSmall isRegularFont>
            {currentCategoryCount} / {TotalSelectedValues}
          </Text>
        </Wrapper>
        <Spacer isBasic />
        <SmartChipLayout>
          {ButtonsData.map((item, index) => {
            const label = isBrands ? item : (item[lang] || item.en || '');
            const selected = isSelected(item);
            // Create unique key based on item content
            const uniqueKey = isBrands ? `${item}_${Label}` : `${item.id || item.value || item.label || item[lang] || item.en}_${item.category || Label}`;
            return (
              <TouchableOpacity
                key={uniqueKey}
                onPress={() => handleSelect(item)}>
                <Wrapper
                  style={[
                    {
                      paddingHorizontal: scale(10),
                      paddingVertical: scale(5),
                      borderWidth: selected ? 0 : 1,
                      borderRadius: 150,
                      borderColor: colors.appBorderColor2,
                    },
                    selected && {
                      backgroundColor: colors.appBGColor,
                      ...appStyles.shadowExtraDark,
                    },
                  ]}>
                  <Text isTextColor2 isWhite={selected} style={{ fontSize: scale(10) }}>
                    {label}
                  </Text>
                </Wrapper>
              </TouchableOpacity>
            );
          })}
        </SmartChipLayout>
      </Wrapper>
    );
  },
);

export { default as ImageCropModal } from './ImageCropModal';
