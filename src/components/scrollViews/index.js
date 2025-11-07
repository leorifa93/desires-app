import React, {useRef, useState, useEffect, useLayoutEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import {KeyboardAwareScrollView} from '@codler/react-native-keyboard-aware-scroll-view';
import {colors, responsiveHeight, responsiveWidth} from '../../services';
import {scale} from 'react-native-size-matters';
import {Wrapper} from '..';

const isTablet = () => {
  const {width, height} = Dimensions.get('window');
  return (
    (Platform.OS === 'android' && (width >= 600 || height >= 600)) ||
    (Platform.OS === 'ios' && Platform.isPad) ||
    (width >= 768 && height >= 768)
  );
};

export function KeyboardAvoiding({children, style, animation}) {
  return (
    <KeyboardAwareScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always">
      {children}
    </KeyboardAwareScrollView>
  );
}

export function WithKeyboardAvoidingView({children, footer, containerStyle, scrollStyle, scrollEnabled = true, scrollViewRef, onScroll}) {
  return (
    <KeyboardAwareScrollView
      innerRef={scrollViewRef}
      showsVerticalScrollIndicator={false}
      style={[{flex: 1}, containerStyle, scrollStyle]}
      contentContainerStyle={{flexGrow: 1}}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={Platform.OS === 'android' ? 20 : 250}
      extraHeight={Platform.OS === 'android' ? 20 : 250}
      enableResetScrollToCoords={false}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={scrollEnabled}
      onScroll={onScroll}
      scrollEventThrottle={16}
      keyboardOpeningTime={0}
      viewIsInsideTabBar={false}
      nestedScrollEnabled={true}
    >
      {children}
      {footer}
    </KeyboardAwareScrollView>
  );
}

export const HorizontalScrollWithDots = ({Data, RenderItem, currentIndex, onIndexChange, hideDots = false}) => {
  const {width} = Dimensions.get('screen');
  const [activeIndex, setActiveIndex] = useState(currentIndex || 0);
  const scrollViewRef = useRef(null);
  const lastCurrentIndex = useRef(currentIndex);
  const ignoreNextScroll = useRef(false);

  useLayoutEffect(() => {
    if (typeof currentIndex === 'number' && scrollViewRef.current && currentIndex !== lastCurrentIndex.current) {
      scrollViewRef.current.scrollTo({x: currentIndex * width, animated: currentIndex !== 0});
      setActiveIndex(currentIndex);
      lastCurrentIndex.current = currentIndex;
      ignoreNextScroll.current = true;
    }
  }, [currentIndex, width]);

  const onScroll = event => {
    if (ignoreNextScroll.current) {
      ignoreNextScroll.current = false;
      return;
    }
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setActiveIndex(currentIndex);
    if (onIndexChange) {
      onIndexChange(currentIndex);
    }
  };

  const scrollToIndex = index => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({x: index * width, animated: true});
    }
  };
  const tablet = isTablet();
  const styles = StyleSheet.create({
    container: {
      //flex: 1,
      //backgroundColor: '#fff',
    },
    itemContainer: {
      //width: width,
      justifyContent: 'center',
      alignItems: 'center',
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: tablet ? 5 : 10,
      //backgroundColor: 'red',
    },
    dot: {
      height: scale(8),
      width: scale(8),
      borderRadius: responsiveWidth(20),
      marginHorizontal: responsiveWidth(1),
    },
    activeDot: {
      //width: responsiveWidth(6),
      backgroundColor: colors.appPrimaryColor,
    },
    inactiveDot: {
      backgroundColor: colors.appBorderColor1,
    },
  });

  return (
    <View>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}>
          {Data.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <RenderItem item={item} index={index} />
            </View>
          ))}
        </ScrollView>
      </View>
      {!hideDots && (
        tablet ? (
          <Wrapper paddingVerticalTiny>
            <View style={styles.paginationContainer}>
              {Data.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activeIndex === index ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
          </Wrapper>
        ) : (
          <Wrapper paddingVerticalBase flex={1}>
            <View style={styles.paginationContainer}>
              {Data.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activeIndex === index ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
          </Wrapper>
        )
      )}
    </View>
  );
};
