import {View, TouchableOpacity, StyleSheet, Dimensions, ScrollView} from 'react-native';
import React from 'react';
import {
  Buttons,
  Headers,
  MyAnimated,
  ScrollViews,
  Spacer,
  Swipeables,
  Text,
  Wrapper,
  Switches,
  TextInputs,
  Icons,
  Labels,
  Modals,
  BarButtons,
} from '../../../components';
import {
  appStyles,
  colors,
  responsiveWidth,
  sizes,
  appIcons,
  responsiveHeight,
  fontSizes,
} from '../../../services';
import {useHooks} from './hooks';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {scale, verticalScale} from 'react-native-size-matters';
import {Options} from './hooks';
import {getPrivacyContent} from './privacyContent';
import {getTermsContent} from './termsContent';
import AccessModalContent from './AccessModalContent';
console.log('AccessModalContent:', AccessModalContent);

const MODAL_MAX_HEIGHT = Dimensions.get('window').height * 0.8;

const Index = () => {
  const {
    user,
    isSaving,
    unitsData,
    LanguageModal,
    LanguageModalData,
    handleToggleLocationModal,
    AccessModal: accessModalVisible,
    handleToggleAccessModal,
    PrivacyPolicyModal,
    handleTogglePrivacyPolicyModal,
    TermsConditionsModal,
    handleToggleTermsConditionsModal,
    AppIconsVip,
    AppIconSealth,
    handleToggleIconVip,
    handleToggleIconSealth,
    IconVipData,
    IconSealthData,
    toggleNotification,
    toggleDiscoverVisibility,
    toggleCallVisibility,
    updateUnit,
    updateLanguage,
    handleIconReset,
  } = useHooks();
  const {t} = useTranslation();

  // Get current language display name
  const getCurrentLanguageName = () => {
    const currentLang = user?._settings?.currentLang || 'en';
    const langMap = {
      de: 'German',
      en: 'English',
      fr: 'French',
      es: 'Spanish',
    };
    return langMap[currentLang] || 'English';
  };

  // Get notification status text
  const getNotificationStatus = type => {
    return user?._settings?.notifications?.[type]
      ? t('ACTIVATE')
      : t('NOT_ACTIVATE');
  };

  // Get discover status text
  const getDiscoverStatus = () => {
    return user?._settings?.showInDiscover ? t('SHOW_ME') : t('HIDE_ME');
  };

  // Get call status text
  const getCallStatus = () => {
    return user?._settings?.showCall ? t('ACTIVATE') : t('NOT_ACTIVATE');
  };

  return (
    <Wrapper isMain>
      <Headers.Primary showBackArrow title={t('SETTINGS')} />
      <ScrollViews.KeyboardAvoiding>
        <Spacer isSmall />
        {/* Languages Input */}
        <TextInputs.Bordered
          InputLabel={t('LANGUAGE')}
          placeholder={getCurrentLanguageName()}
          iconSizeRight={24}
          placeholderTextColor={colors.appTextColor2}
          customIconRight={appIcons.Down}
          onPress={handleToggleLocationModal}
        />
        <Spacer isBasic />
        {/* Audio & Video Call Input */}
        <TextInputs.Bordered
          InputLabel={t('AUDIOANDVIDEOCALL')}
          placeholder={getCallStatus()}
          placeholderTextColor={colors.appTextColor2}
          customIconRight={appIcons.Down}
          onPress={() => {}}
          right={
            <Switches.Custom
              value={user?._settings?.showCall || false}
              onValueChange={toggleCallVisibility}
            />
          }
        />
        <Spacer isBasic />
        {/* Discover  */}
        <TextInputs.Bordered
          InputLabel={t('DISCOVER')}
          placeholder={getDiscoverStatus()}
          placeholderTextColor={colors.appTextColor2}
          customIconRight={appIcons.Down}
          onPress={() => {}}
          right={
            <Switches.Custom
              value={user?._settings?.showInDiscover || false}
              onValueChange={toggleDiscoverVisibility}
            />
          }
        />
        <Spacer isBasic />
        {/* App Icon  */}
        <Wrapper gap={responsiveHeight(1)}>
          <TextInputs.Bordered
            InputLabel={t('APPICONS')}
            placeholder={t('VIP')}
            placeholderTextColor={colors.appTextColor2}
            customIconRight={appIcons.Forward}
            onPress={() => {
              handleToggleIconVip();
            }}
          />
          <TextInputs.Bordered
            placeholder={t('STEALTH_MODE')}
            placeholderTextColor={colors.appTextColor2}
            customIconRight={appIcons.Forward}
            onPress={() => {
              handleToggleIconSealth();
            }}
          />
        </Wrapper>
        <Spacer isBasic />

        {/* Notifications  */}
        <Wrapper gap={responsiveHeight(1)}>
          <TextInputs.Bordered
            InputLabel={t('NOTIFICATIONS')}
            placeholder={getNotificationStatus('messages')}
            placeholderTextColor={colors.appTextColor2}
            customIconRight={appIcons.Down}
            onPress={() => {}}
            right={
              <Switches.Custom
                value={user?._settings?.notifications?.messages || false}
                onValueChange={() => toggleNotification('messages')}
              />
            }
          />
          <TextInputs.Bordered
            placeholder={t('FRIENDSREQUEST')}
            placeholderTextColor={colors.appTextColor2}
            customIconRight={appIcons.Down}
            onPress={() => {}}
            right={
              <Switches.Custom
                value={user?._settings?.notifications?.friendRequests || false}
                onValueChange={() => toggleNotification('friendRequests')}
              />
            }
          />
          <TextInputs.Bordered
            placeholder={t('LIKES')}
            placeholderTextColor={colors.appTextColor2}
            customIconRight={appIcons.Down}
            onPress={() => {}}
            right={
              <Switches.Custom
                value={user?._settings?.notifications?.likes || false}
                onValueChange={() => toggleNotification('likes')}
              />
            }
          />
          <TextInputs.Bordered
            placeholder={t('AUDIOANDVIDEOCALL')}
            placeholderTextColor={colors.appTextColor2}
            customIconRight={appIcons.Down}
            onPress={() => {}}
            right={
              <Switches.Custom
                value={user?._settings?.notifications?.call || false}
                onValueChange={() => toggleNotification('call')}
              />
            }
          />
        </Wrapper>
        <Spacer isBasic />
        <Wrapper marginHorizontalBase>
          <Text isSmall isMediumFont children={t('UNITS')} />
          <Spacer isTiny />
        </Wrapper>
        <Wrapper gap={responsiveHeight(1)}>
          {unitsData.map((item, index) => (
            <Wrapper
              key={index}
              flexDirectionRow
              alignItemsCenter
              justifyContentSpaceBetween
              paddingHorizontalBase
              style={{
                ...appStyles.inputFieldBorderd,
                borderWidth: 1.5,
                borderRadius: responsiveWidth(100),
                borderColor: colors.appBgColor3,
              }}>
              <Text
                isMedium
                isRegularFont
                isTextColor2
                children={t(item?.label)}
              />
              <TouchableOpacity
                onPress={() => {
                  // Toggle between options
                  const currentValue = item.unit;
                  const options = item.options;
                  const currentIndex = options.indexOf(currentValue);
                  const nextIndex = (currentIndex + 1) % options.length;
                  updateUnit(item.type, options[nextIndex]);
                }}>
                <Icons.WithText
                  direction={'row-reverse'}
                  text={item?.unit}
                  textStyle={{
                    color: colors.appTextColor2,
                    fontSize: fontSizes.medium,
                  }}
                  customIcon={appIcons.Down}
                  iconSize={24}
                />
              </TouchableOpacity>
            </Wrapper>
          ))}
        </Wrapper>
        <Spacer isBasic />
        {/* Privacy  */}
        <Wrapper gap={responsiveHeight(1)}>
          <TextInputs.Bordered
            InputLabel={t('PRIVACY')}
            placeholder={t('PRICAVYPOLICY')}
            iconSizeRight={24}
            placeholderTextColor={colors.appTextColor2}
            customIconRight={appIcons.Down}
            onPress={handleTogglePrivacyPolicyModal}
          />
          <TextInputs.Bordered
            placeholder={t('TERMSOFSERVICE')}
            iconSizeRight={24}
            placeholderTextColor={colors.appTextColor2}
            customIconRight={appIcons.Down}
            onPress={handleToggleTermsConditionsModal}
          />
          <TextInputs.Bordered
            placeholder={t('ACCESS')}
            iconSizeRight={24}
            placeholderTextColor={colors.appTextColor2}
            customIconRight={appIcons.Down}
            onPress={handleToggleAccessModal}
          />
        </Wrapper>
        <Wrapper paddingVerticalBase>
          <Text alignTextCenter isTextColor2 children={'2023 DESIRES 0.0.1'} />
        </Wrapper>
      </ScrollViews.KeyboardAvoiding>
      {/* Languages Modal */}
      <Modals.PopupPrimary
        isBlur
        visible={LanguageModal}
        toggle={handleToggleLocationModal}
        mainContainerStyle={{height: responsiveHeight(75)}}
        containerStyle={{flex: 1}}>
        <View style={{height: responsiveHeight(74)}}>
          <ScrollViews.KeyboardAvoiding>
            <Wrapper>
              <Labels.ModalLabelWithCross
                Title={t('LANGUAGE')}
                onPress={handleToggleLocationModal}
              />
              <Spacer isBasic />
              <BarButtons.IconWithTextSelectOptions
                NoColorOfIcon
                Data={LanguageModalData}
                onPress={item => updateLanguage(item.value)}
                selectedValue={user?._settings?.currentLang}
              />
            </Wrapper>
          </ScrollViews.KeyboardAvoiding>
        </View>
      </Modals.PopupPrimary>

      {/* Access Modal */}
      <Modals.PopupPrimary
        isBlur
        visible={accessModalVisible}
        toggle={handleToggleAccessModal}
        children={
          <AccessModalContent user={user} onClose={handleToggleAccessModal} />
        }
      />
      {/* Terms & Conditions Modal */}
      <Modals.PopupPrimary
        isBlur
        disableSwipe
        visible={TermsConditionsModal}
        toggle={handleToggleTermsConditionsModal}>
        <Wrapper style={{maxHeight: MODAL_MAX_HEIGHT}}>
          <Labels.ModalLabelWithCross
            Title={t('TERMSOFSERVICE')}
            onPress={handleToggleTermsConditionsModal}
          />
          <ScrollViews.KeyboardAvoiding
            contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 32}}>
            <View style={{paddingHorizontal: 4}}>
              <Text
                isRegular
                isRegularFont
                isTextColor2
                style={{paddingHorizontal: 20, paddingBottom: 48}}>
                {getTermsContent(user?._settings?.currentLang || 'en')}
              </Text>
            </View>
          </ScrollViews.KeyboardAvoiding>
        </Wrapper>
      </Modals.PopupPrimary>
      {/* Privacy Policy Modal */}
      <Modals.PopupPrimary
        isBlur
        disableSwipe
        visible={PrivacyPolicyModal}
        toggle={handleTogglePrivacyPolicyModal}>
        <Wrapper style={{maxHeight: MODAL_MAX_HEIGHT}}>
          <Labels.ModalLabelWithCross
            Title={t('PRIVACYPOLICY')}
            onPress={handleTogglePrivacyPolicyModal}
          />
          <ScrollViews.KeyboardAvoiding
            contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 32}}>
            <View style={{paddingHorizontal: 4}}>
              <Text
                isRegular
                isRegularFont
                isTextColor2
                style={{paddingHorizontal: 20, paddingBottom: 48}}>
                {getPrivacyContent(user?._settings?.currentLang || 'en')}
              </Text>
            </View>
          </ScrollViews.KeyboardAvoiding>
        </Wrapper>
      </Modals.PopupPrimary>
      {/* Vip Mode */}
      <Modals.PopupPrimary
        isBlur
        disableSwipe
        visible={AppIconsVip}
        toggle={handleToggleIconVip}
        headerTitle={t('VIP_APP_ICONS')}
        onPressClose={handleToggleIconVip}
        wrapContentInScroll={false}
        mainContainerStyle={{height: responsiveHeight(75)}}
        containerStyle={{flex: 1}}>
        {/* Scrollable Content */}
        <ScrollView 
          style={{flex: 1}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always">
          <Wrapper marginHorizontalBase>
            <Text isRegular isRegularFont>
              {(t('VIPAPPICONDESCRIPTION') || '').replace(/<br\s*\/?>/gi, '\n')}
            </Text>
          </Wrapper>
          <Spacer isSmall />
          <Wrapper
            style={{
              paddingBottom: responsiveHeight(10),
            }}>
            {IconVipData.map((item, index) => (
              <Options
                key={index}
                //isRounded
                title={item?.title}
                customleftIcon={item?.customleftIcon}
                leftIconColor={item?.leftIconColor}
                leftColor={item?.leftColor}
                leftIconSize={scale(40)}
                description={item?.description}
                rightText={item?.rightText}
                onPressRight={item?.onPressRight}
              />
            ))}
          </Wrapper>
        </ScrollView>
        
        {/* Fixed Button at Bottom */}
        <Wrapper style={styles.buttonONtheBottom}>
          <Buttons.Colored text={t('RESET')} onPress={handleIconReset} />
        </Wrapper>
      </Modals.PopupPrimary>
      {/* Stealth Mode */}
      <Modals.PopupPrimary
        isBlur
        disableSwipe
        visible={AppIconSealth}
        toggle={handleToggleIconSealth}
        headerTitle={t('STEALTH_APP_ICONS')}
        onPressClose={handleToggleIconSealth}
        wrapContentInScroll={false}
        mainContainerStyle={{height: responsiveHeight(75)}}
        containerStyle={{flex: 1}}>
        {/* Scrollable Content */}
        <ScrollView 
          style={{flex: 1}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always">
          <Wrapper marginHorizontalBase>
            <Text isRegular isRegularFont>
              {(t('STEALTHICONDESCRIPTION') || '').replace(/<br\s*\/?>/gi, '\n')}
            </Text>
          </Wrapper>
          <Spacer isSmall />
          <Wrapper
            style={{
              paddingBottom: responsiveHeight(10),
            }}>
            {IconSealthData.map((item, index) => (
              <Options
                key={index}
                title={item?.title}
                customleftIcon={item?.customleftIcon}
                isRounded
                leftColor={item?.leftColor}
                leftIconSize={scale(48)}
                description={item?.description}
                rightText={item?.rightText}
                onPressRight={item?.onPressRight}
              />
            ))}
            <Spacer isBasic />
            <Buttons.Colored text={t('RESET')} onPress={handleIconReset} />
          </Wrapper>
        </ScrollView>
      </Modals.PopupPrimary>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  buttonONtheBottom: {
    flex: 1,
    position: 'absolute',
    bottom: responsiveHeight(12),
    left: 0,
    right: 0,
    paddingVertical: sizes.smallMargin,
    marginVertical: sizes.smallMargin,
  },
});

export default Index;
