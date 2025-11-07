import {StyleSheet, View} from 'react-native';
import React from 'react';
import {
  Headers,
  ScrollViews,
  Spacer,
  StatusBars,
  Text,
  Wrapper,
  Loaders,
  Icons,
} from '../../../components';
import {appStyles, colors, responsiveFontSize, responsiveWidth, appIcons} from '../../../services';
import {useHooks} from './hooks';
import { useTranslation } from 'react-i18next';
import {color} from '@rneui/base';
import { useSelector } from 'react-redux';

export default function Index() {
  const {data, loading} = useHooks();
  const { t } = useTranslation();
  const me = useSelector(state => state.auth.user);
  const coinsBalance = Number(me?.coins ?? me?._coins ?? me?.credit ?? 0);

  const isRevenue = (row) => {
    const amountStr = (row?.Amount || '').toString().trim();
    // Prefer explicit sign if present: + green (revenue), - red (spend)
    if (amountStr.startsWith('+')) return true;
    if (amountStr.startsWith('-')) return false;
    // Fallbacks via keywords
    const type = (row?.type || '').toLowerCase();
    const activity = (row?.Activity || '').toLowerCase();
    // Revenue when coins purchased/credited
    if (type.includes('purchase') || type.includes('buy') || activity.includes('purchase') || activity.includes('buy') || activity.includes('credit')) return true;
    // Spend when boost or spend keyword
    if (type.includes('boost') || activity.includes('boost') || type.includes('spend') || activity.includes('spend') || activity.includes('debit')) return false;
    // Default: treat non-negative numeric as revenue
    const num = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) return num >= 0;
    // Default to spend if unknown
    return false;
  };
  
  if (loading) {
    return (
      <Wrapper isMain>
        <Headers.Primary
          title={t('MYCREDIT')}
          showBackArrow />
        <Spacer isBasic />
        <Wrapper flex={1} justifyContentCenter alignItemsCenter>
          <Loaders.Primary />
        </Wrapper>
      </Wrapper>
    );
  }

  return (
    <Wrapper isMain>
      <Headers.Primary
      title={t('MYCREDIT')}
      showBackArrow />
      <Spacer isBasic />
      {/* Current Coins Balance - Card */}
      <Wrapper
        marginHorizontalBase
        paddingHorizontalBase
        paddingVerticalSmall
        style={{
          borderRadius: 12,
          backgroundColor: colors.appPrimaryColor
        }}
      >
        <Wrapper flexDirectionRow alignItemsCenter justifyContentSpaceBetween>
          <Wrapper flexDirectionRow alignItemsCenter>
            <Icons.Custom icon={appIcons.Coin} size={responsiveWidth(8)} />
            <Spacer horizontal isSmall />
            <Text isSmall isMediumFont style={{color: '#fff'}}>{t('CURRENTBALANCE')}</Text>
          </Wrapper>
          <Text isHeadingTitle isBoldFont style={{color: '#fff'}}>{coinsBalance}</Text>
        </Wrapper>
      </Wrapper>
      <Spacer isBasic />
      <ScrollViews.KeyboardAvoiding>
        {/* Table Header */}
        <Wrapper
          paddingVerticalSmall
          flexDirectionRow
          alignItemsCenter
          justifyContentSpaceBetween
          style={{
            borderTopWidth: StyleSheet.hairlineWidth,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: 'rgba(0,0,0,0.12)',
            paddingHorizontal: responsiveWidth(4)
          }}
        >
          <Wrapper style={{flex: 0.34}}>
            <Text isSmall isBoldFont>{t('DATE')}</Text>
          </Wrapper>
          <Wrapper style={{flex: 0.46}}>
            <Text isSmall isBoldFont alignTextLeft>{t('ACTIVITY')}</Text>
          </Wrapper>
          <Wrapper style={{flex: 0.20}}>
            <Text isSmall isBoldFont alignTextRight>{t('AMOUNT')}</Text>
          </Wrapper>
        </Wrapper>
        {/* rows */}
        {(() => {
          const filtered = (data || []).filter(eachRow => {
            const type = (eachRow?.type || '').toString().toLowerCase();
            const activity = (eachRow?.Activity || '').toString().toLowerCase();
            const isSubscription = type.includes('subscription') || activity.includes('subscription') || activity.includes('abo') || activity.includes('membership');
            const hasCoins = type.includes('coin') || activity.includes('coin');
            const isBoost = type.includes('boost') || activity.includes('boost');
            // Show any coin-related transaction (purchase/spend) and boosts; exclude only subscriptions
            return !isSubscription && (hasCoins || isBoost);
          });
          if (filtered.length === 0) {
            return (
              <Wrapper flex={1} justifyContentCenter alignItemsCenter paddingVerticalLarge>
                <Text isRegular isRegularFont isTextColor2>
                  {t('NOTRANSACTIONS')}
                </Text>
              </Wrapper>
            );
          }
          return filtered.map((eachRow, index) => {
            const isRevenueRow = isRevenue(eachRow);
            const textColor = isRevenueRow ? colors.success : colors.error;
            return (
              <Wrapper
                key={index}
                paddingVerticalSmall
                flexDirectionRow
                alignItemsCenter
                justifyContentSpaceBetween
                style={{backgroundColor: '#fff', paddingHorizontal: responsiveWidth(4)}}
              >
                <Wrapper style={{flex: 0.34}}>
                  <Text isSmall isRegularFont style={{color: textColor}}>
                    {eachRow.Date}
                  </Text>
                </Wrapper>
                <Wrapper style={{flex: 0.46}}>
                  <Text isSmall isRegularFont numberOfLines={2} style={{color: textColor}}>
                    {eachRow.Activity}
                  </Text>
                </Wrapper>
                <Wrapper style={{flex: 0.20}}>
                  <Text isSmall isBoldFont alignTextRight style={{color: textColor}}>
                    {eachRow.Amount}
                  </Text>
                </Wrapper>
              </Wrapper>
            );
          });
        })()}
      </ScrollViews.KeyboardAvoiding>
    </Wrapper>
  );
}

const styles = StyleSheet.create({});
