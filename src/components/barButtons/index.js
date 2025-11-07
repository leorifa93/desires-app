import {FlatList, PixelRatio, StyleSheet, TouchableOpacity} from 'react-native';
import {Icons, Spacer, Text, Wrapper} from '..';
import {
  appFonts,
  appIcons,
  colors,
  fontSizes,
  headers,
  responsiveHeight,
  responsiveWidth,
  sizes,
} from '../../services';
import {Icon} from '@rneui/base';
import {useState} from 'react';
import {SpWheelPickerShown} from '../pickers';
import {scale} from 'react-native-size-matters';

export const ShowTittleAndSelectedOption = ({
  onPress,
  title,
  SelectedOption,
  CustomHeight,
  borderRadius,
  buttonwidth,
  iconSize,
  paddingHorizontal,
}) => {
  return (
    <TouchableOpacity
      onPress={() => {
        onPress && onPress();
      }}>
      <Wrapper
        marginHorizontalBase
        paddingHorizontalSmall
        flexDirectionRow
        justifyContentSpaceBetween
        alignItemsCenter
        style={[
          {
            width: buttonwidth,
            height: CustomHeight ? CustomHeight : sizes.buttonHeight,
            borderRadius: borderRadius || responsiveWidth(3),
          },
          paddingHorizontal && {paddingHorizontal: paddingHorizontal},
        ]}
        backgroundColor={colors.appModalOptionBGColor}>
        <Text isRegular isMediumFont children={title} />
        <Icons.WithText
          containerStyle={{flexDirection: 'row-reverse'}}
          text={SelectedOption}
          tintColor={colors.appTextColor}
          iconName={'keyboard-arrow-right'}
          iconType={'material'}
          iconSize={responsiveWidth(5) || iconSize}
          textStyle={{
            fontSize: fontSizes.regular,
            fontFamily: appFonts.appTextMedium1,
          }}
        />
      </Wrapper>
    </TouchableOpacity>
  );
};

export const SelectFromOptions = ({Data, SelectedOption, IsSelected}) => {
  const [Value, setValue] = useState(Data ? Data[0] : null);
  return (
    <Wrapper style={{gap: responsiveHeight(1.5)}}>
      {Data
        ? Data.map((item, index) => {
            return (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setValue(item);
                }}>
                <Wrapper
                  marginHorizontalBase
                  paddingHorizontalSmall
                  paddingVerticalSmall
                  justifyContentCenter
                  style={[
                    {
                      borderRadius: responsiveWidth(3),
                    },
                    !item?.Description && {height: sizes.buttonHeight},
                  ]}
                  backgroundColor={colors.appModalOptionBGColor}>
                  <Wrapper
                    flexDirectionRow
                    alignItemsCenter
                    justifyContentSpaceBetween>
                    <Text
                      isRegular
                      isRegularFont
                      children={item?.label ? item?.label : item}
                    />
                    {item === Value ? (
                      <Icon
                        name={'check'}
                        type={'feather'}
                        color={colors.appPrimaryColor}
                        size={responsiveWidth(5)}
                      />
                    ) : null}
                  </Wrapper>
                  {item?.Description ? (
                    <>
                      <Spacer isTiny />
                      <Text
                        isSmall
                        isRegularFont
                        style={{color: colors.appTextColor}}
                        children={item?.Description}
                      />
                    </>
                  ) : null}
                </Wrapper>
              </TouchableOpacity>
            );
          })
        : null}
    </Wrapper>
  );
};
// old code
// export const IconWithTextSelectOptions = ({
//   Data,
//   SelectedOption,
//   IsSelected,
// }) => {
//   const [Value, setValue] = useState(Data ? Data[0] : null);
//   return (
//     <FlatList
//       data={Data}
//       showsVerticalScrollIndicator={false}
//       ItemSeparatorComponent={<Spacer height={responsiveHeight(1.5)} />}
//       ListFooterComponent={<Spacer height={responsiveHeight(15)} />}
//       renderItem={({item, index}) => (
//         <TouchableOpacity
//           key={index}
//           onPress={() => {
//             setValue(item);
//           }}>
//           <Wrapper
//             marginHorizontalBase
//             paddingHorizontalSmall
//             paddingVerticalSmall
//             justifyContentCenter
//             style={[
//               {
//                 borderRadius: responsiveWidth(3),
//               },
//             ]}
//             backgroundColor={colors.appModalOptionBGColor}>
//             <Wrapper
//               flexDirectionRow
//               alignItemsCenter
//               justifyContentSpaceBetween>
//               <Wrapper flexDirectionRow alignItemsCenter>
//                 <Wrapper
//                   isCenter
//                   style={{
//                     height: scale(50),
//                     width: scale(50),
//                     borderRadius: responsiveWidth(100),
//                     backgroundColor: colors.appBgColor1,
//                     marginRight: responsiveWidth(3),
//                   }}
//                   children={
//                     <Icons.Custom
//                       icon={item?.customIcon}
//                       //color={colors.black}
//                       size={responsiveWidth(8)}
//                     />
//                   }
//                 />
//                 <Text
//                   isRegular
//                   style={{fontFamily: appFonts.appTextMedium1}}
//                   children={item?.label ? item?.label : item}
//                 />
//               </Wrapper>
//               {item === Value ? (
//                 <Icon
//                   name={'check'}
//                   type={'feather'}
//                   color={colors.appPrimaryColor}
//                   size={responsiveWidth(5)}
//                 />
//               ) : null}
//             </Wrapper>
//             {item?.Description ? (
//               <>
//                 <Spacer isTiny />
//                 <Text
//                   isSmall
//                   isRegularFont
//                   style={{color: colors.appTextColor}}
//                   children={item?.Description}
//                 />
//               </>
//             ) : null}
//           </Wrapper>
//         </TouchableOpacity>
//       )}
//     />
//     // <Wrapper style={{gap: responsiveHeight(1.5)}}>
//     //   {Data
//     //     ? Data.map((item, index) => {
//     //         return (

