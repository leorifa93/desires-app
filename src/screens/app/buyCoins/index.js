import { StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import React from 'react';
import {
  Headers,
  ScrollViews,
  Spacer,
  Text,
  Wrapper,
  Loaders,
  Icons,
} from '../../../components';
import {
  colors,
  responsiveHeight,
  responsiveWidth,
  sizes,
  appIcons,
} from '../../../services';
import { useHooks } from './hooks';
import { useTranslation } from 'react-i18next';

export default function Index() {
  const { t } = useTranslation();
  const { 
    data, 
    loading, 
    purchasing, 
    selectedProduct, 
    handlePurchase 
  } = useHooks();

  const handleProductSelect = (product) => {
    handlePurchase(product);
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleProductSelect(item)}
      style={[
        styles.productItem,
        selectedProduct?.id === item.id && styles.selectedProduct
      ]}
    >
      <Wrapper
        flexDirectionRow
        alignItemsCenter
        justifyContentSpaceBetween
        paddingHorizontalSmall
        paddingVerticalSmall
        style={styles.productContainer}
        backgroundColor={colors.appModalOptionBGColor}
      >
        <Wrapper flexDirectionRow alignItemsCenter>
          <Wrapper isCenter style={styles.iconContainer}>
            <Icons.Custom icon={appIcons.Coin} size={responsiveWidth(8)} />
          </Wrapper>
          <Text
            isRegular
            style={{fontFamily: 'Poppins-Medium'}}
            children={`${item.title} - ${item.price}`}
          />
        </Wrapper>
        {selectedProduct?.id === item.id && (
          <Icons.Custom
            icon={appIcons.Tick}
            size={responsiveWidth(5)}
            tintColor={colors.appPrimaryColor}
          />
        )}
      </Wrapper>
    </TouchableOpacity>
  );

  return (
    <Wrapper isMain>
      <Headers.Primary showBackArrow title={t('BUY_COINS')} />

      {loading ? (
        <Loaders.Primary />
      ) : (
        <FlatList
          data={data}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <>
              <Spacer isBasic />
              <Text alignTextCenter isTextColor2 isRegular isRegularFont>
                {t('BUY_COINS_DESCRIPTION')}
              </Text>
              <Spacer isBasic />
            </>
          )}
          ItemSeparatorComponent={() => <Spacer height={responsiveHeight(1.5)} />}
          ListFooterComponent={() => <Spacer height={responsiveHeight(15)} />}
          contentContainerStyle={{ paddingBottom: responsiveHeight(2) }}
        />
      )}

      {purchasing && (
        <Wrapper
          isAbsolute
          style={styles.loadingOverlay}
          backgroundColor="rgba(0,0,0,0.5)"
        >
          <Wrapper
            backgroundColor={colors.appBgColor1}
            paddingHorizontalSmall
            paddingVerticalSmall
            style={styles.loadingModal}
          >
            <Text isRegular isMediumFont alignTextCenter>
              {t('PROCESSING_PURCHASE')}
            </Text>
            <Spacer isTiny />
            <Text isSmall alignTextCenter isTextColor2>
              {t('PLEASE_WAIT')}
            </Text>
            <Spacer isBasic />
            <Loaders.Secondary isVisible={true} />
          </Wrapper>
        </Wrapper>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  productItem: {
    marginHorizontal: sizes.baseMargin,
    borderColor: colors.appBorderColor1,
    borderWidth: 2,
    borderRadius: responsiveWidth(3),
  },
  selectedProduct: {
    borderWidth: 2,
    borderColor: colors.appPrimaryColor,
    borderRadius: responsiveWidth(3),
  },
  productContainer: {
    borderRadius: responsiveWidth(3),
  },
  iconContainer: {
    height: responsiveWidth(12),
    width: responsiveWidth(12),
    borderRadius: responsiveWidth(100),
    backgroundColor: colors.appBgColor1,
    marginRight: responsiveWidth(3),
  },
  loadingOverlay: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModal: {
    borderRadius: responsiveWidth(3),
    minWidth: responsiveWidth(60),
  },
  productCard: {
    borderWidth: 2,
    borderColor: '#FFD700', // Gold, passe ggf. an dein App-Design an
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3, // für Android
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: '#666',
  },
});
