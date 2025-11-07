import {StyleSheet, Text, View} from 'react-native';
import React, {useState, useEffect} from 'react';
import {Labels, Wrapper} from '..';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import {
  appStyles,
  colors,
  responsiveHeight,
  responsiveWidth,
} from '../../services';
import {scale} from 'react-native-size-matters';

export function PrimarySlider({
  SliderLabel,
  SliderValue,
  isMulti = false,
  ValueLabel,
}) {
  // Initialize state for single or multi values
  const [Value, setValue] = useState(
    SliderValue ? SliderValue : isMulti ? [0, 10] : [10],
  );

  // Update state when SliderValue prop changes
  useEffect(() => {
    if (SliderValue && Array.isArray(SliderValue)) {
      setValue(SliderValue);
    }
  }, [SliderValue]);

  // Handle changes in slider values (single or multi marker)
  const handleValuesChange = values => {
    setValue(values);
  };

  return (
    <Wrapper marginHorizontalBase>
      {SliderLabel ? (
        <Labels.Normal
          Label={SliderLabel}
          NoMargin
          // If `isMulti` is true, show the range; otherwise, show only one value
          RightText={
            isMulti
              ? `${Value?.[0]} - ${Value[1]}${
                  ValueLabel ? ` ${ValueLabel}` : ''
                }`
              : `${Value[0]}${ValueLabel ? `${ValueLabel}` : ''}`
          }
        />
      ) : null}

      <Wrapper paddingVerticalSmall>
        <MultiSlider
          isMulti={isMulti} // Enables multiple markers (2 in this case)
          values={Value} // Array for two marker positions or single value
          min={0} // Minimum value of the slider
          max={100} // Maximum value of the slider
          step={1} // Step value
          onValuesChange={handleValuesChange} // Handle slider value change
          markerStyle={styles.PrimaryMarkerStyle}
          sliderLength={responsiveWidth(90)}
          trackStyle={styles.PrimaryTrackStyle}
          markerContainerStyle={styles.PrimaryMarkerContainerStyle}
          selectedStyle={styles.PrimarySelectedStyle}
        />
      </Wrapper>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  PrimaryTrackStyle: {
    backgroundColor: colors.appBorderColor2,
    height: responsiveHeight(0.5),
    borderRadius: responsiveWidth(100),
  },
  PrimaryMarkerContainerStyle: {
    top: -22,
  },
  PrimarySelectedStyle: {
    backgroundColor: colors.appBGColor,
  },
  PrimaryMarkerStyle: {
    height: scale(24),
    width: scale(24),
    borderRadius: responsiveWidth(100),
    backgroundColor: colors.appBGColor,
    borderWidth: 2,
    borderColor: colors.appBgColor1,
    ...appStyles.shadowDark,
  },
});