//     //         );
//     //       })
//     //     : null}
//     // </Wrapper>
//   );
// };

export const IconWithTextSelectOptions = ({
  Data,
  labelRepresent,
  IsMultiSelector,
  InFlatList,
  NoColorOfIcon,
  onPress,
  selectedValue,
}) => {
  const styles = StyleSheet.create({
    itemContainer: {
      height: sizes.inputHeight,
      borderWidth: 1,
      borderColor: colors.appBorderColor2,
      borderRadius: responsiveWidth(100),
    },
    selectedItemContainer: {
      backgroundColor: colors.appBGColor,
      borderWidth: 0,
    },
    selectionIndicator: {
      height: scale(20),
      width: scale(20),
      backgroundColor: colors.appBgColor1,
      borderRadius: responsiveWidth(100),
    },
  });
  const [selectedValues, setSelectedValues] = useState(
    selectedValue ? [Data.find(item => item.value === selectedValue)] : []
  );

  const toggleSelection = item => {
    if (selectedValues.includes(item)) {
      // Remove item from selection
      setSelectedValues(selectedValues.filter(value => value !== item));
    } else {
      // Add item to selection
      setSelectedValues(IsMultiSelector ? [...selectedValues, item] : [item]);
    }
    
    // Call the onPress callback if provided
    if (onPress) {
      onPress(item);
    }
  };

  const RenderItem = (item, index) => {
    const isSelected = selectedValues.includes(item);

    return (
      <TouchableOpacity key={index} onPress={() => toggleSelection(item)}>
        <Wrapper
          marginHorizontalBase
          paddingHorizontalBase
          flexDirectionRow
          alignItemsCenter
          justifyContentSpaceBetween
          style={[
            styles.itemContainer,
            isSelected && styles.selectedItemContainer,
          ]}>
          <Icons.WithText
            iconName={item?.iconName}
            iconType={item?.iconType}
            iconSize={scale(20)}
            customIcon={item?.customIcon}
            tintColor={
              NoColorOfIcon
                ? null
                : isSelected
                ? colors.appBgColor1
                : colors.appBGColor
            }
            text={
              labelRepresent
                ? labelRepresent(item)
                : item?.label
                ? item?.label
                : item
            }
            textStyle={{
              color: isSelected ? colors.appBgColor1 : colors.appBorderColor1,
              fontSize: fontSizes.regular,
            }}
          />
          {isSelected && (
            <Wrapper isCenter style={styles.selectionIndicator}>
              <Icons.Custom
                icon={appIcons.Tick}
                color={colors.appBGColor}
                size={scale(15)}
              />
            </Wrapper>
          )}
        </Wrapper>
      </TouchableOpacity>
    );
  };

  return (
    <Wrapper>
      {InFlatList ? (
        <FlatList
          data={Data}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={<Spacer height={responsiveHeight(1.5)} />}
          ListFooterComponent={<Spacer height={responsiveHeight(15)} />}
          renderItem={({item, index}) => RenderItem(item, index)}
        />
      ) : (
        <Wrapper gap={responsiveHeight(1.5)}>
          {Data.map((item, index) => RenderItem(item, index))}
          <Spacer
            height={responsiveHeight(Data ? (Data.length / 8) * 1.5 : 2)}
          />
        </Wrapper>
      )}
    </Wrapper>
  );
};

export const SelectRadioOptions = ({Data, SelectedOption, IsSelected}) => {
  const [Value, setValue] = useState(Data ? Data[0] : null);
  return (
    <Wrapper style={{gap: responsiveHeight(1.5)}}>
      {Data
        ? Data.map((item, index) => {
            return (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setValue(item);
                }}>
                <Wrapper
                  marginHorizontalBase
                  paddingHorizontalSmall
                  paddingVerticalSmall
                  justifyContentCenter
                  style={[
                    {
                      borderRadius: responsiveWidth(3),
                    },
                    !item?.Description && {height: sizes.buttonHeight},
                  ]}
                  backgroundColor={colors.appModalOptionBGColor}>
                  <Wrapper flexDirectionRow alignItemsCenter>
                    {
                      <Icon
                        name={
                          item === Value
                            ? 'radio-button-on'
                            : 'radio-button-off'
                        }
                        type={'material'}
                        color={
                          item === Value
                            ? colors.appPrimaryColor
                            : colors.appBorderColor
                        }
                        size={responsiveWidth(5)}
                      />
                    }
                    <Text
                      isRegular
                      style={{
                        fontFamily: appFonts.appTextMedium1,
                        marginLeft: responsiveWidth(2),
                      }}
                      children={item?.label ? item?.label : item}
                    />
                  </Wrapper>
                  {item?.Description ? (
                    <>
                      <Spacer isTiny />
                      <Text
                        isSmall
                        isRegularFont
                        style={{color: colors.appTextColor}}
                        children={
                          'Keep this workout private and visible only to you for personal use.'
                        }
                      />
                    </>
                  ) : null}
                </Wrapper>
              </TouchableOpacity>
            );
          })
        : null}
    </Wrapper>
  );
};
