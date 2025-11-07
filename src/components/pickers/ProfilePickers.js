import React from 'react';
import { TouchableOpacity, ScrollView } from 'react-native';
import { Wrapper, Text } from '../';
import { colors, responsiveWidth, responsiveHeight, scale, fontSizes } from '../../services';

// Height Picker Component
export const HeightPicker = ({ visible, onClose, onSelect, currentValue, t }) => {
  if (!visible) return null;

  const heights = Array.from({ length: 91 }, (_, i) => 130 + i);

  return (
    <Wrapper style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 999999,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Wrapper style={{
        backgroundColor: colors.appBgColor1,
        borderRadius: scale(15),
        maxHeight: responsiveHeight(70),
        width: responsiveWidth(85),
        padding: scale(20),
      }}>
        <Wrapper style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: scale(15),
          borderBottomWidth: 1,
          borderBottomColor: colors.appBorderColor2,
        }}>
          <Text style={{ fontSize: fontSizes.large, fontWeight: 'bold' }}>
            {t('height')}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: fontSizes.large, color: colors.appTextColor1 }}>
              ✕
            </Text>
          </TouchableOpacity>
        </Wrapper>
        
        <ScrollView style={{ flex: 1, marginTop: scale(15) }}>
          {heights.map((height) => (
            <TouchableOpacity
              key={height}
              onPress={() => {
                onSelect(height);
                onClose();
              }}
              style={{
                paddingVertical: scale(12),
                paddingHorizontal: scale(15),
                borderBottomWidth: 1,
                borderBottomColor: colors.appBorderColor2,
                backgroundColor: currentValue === height ? colors.appPrimaryColor + '20' : 'transparent',
              }}
            >
              <Text style={{
                fontSize: fontSizes.regular,
                color: currentValue === height ? colors.appPrimaryColor : colors.appTextColor1,
                fontWeight: currentValue === height ? 'bold' : 'normal',
              }}>
                {height} cm
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Wrapper>
    </Wrapper>
  );
};

// Weight Picker Component
export const WeightPicker = ({ visible, onClose, onSelect, currentValue, t }) => {
  if (!visible) return null;

  const weights = Array.from({ length: 200 }, (_, i) => 30 + i);

  return (
    <Wrapper style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 999999,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Wrapper style={{
        backgroundColor: colors.appBgColor1,
        borderRadius: scale(15),
        maxHeight: responsiveHeight(70),
        width: responsiveWidth(85),
        padding: scale(20),
      }}>
        <Wrapper style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: scale(15),
          borderBottomWidth: 1,
          borderBottomColor: colors.appBorderColor2,
        }}>
          <Text style={{ fontSize: fontSizes.large, fontWeight: 'bold' }}>
            {t('weight')}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: fontSizes.large, color: colors.appTextColor1 }}>
              ✕
            </Text>
          </TouchableOpacity>
        </Wrapper>
        
        <ScrollView style={{ flex: 1, marginTop: scale(15) }}>
          {weights.map((weight) => (
            <TouchableOpacity
              key={weight}
              onPress={() => {
                onSelect(weight);
                onClose();
              }}
              style={{
                paddingVertical: scale(12),
                paddingHorizontal: scale(15),
                borderBottomWidth: 1,
                borderBottomColor: colors.appBorderColor2,
                backgroundColor: currentValue === weight ? colors.appPrimaryColor + '20' : 'transparent',
              }}
            >
              <Text style={{
                fontSize: fontSizes.regular,
                color: currentValue === weight ? colors.appPrimaryColor : colors.appTextColor1,
                fontWeight: currentValue === weight ? 'bold' : 'normal',
              }}>
                {weight} kg
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Wrapper>
    </Wrapper>
  );
};

// Chest Picker Component
export const ChestPicker = ({ visible, onClose, onSelect, currentValue, t }) => {
  if (!visible) return null;

  const chestSizes = Array.from({ length: 100 }, (_, i) => 60 + i);

  return (
    <Wrapper style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 999999,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Wrapper style={{
        backgroundColor: colors.appBgColor1,
        borderRadius: scale(15),
        maxHeight: responsiveHeight(70),
        width: responsiveWidth(85),
        padding: scale(20),
      }}>
        <Wrapper style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: scale(15),
          borderBottomWidth: 1,
          borderBottomColor: colors.appBorderColor2,
        }}>
          <Text style={{ fontSize: fontSizes.large, fontWeight: 'bold' }}>
            {t('chest')}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: fontSizes.large, color: colors.appTextColor1 }}>
              ✕
            </Text>
          </TouchableOpacity>
        </Wrapper>
        
        <ScrollView style={{ flex: 1, marginTop: scale(15) }}>
          {chestSizes.map((chest) => (
            <TouchableOpacity
              key={chest}
              onPress={() => {
                onSelect(chest);
                onClose();
              }}
              style={{
                paddingVertical: scale(12),
                paddingHorizontal: scale(15),
                borderBottomWidth: 1,
                borderBottomColor: colors.appBorderColor2,
                backgroundColor: currentValue === chest ? colors.appPrimaryColor + '20' : 'transparent',
              }}
            >
              <Text style={{
                fontSize: fontSizes.regular,
                color: currentValue === chest ? colors.appPrimaryColor : colors.appTextColor1,
                fontWeight: currentValue === chest ? 'bold' : 'normal',
              }}>
                {chest} cm
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Wrapper>
    </Wrapper>
  );
};

// Waist Picker Component
export const WaistPicker = ({ visible, onClose, onSelect, currentValue, t }) => {
  if (!visible) return null;

  const waistSizes = Array.from({ length: 100 }, (_, i) => 50 + i);

  return (
    <Wrapper style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 999999,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Wrapper style={{
        backgroundColor: colors.appBgColor1,
        borderRadius: scale(15),
        maxHeight: responsiveHeight(70),
        width: responsiveWidth(85),
        padding: scale(20),
      }}>
        <Wrapper style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: scale(15),
          borderBottomWidth: 1,
          borderBottomColor: colors.appBorderColor2,
        }}>
          <Text style={{ fontSize: fontSizes.large, fontWeight: 'bold' }}>
            {t('waist')}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: fontSizes.large, color: colors.appTextColor1 }}>
              ✕
            </Text>
          </TouchableOpacity>
        </Wrapper>
        
        <ScrollView style={{ flex: 1, marginTop: scale(15) }}>
          {waistSizes.map((waist) => (
            <TouchableOpacity
              key={waist}
              onPress={() => {
                onSelect(waist);
                onClose();
              }}
              style={{
                paddingVertical: scale(12),
                paddingHorizontal: scale(15),
                borderBottomWidth: 1,
                borderBottomColor: colors.appBorderColor2,
                backgroundColor: currentValue === waist ? colors.appPrimaryColor + '20' : 'transparent',
              }}
            >
              <Text style={{
                fontSize: fontSizes.regular,
                color: currentValue === waist ? colors.appPrimaryColor : colors.appTextColor1,
                fontWeight: currentValue === waist ? 'bold' : 'normal',
              }}>
                {waist} cm
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Wrapper>
    </Wrapper>
  );
};

// Hips Picker Component
export const HipsPicker = ({ visible, onClose, onSelect, currentValue, t }) => {
  if (!visible) return null;

  const hipsSizes = Array.from({ length: 100 }, (_, i) => 60 + i);

  return (
    <Wrapper style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 999999,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Wrapper style={{
        backgroundColor: colors.appBgColor1,
        borderRadius: scale(15),
        maxHeight: responsiveHeight(70),
        width: responsiveWidth(85),
        padding: scale(20),
      }}>
        <Wrapper style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: scale(15),
          borderBottomWidth: 1,
          borderBottomColor: colors.appBorderColor2,
        }}>
          <Text style={{ fontSize: fontSizes.large, fontWeight: 'bold' }}>
            {t('hips')}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: fontSizes.large, color: colors.appTextColor1 }}>
              ✕
            </Text>
          </TouchableOpacity>
        </Wrapper>
        
        <ScrollView style={{ flex: 1, marginTop: scale(15) }}>
          {hipsSizes.map((hips) => (
            <TouchableOpacity
              key={hips}
              onPress={() => {
                onSelect(hips);
                onClose();
              }}
              style={{
                paddingVertical: scale(12),
                paddingHorizontal: scale(15),
                borderBottomWidth: 1,
                borderBottomColor: colors.appBorderColor2,
                backgroundColor: currentValue === hips ? colors.appPrimaryColor + '20' : 'transparent',
              }}
            >
              <Text style={{
                fontSize: fontSizes.regular,
                color: currentValue === hips ? colors.appPrimaryColor : colors.appTextColor1,
                fontWeight: currentValue === hips ? 'bold' : 'normal',
              }}>
                {hips} cm
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Wrapper>
    </Wrapper>
  );
};







