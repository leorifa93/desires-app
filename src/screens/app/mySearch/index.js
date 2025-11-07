import React, { useMemo, useState } from 'react';
import { Wrapper, Headers, Spacer, Icons, Buttons, Text } from '../../../components';
import { useHooks } from './hooks';
import { scale } from 'react-native-size-matters';
import {
  appFonts,
  appIcons,
  colors,
  fontSizes,
  responsiveHeight,
  responsiveWidth,
  sizes,
} from '../../../services';
import { TouchableOpacity } from 'react-native';
import { Svg, Path, Defs, LinearGradient, Stop, G, ClipPath, Rect } from 'react-native-svg';
import { goBack } from '../../../navigation/rootNavigation';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import { setUser } from '../../../store/reducers/auth';

export default function Index() {
  const {} = useHooks();
  const { t } = useTranslation();
  const me = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const [user, setUserState] = useState(me);

  // Gender-Keys wie im alten Projekt (1=Male, 2=Female, 3=Transexual)
  const Data = useMemo(
    () => [
      { IconName: 'male-outline', Title: t('MALE'), Key: 1 },
      { IconName: 'female-outline', Title: t('FEMALE'), Key: 2 },
      { IconName: 'transgender-outline', Title: t('TRANSSEXUAL'), Key: 3 },
    ],
    [t],
  );

  const handleToggle = (key) => {
    setUserState(prev => {
      const arr = prev.genderLookingFor ? [...prev.genderLookingFor] : [];
      if (arr.includes(key)) {
        return { ...prev, genderLookingFor: arr.filter(k => k !== key) };
      } else {
        return { ...prev, genderLookingFor: [...arr, key] };
      }
    });
  };

  const handleSave = async () => {
    try {
      await firestore().collection('Users').doc(user.id).update(user);
      dispatch(setUser({ user, dataLoaded: true }));
      goBack();
    } catch (error) {
      console.error('Fehler beim Speichern des Users:', error);
    }
  };

  return (
    <Wrapper isMain>
      <Headers.Primary showBackArrow title={t('MYSEARCH')} />
      <Spacer isBasic />
      {Data.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={{ marginVertical: sizes.TinyMargin }}
          onPress={() => handleToggle(item.Key)}>
          <Wrapper
            marginHorizontalSmall
            paddingHorizontalBase
            flexDirectionRow
            alignItemsCenter
            justifyContentSpaceBetween
            style={[
              {
                height: sizes.inputHeight,
                borderWidth: 1,
                borderRadius: responsiveWidth(100),
                borderColor: colors.appBorderColor2,
              },
              user.genderLookingFor?.includes(item.Key) && {
                backgroundColor: colors.appPrimaryColor,
                borderWidth: 0,
              },
            ]}>
            <Wrapper flexDirectionRow alignItemsCenter>
              {item.Key === 1 && (
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" style={{ marginRight: 12 }}>
                  <G clipPath="url(#clip0_male_row)">
                    <Path fillRule="evenodd" clipRule="evenodd" d="M19 4C19.5523 4 20 4.44772 20 5V10C20 10.5523 19.5523 11 19 11C18.4477 11 18 10.5523 18 10V7.41382L14.8906 10.5232C15.5891 11.5041 16 12.7041 16 14C16 17.3137 13.3137 20 10 20C6.68629 20 4 17.3137 4 14C4 10.6863 6.68629 8 10 8C11.2957 8 12.4955 8.41073 13.4763 9.10909L16.5854 6H14C13.4477 6 13 5.55228 13 5C13 4.44772 13.4477 4 14 4H18.9994H18.9998H19ZM6 14C6 11.7909 7.79086 10 10 10C12.2091 10 14 11.7909 14 14C14 16.2091 12.2091 18 10 18C7.79086 18 6 16.2091 6 14Z" fill={user.genderLookingFor?.includes(item.Key) ? colors.appBgColor1 : "url(#paint0_linear_male_row)"} />
                  </G>
                  <Defs>
                    <LinearGradient id="paint0_linear_male_row" x1="12" y1="4" x2="12" y2="20" gradientUnits="userSpaceOnUse">
                      <Stop stopColor="#C61323" />
                      <Stop offset="1" stopColor="#9B0207" />
                    </LinearGradient>
                    <ClipPath id="clip0_male_row">
                      <Rect width="24" height="24" fill="white" />
                    </ClipPath>
                  </Defs>
                </Svg>
              )}
              {item.Key === 2 && (
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" style={{ marginRight: 12 }}>
                  <G clipPath="url(#clip0_female_row)">
                    <Path fillRule="evenodd" clipRule="evenodd" d="M12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5ZM18 9C18 11.973 15.8377 14.441 13 14.917V17H15C15.5523 17 16 17.4477 16 18C16 18.5523 15.5523 19 15 19H13V21C13 21.5523 12.5523 22 12 22C11.4477 22 11 21.5523 11 21V19H9C8.44772 19 8 18.5523 8 18C8 17.4477 8.44772 17 9 17H11V14.917C8.16229 14.441 6 11.973 6 9C6 5.68629 8.68629 3 12 3C15.3137 3 18 5.68629 18 9Z" fill={user.genderLookingFor?.includes(item.Key) ? colors.appBgColor1 : "url(#paint0_linear_female_row)"} />
                  </G>
                  <Defs>
                    <LinearGradient id="paint0_linear_female_row" x1="12" y1="3" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                      <Stop stopColor="#C61323" />
                      <Stop offset="1" stopColor="#9B0207" />
                    </LinearGradient>
                    <ClipPath id="clip0_female_row">
                      <Rect width="24" height="24" fill="white" />
                    </ClipPath>
                  </Defs>
                </Svg>
              )}
              {item.Key === 3 && (
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" style={{ marginRight: 12 }}>
                  <G clipPath="url(#clip0_transgender_row)">
                    <Path fillRule="evenodd" clipRule="evenodd" d="M21 1C21.5523 1 22 1.44772 22 2V7C22 7.55228 21.5523 8 21 8C20.4477 8 20 7.55228 20 7V4.41382L16.8906 7.52324C17.5891 8.5041 18 9.70407 18 11C18 14.3137 15.3137 17 12 17C8.68629 17 6 14.3137 6 11C6 7.68629 8.68629 5 12 5C13.2957 5 14.4955 5.41073 15.4763 6.10909L18.5854 3H16C15.4477 3 15 2.55228 15 2C15 1.44772 15.4477 1 16 1H20.9994H20.9998H21ZM8 11C8 8.79086 9.79086 7 12 7C14.2091 7 16 8.79086 16 11C16 13.2091 14.2091 15 12 15C9.79086 15 8 13.2091 8 11Z" fill={user.genderLookingFor?.includes(item.Key) ? colors.appBgColor1 : "url(#paint0_linear_transgender_row)"} />
                    <Path fillRule="evenodd" clipRule="evenodd" d="M3 1C2.44772 1 2 1.44772 2 2V7C2 7.55228 2.44771 8 3 8C3.55229 8 4 7.55228 4 7V4.41382L7.10942 7.52324C6.41086 8.5041 6 9.70407 6 11C6 14.3137 8.68629 17 12 17C15.3137 17 18 14.3137 18 11C18 7.68629 15.3137 5 12 5C10.7043 5 9.50447 5.41073 8.52369 6.10909L5.4146 3H8C8.55229 3 9 2.55228 9 2C9 1.44772 8.55229 1 8 1H3.00056H3.00022H3ZM16 11C16 8.79086 14.2091 7 12 7C9.79086 7 8 8.79086 8 11C8 13.2091 9.79086 15 12 15C14.2091 15 16 13.2091 16 11Z" fill={user.genderLookingFor?.includes(item.Key) ? colors.appBgColor1 : "url(#paint1_linear_transgender_row)"} />
                    <Path fillRule="evenodd" clipRule="evenodd" d="M12 7C9.79086 7 8 8.79086 8 11C8 13.2091 9.79086 15 12 15C14.2091 15 16 13.2091 16 11C16 8.79086 14.2091 7 12 7ZM18 11C18 13.973 15.8377 16.441 13 16.917V19H15C15.5523 19 16 19.4477 16 20C16 20.5523 15.5523 21 15 21H13V23C13 23.5523 12.5523 24 12 24C11.4477 24 11 23.5523 11 23V21H9C8.44772 21 8 20.5523 8 20C8 19.4477 8.44772 19 9 19H11V16.917C8.16229 16.441 6 13.973 6 11C6 7.68629 8.68629 5 12 5C15.3137 5 18 7.68629 18 11Z" fill={user.genderLookingFor?.includes(item.Key) ? colors.appBgColor1 : "url(#paint2_linear_transgender_row)"} />
                  </G>
                  <Defs>
                    <LinearGradient id="paint0_linear_transgender_row" x1="14" y1="1" x2="14" y2="17" gradientUnits="userSpaceOnUse">
                      <Stop stopColor="#C61323" />
                      <Stop offset="1" stopColor="#9B0207" />
                    </LinearGradient>
                    <LinearGradient id="paint1_linear_transgender_row" x1="10" y1="1" x2="10" y2="17" gradientUnits="userSpaceOnUse">
                      <Stop stopColor="#C61323" />
                      <Stop offset="1" stopColor="#9B0207" />
                    </LinearGradient>
                    <LinearGradient id="paint2_linear_transgender_row" x1="12" y1="5" x2="12" y2="24" gradientUnits="userSpaceOnUse">
                      <Stop stopColor="#C61323" />
                      <Stop offset="1" stopColor="#9B0207" />
                    </LinearGradient>
                    <ClipPath id="clip0_transgender_row">
                      <Rect width="24" height="24" fill="white" />
                    </ClipPath>
                  </Defs>
                </Svg>
              )}
              <Text
                isRegular
                style={{
                  fontSize: fontSizes.regular,
                  fontFamily: appFonts.appTextRegular,
                  color: user.genderLookingFor?.includes(item.Key) ? colors.appBgColor1 : colors.appTextColor2,
                }}
              >
                {item.Title}
              </Text>
            </Wrapper>
            {user.genderLookingFor?.includes(item.Key) && <Icons.Custom icon={appIcons.Tick} />}
          </Wrapper>
        </TouchableOpacity>
      ))}
      <Wrapper
        flex={1}
        justifyContentFlexend
        paddingVerticalSmall>
        <Buttons.Colored text={t('SAVE')} onPress={handleSave} />
      </Wrapper>
    </Wrapper>
  );
}
