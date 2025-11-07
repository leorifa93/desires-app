import React, {useState} from 'react';
import {
  Wrapper,
  Icons,
  Spacer,
  Lines,
  Modals,
  Labels,
  TextInputs,
  Text,
  StatusBars,
  Images,
  Pickers,
} from '../../../components';
import {useHooks} from './hooks';
import {
  appFonts,
  fontSizes,
  responsiveWidth,
  responsiveHeight,
  appIcons,
  colors,
} from '../../../services';
import {scale} from 'react-native-size-matters';
import {FlatList, TouchableOpacity, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function Index() {
  const { t } = useTranslation();
  const {
    HeaderComponent,
    menuItems,
    LocationModalVisible,
    handleToggleLocationModal,
    EditProfileModalVisible,
    handleToggleEditProfileModal,
    isLoggingOut,
    logoutStatus,
  } = useHooks();

  // Picker States
  const [heightPickerVisible, setHeightPickerVisible] = useState(false);
  const [weightPickerVisible, setWeightPickerVisible] = useState(false);
  const [chestPickerVisible, setChestPickerVisible] = useState(false);
  const [waistPickerVisible, setWaistPickerVisible] = useState(false);
  const [hipsPickerVisible, setHipsPickerVisible] = useState(false);
  const [userData, setUserData] = useState({});

  // RenderItem component
  const RenderItem = React.memo(
    ({Icon, Title, tintColor, onPress, isImage}) => {
      return (
        <TouchableOpacity
          disabled={!onPress}
          onPress={onPress}
          //accessibilityLabel={Title} // Accessibility label for better usability
          //accessibilityRole="button" // Define the role for accessibility
        >
          <Wrapper
            marginHorizontalBase
            paddingVerticalBase
            flexDirectionRow
            alignItemsCenter>
            <Wrapper style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: responsiveWidth(68.5),
              marginHorizontal: responsiveWidth(5),
            }}>
              {Icon ? (
                <Wrapper style={{marginRight: responsiveWidth(3)}}>
                  {isImage ? (
                    // Render as Image (for Coin icons etc.)
                    <Images.Round
                      source={Icon}
                      size={scale(20)}
                    />
                  ) : (
                    // Render as SVG Icon (for all other icons)
                    <Icons.Custom
                      icon={Icon}
                      size={scale(20)}
                      color={tintColor ? tintColor : colors.appTextColor1}
                    />
                  )}
                </Wrapper>
              ) : (
                <Text style={{
                  fontSize: scale(20),
                  marginRight: responsiveWidth(3),
                  color: tintColor ? tintColor : colors.appBGColor,
                }}>
                  ⚙️
                </Text>
              )}
              <Text style={{
                fontSize: fontSizes.regular,
                fontFamily: appFonts.appTextRegular,
                flex: 1,
              }}>
                {Title}
              </Text>
            </Wrapper>
            <Text style={{
              fontSize: scale(16),
              color: colors.appBGColor,
            }}>
              →
            </Text>
          </Wrapper>
        </TouchableOpacity>
      );
    },
    (prevProps, nextProps) => {
      // Custom comparison function to prevent unnecessary re-renders
      return (
        prevProps.Title === nextProps.Title &&
        prevProps.onPress === nextProps.onPress &&
        prevProps.isImage === nextProps.isImage
      );
    },
  );

  // Main render
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBars.Dark backgroundColor="#fff" />
      <Wrapper isMain>
        <FlatList
          data={menuItems}
          ListHeaderComponent={<HeaderComponent />}
          showsVerticalScrollIndicator={false}
          renderItem={({item, index}) => (
            <RenderItem
              key={index}
              Icon={item?.customIcon}
              Title={item?.title}
              tintColor={item?.tintColor}
              onPress={item?.onPress}
              isImage={item?.isImage}
            />
          )}
          ListFooterComponent={<Spacer height={responsiveHeight(10)} />}
          ItemSeparatorComponent={
            <Wrapper marginHorizontalSmall alignItemsFlexEnd>
            <Lines.Horizontal
              height={0.8}
              width={responsiveWidth(83)}
              color={colors.appBorderColor2}
            />
          </Wrapper>
        }
        />
        <Modals.PlacesAutocomplete
          visible={LocationModalVisible}
          toggle={handleToggleLocationModal}
        />
        <Modals.EditProfile
          visible={EditProfileModalVisible}
          toggle={handleToggleEditProfileModal}
          heightPickerVisible={heightPickerVisible}
          setHeightPickerVisible={setHeightPickerVisible}
          weightPickerVisible={weightPickerVisible}
          setWeightPickerVisible={setWeightPickerVisible}
          chestPickerVisible={chestPickerVisible}
          setChestPickerVisible={setChestPickerVisible}
          waistPickerVisible={waistPickerVisible}
          setWaistPickerVisible={setWaistPickerVisible}
          hipsPickerVisible={hipsPickerVisible}
          setHipsPickerVisible={setHipsPickerVisible}
          userData={userData}
          setUserData={setUserData}
        />
        
        {/* Profile Picker Overlays - Outside EditProfile Modal */}
        <Pickers.HeightPicker
          visible={heightPickerVisible}
          onClose={() => setHeightPickerVisible(false)}
          onSelect={(height) => {
            setUserData(prev => ({
              ...prev,
              details: { ...prev.details, height: height },
            }));
          }}
          currentValue={userData?.details?.height}
          t={t}
        />
        
        <Pickers.WeightPicker
          visible={weightPickerVisible}
          onClose={() => setWeightPickerVisible(false)}
          onSelect={(weight) => {
            setUserData(prev => ({
              ...prev,
              details: { ...prev.details, weight: weight },
            }));
          }}
          currentValue={userData?.details?.weight}
          t={t}
        />
        
        <Pickers.ChestPicker
          visible={chestPickerVisible}
          onClose={() => setChestPickerVisible(false)}
          onSelect={(chest) => {
            setUserData(prev => ({
              ...prev,
              details: { ...prev.details, chest: chest },
            }));
          }}
          currentValue={userData?.details?.chest}
          t={t}
        />
        
        <Pickers.WaistPicker
          visible={waistPickerVisible}
          onClose={() => setWaistPickerVisible(false)}
          onSelect={(waist) => {
            setUserData(prev => ({
              ...prev,
              details: { ...prev.details, waist: waist },
            }));
          }}
          currentValue={userData?.details?.waist}
          t={t}
        />
        
        <Pickers.HipsPicker
          visible={hipsPickerVisible}
          onClose={() => setHipsPickerVisible(false)}
          onSelect={(hips) => {
            setUserData(prev => ({
              ...prev,
              details: { ...prev.details, hips: hips },
            }));
          }}
          currentValue={userData?.details?.hips}
          t={t}
        />
        
        {/* Logout Banner */}
        {isLoggingOut && (
          <Wrapper
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
            }}>
            <Wrapper
              style={{
                backgroundColor: colors.appBgColor1,
                borderRadius: scale(15),
                padding: scale(20),
                marginHorizontal: scale(20),
                alignItems: 'center',
                minWidth: responsiveWidth(80),
              }}>
              <ActivityIndicator 
                size="large" 
                color={colors.appPrimaryColor} 
                style={{ marginBottom: scale(15) }}
              />
              <Text
                style={{
                  fontSize: fontSizes.regular,
                  fontFamily: appFonts.appTextMedium,
                  color: colors.appTextColor1,
                  textAlign: 'center',
                  marginBottom: scale(5),
                }}>
                {logoutStatus}
              </Text>
              <Text
                style={{
                  fontSize: fontSizes.small,
                  fontFamily: appFonts.appTextRegular,
                  color: colors.appTextColor2,
                  textAlign: 'center',
                }}>
                {t('LOGOUT_PLEASE_WAIT')}
              </Text>
            </Wrapper>
          </Wrapper>
        )}
      </Wrapper>
    </SafeAreaView>
  );
}
