import {StyleSheet} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Buttons,
  Headers,
  Icons,
  Labels,
  Lines,
  Spacer,
  Switches,
  Text,
  Wrapper,
} from '../../../components';
import {
  appIcons,
  appStyles,
  fontSizes,
  responsiveHeight,
  responsiveWidth,
} from '../../../services';
import {navigate} from '../../../navigation/rootNavigation';
import { useSelector, useDispatch } from 'react-redux';
import { getRangPosition, updateUser } from '../../../services/firebaseUtilities/user';
import { setBoost, setNextBoost } from '../../../services/boostService';
import { setUser } from '../../../store/actions/auth';
import { Alert } from 'react-native';
import { routes } from '../../../services/constants';
import { Simple as DropdownSimple } from '../../../components/dropdowns';

const Index = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const me = useSelector(state => state.auth.user);
  
  const [boostSettings, setBoostSettings] = useState({
    isInterval: false,
    interval: 'everyHour',
    nextBoostAt: null
  });
  const [currentPosition, setCurrentPosition] = useState(1);
  const [loading, setLoading] = useState(true);

  const intervalOptions = [
    'everyHour', 
    'every2Hour', 
    'every4Hour', 
    'every6Hour', 
    'every8Hour', 
    'every12Hour', 
    'every24Hour'
  ];

  useEffect(() => {
    if (me?.boostSettings) {
      setBoostSettings(me.boostSettings);
    }
    getCurrentPosition();
  }, [me]);

  const getCurrentPosition = async () => {
    try {
      setLoading(true);
      const position = await getRangPosition(me);
      setCurrentPosition(position);
    } catch (error) {
      console.error('Error getting position:', error);
      setCurrentPosition(1);
    } finally {
      setLoading(false);
    }
  };

  const handleIntervalToggle = async (value) => {
    try {
      const newSettings = {
        ...boostSettings,
        isInterval: value
      };
      
      if (!value) {
        delete newSettings.nextBoostAt;
      }
      
      setBoostSettings(newSettings);
      
      // Update user in database
      const updatedUser = {
        ...me,
        boostSettings: newSettings
      };
      
      await updateUser(me.id, updatedUser);
      
      // Update Redux state
      dispatch(setUser(updatedUser));
      
      // If interval is enabled, set next boost
      if (value) {
        try {
          const result = await setNextBoost(me.id);
          if (!result.success) {
            console.log('setNextBoost failed but continuing:', result.error);
          }
        } catch (error) {
          console.log('setNextBoost error but continuing:', error.message);
        }
      }
    } catch (error) {
      console.error('Error updating interval settings:', error);
      Alert.alert(t('ERROR'), t('ERROR_UPDATING_SETTINGS'));
    }
  };

  const handleIntervalChange = async (interval) => {
    try {
      const newSettings = {
        ...boostSettings,
        interval
      };
      setBoostSettings(newSettings);
      
      // Update user in database
      const updatedUser = {
        ...me,
        boostSettings: newSettings
      };
      
      await updateUser(me.id, updatedUser);
      
      // Update Redux state
      dispatch(setUser(updatedUser));
      
      // Set next boost
      try {
        const result = await setNextBoost(me.id);
        if (!result.success) {
          console.log('setNextBoost failed but continuing:', result.error);
        }
      } catch (error) {
        console.log('setNextBoost error but continuing:', error.message);
      }
    } catch (error) {
      console.error('Error updating interval:', error);
      Alert.alert(t('ERROR'), t('ERROR_UPDATING_SETTINGS'));
    }
  };

  const handleSetBoost = async () => {
    try {
      console.log('Boost: Starting boost for user', me.id);
      
      if (me.availableCoins > 0) {
        // Create a minimal update object to avoid serialization issues
        const boostUpdate = {
          lastBoostAt: new Date().getTime() / 1000,
          availableCoins: me.availableCoins - 1
        };
        
        // Create updated user object
        const updatedUser = {
          ...me,
          ...boostUpdate
        };
        
        console.log('Boost: Updated user lastBoostAt:', updatedUser.lastBoostAt, 'coins:', updatedUser.availableCoins);
        
        // Update Redux state immediately - with error handling
        try {
          dispatch(setUser({ user: updatedUser, dataLoaded: true }));
          console.log('Boost: Redux state updated successfully');
          
          // Recalculate position with updated user data
          setTimeout(async () => {
            console.log('Boost: Recalculating position with updated user data');
            try {
              const position = await getRangPosition(updatedUser);
              console.log('Boost: New position calculated:', position);
              setCurrentPosition(position);
            } catch (error) {
              console.error('Boost: Error recalculating position:', error);
            }
          }, 100); // Small delay to ensure Redux state is updated
          
        } catch (reduxError) {
          console.error('Boost: Redux state update failed:', reduxError);
          Alert.alert(t('ERROR'), 'Redux state update failed: ' + reduxError.message);
          return;
        }
        
        // Show success message - user navigates themselves
        Alert.alert(t('SUCCESS'), t('PROFILEBOOSTED'));
        
        // Call setBoost in background immediately
        console.log('Boost: Starting background setBoost to save to Firestore');
        setBoost(me).catch(error => {
          console.error('Boost: Background setBoost failed:', error);
          // If background boost fails, revert the changes
          dispatch(setUser(me));
        });
        
      } else {
        Alert.alert(
          t('NOTENOUGHCOINS'),
          t('NOTENOUGHCOINS_MESSAGE'),
          [
            { text: t('CANCEL'), style: 'cancel' },
            { text: t('BUY_COINS'), onPress: () => {
              // Navigate to buy coins screen
              navigate(routes.buyCoins);
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Boost: Unexpected error:', error);
      Alert.alert(t('ERROR'), t('ERROR_OCCURRED'));
    }
  };

  const formatHour = (time) => {
    if (!time) return '';
    
    const splittedTime = time.toString().split(':');
    let h = splittedTime[0];
    const m = splittedTime[1];
    const s = splittedTime[2];

    if (parseInt(h) + 1 === 24) {
      h = '00';
    } else {
      h = (parseInt(h) + 1 > 9 ? '' : '0') + (parseInt(h) + 1);
    }

    return h + ':' + m + ':' + s;
  };
  
  return (
    <Wrapper isMain>
      <Headers.Primary showBackArrow title={t('POSITION_TITLE')} />
      <Icons.Custom
        containerStyle={[appStyles.center]}
        icon={appIcons.PositionBackground}
        Height={responsiveHeight(20)}
        Width={responsiveWidth(60)}
      />
      <Spacer isBasic />
      <Wrapper
        flexDirectionRow
        marginHorizontalBase
        alignItemsCenter
        justifyContentSpaceBetween>
        <Text isRegular isRegularFont children={t('ACTIVATEINTERVALL')} />
        <Switches.Custom 
          value={boostSettings.isInterval}
          onValueChange={handleIntervalToggle}
        />
      </Wrapper>
      <Spacer isBasic />
      <Labels.Normal
        Label={`${t('POSITION')} ${currentPosition}`}
        alignTextCenter
        FontSize={fontSizes.large}
      />
      <Spacer isBasic />
      <Wrapper marginHorizontalBase isCenter>
        <Text isRegular isRegularFont isTextColor2 alignTextCenter>
          {t('YOUAREONPOSITION')} {currentPosition} {t('USEABOOST')}
        </Text>
        <Spacer isMedium />
        <Text isRegular isRegularFont isTextColor2 alignTextCenter>
          {t('BOOSTINFO')}
        </Text>
      </Wrapper>
      
      {boostSettings.isInterval && (
        <>
          <Spacer isBasic />
          <Wrapper marginHorizontalBase>
            <DropdownSimple
              DropdownData={intervalOptions.map(option => ({
                label: t(option),
                value: option
              }))}
              DefaultValue={boostSettings.interval}
              onValueChange={handleIntervalChange}
              DropdownPlaceHolder={t('PLEASECHOOSE')}
              ContainerWidth={responsiveWidth(80)}
            />
            
            {boostSettings.interval && boostSettings.nextBoostAt && (
              <>
                <Spacer isBasic />
                <Text 
                  isRegular 
                  isRegularFont 
                  isTextColor2 
                  alignTextCenter
                  children={`${t('NEXTBOOSTIS')}: ${formatHour(boostSettings.nextBoostAt)}`}
                />
              </>
            )}
          </Wrapper>
        </>
      )}
      
      <Spacer isMedium />
      <Wrapper flexDirectionRow alignItemsCenter justifyContentCenter>
        <Lines.Horizontal width={responsiveWidth(20)} />
        <Spacer horizontal isBasic />
        <Text isTextColor2 children={t('OR')} />
        <Spacer horizontal isBasic />
        <Lines.Horizontal width={responsiveWidth(20)} />
      </Wrapper>
      <Spacer isMedium />
      <Wrapper marginHorizontalBase>
        <Text isRegular isRegularFont isTextColor2 alignTextCenter>
          {t('INSTANTBOOSTINFO')}
        </Text>
      </Wrapper>
      <Wrapper
        flex={1}
        justifyContentFlexend
        paddingVerticalBase
      >
        <Buttons.Colored
          text={t('USEBOOST')}
          onPress={handleSetBoost}
          disabled={loading}
        />
      </Wrapper>
    </Wrapper>
  );
};

export default Index;

const styles = StyleSheet.create({});
