import React from 'react';
import { View } from 'react-native';
import { Image } from 'react-native';
import { Icon } from '@rneui/themed';
import { responsiveWidth } from '../../services';
import { colors, appIcons } from '../../services';
// Consolidate SVG imports to avoid duplicate identifier errors
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';

const getSize = (size) => (size ? size : responsiveWidth(6));
const getColor = (color) => (color ? color : colors.appPrimaryColor);

export const MessageIcon = ({ size = 28, color = '#C61323' }) => (
  <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <Path
      d="M23.2985 24.4535L21.0352 23.6952C20.6035 23.5552 20.1484 23.5551 19.7401 23.7418C18.7134 24.2201 17.5468 24.5002 16.3335 24.5002C14.0935 24.5002 12.0564 23.5937 10.5876 22.1307C10.3659 21.9102 10.5549 21.5263 10.8548 21.5508C16.8818 22.098 22.1026 16.8771 21.5485 10.8501C21.4925 10.5165 21.8997 10.3205 22.2252 10.6985C24.4804 12.9046 25.1804 16.8515 23.7419 19.7401C23.2508 20.6035 24.2551 22.4491 24.4534 23.2985C24.6868 24.0101 24.0101 24.6869 23.2985 24.4535ZM11.668 19.8311C10.4523 19.8311 9.29021 19.5593 8.25654 19.0775C7.85754 18.8873 7.39437 18.8873 6.96854 19.0227L4.70071 19.7845C3.99371 20.0202 3.31234 19.34 3.548 18.6318L4.30993 16.3638C4.44643 15.938 4.44629 15.4748 4.25495 15.0758C3.77429 14.041 3.50129 12.8801 3.50129 11.6645C3.50129 7.15531 7.15765 3.49902 11.6668 3.49902C16.176 3.49902 19.8323 7.15531 19.8323 11.6645C19.8323 16.1736 16.1771 19.8311 11.668 19.8311ZM13.9979 11.6668C13.9979 12.3108 14.5262 12.8335 15.1702 12.8335C15.8154 12.8335 16.3369 12.3108 16.3369 11.6668C16.3369 11.0228 15.8154 10.5002 15.1702 10.5002H15.1586C14.5146 10.5002 13.9979 11.0228 13.9979 11.6668ZM9.33577 11.6668C9.33577 11.0228 8.81427 10.5002 8.1691 10.5002H8.15742C7.51342 10.5002 6.99674 11.0228 6.99674 11.6668C6.99674 12.3108 7.5251 12.8335 8.1691 12.8335C8.81427 12.8335 9.33577 12.3108 9.33577 11.6668ZM11.6902 12.8335C12.3353 12.8335 12.8568 12.3108 12.8568 11.6668C12.8568 11.0228 12.3353 10.5002 11.6902 10.5002H11.6785C11.0345 10.5002 10.5175 11.0228 10.5175 11.6668C10.5175 12.3108 11.0462 12.8335 11.6902 12.8335Z"
      fill={color}
    />
    <Defs>
      <LinearGradient
        id="messageGradient"
        x1="14.0004"
        y1="3.49902"
        x2="14.0004"
        y2="24.5004"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#C61323" />
        <Stop offset="1" stopColor="#9B0207" />
      </LinearGradient>
    </Defs>
  </Svg>
);

export const HeartIcon = ({ size = 28, color = 'white', filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.44087 7.24086C5.49103 6.19103 6.91515 5.60126 8.40007 5.60126C9.88499 5.60126 11.3091 6.19103 12.3593 7.24086L14.0001 8.88026L15.6409 7.24086C16.1575 6.70601 16.7754 6.27939 17.4586 5.9859C18.1418 5.69241 18.8767 5.53792 19.6202 5.53146C20.3638 5.525 21.1012 5.66669 21.7894 5.94826C22.4776 6.22984 23.1029 6.64565 23.6287 7.17145C24.1545 7.69725 24.5703 8.3225 24.8519 9.01072C25.1334 9.69894 25.2751 10.4363 25.2687 11.1799C25.2622 11.9235 25.1077 12.6583 24.8142 13.3415C24.5208 14.0248 24.0941 14.6427 23.5593 15.1593L14.0001 24.7199L4.44087 15.1593C3.39104 14.1091 2.80127 12.685 2.80127 11.2001C2.80127 9.71515 3.39104 8.29102 4.44087 7.24086Z"
      fill={filled ? color : 'none'}
      stroke={filled ? 'none' : color}
      strokeWidth={filled ? 0 : 2}
    />
  </Svg>
);

export const AddFriendIcon = ({ size = 28, color = 'white' }) => (
  <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <Path
      d="M16.3335 22.1665C16.3335 23.0252 16.5423 23.8395 16.9133 24.5605C17.0358 24.7997 16.883 25.0832 16.6146 25.0832H12.8335H8.16683C5.49516 25.0832 4.0835 23.6832 4.0835 21.0232C4.0835 18.0482 5.7635 14.5832 10.5002 14.5832H12.8335H15.1668C17.5025 14.5832 19.0973 15.4278 20.1076 16.6365C20.2651 16.8255 20.1567 17.1044 19.9234 17.1814C17.8315 17.8709 16.3335 19.8378 16.3335 22.1665ZM12.844 12.2498C15.4177 12.2498 17.5107 10.1568 17.5107 7.58317C17.5107 5.0095 15.4177 2.9165 12.844 2.9165C10.2704 2.9165 8.17737 5.0095 8.17737 7.58317C8.17737 10.1568 10.2704 12.2498 12.844 12.2498ZM24.5002 21.2915H23.0418V19.8332C23.0418 19.3502 22.6498 18.9582 22.1668 18.9582C21.6838 18.9582 21.2918 19.3502 21.2918 19.8332V21.2915H19.8335C19.3505 21.2915 18.9585 21.6835 18.9585 22.1665C18.9585 22.6495 19.3505 23.0415 19.8335 23.0415H21.2918V24.4998C21.2918 24.9828 21.6838 25.3748 22.1668 25.3748C22.6498 25.3748 23.0418 24.9828 23.0418 24.4998V23.0415H24.5002C24.9832 23.0415 25.3752 22.6495 25.3752 22.1665C25.3752 21.6835 24.9832 21.2915 24.5002 21.2915Z"
      fill={color}
    />
  </Svg>
);

export const RequestSentIcon = ({ size = 28, color = '#0061ff' }) => (
  <Svg width={size} height={size} viewBox="0 0 640 512" fill="none">
    <Path
      opacity="1"
      fill={color}
      d="M224 0a128 128 0 1 1 0 256A128 128 0 1 1 224 0zM178.3 304h91.4c20.6 0 40.4 3.5 58.8 9.9C323 331 320 349.1 320 368c0 59.5 29.5 112.1 74.8 144H29.7C13.3 512 0 498.7 0 482.3C0 383.8 79.8 304 178.3 304zM352 368a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-80c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16h48c8.8 0 16-7.2 16-16s-7.2-16-16-16H512V304c0-8.8-7.2-16-16-16z"
    />
  </Svg>
);

export const FriendsIcon = ({ size = 28, color = '#0061ff' }) => (
  <Svg width={size} height={size} viewBox="0 0 640 512" fill="none">
    <Path
      opacity="1"
      fill={color}
      d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM625 177L497 305c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L591 143c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
    />
  </Svg>
);

export const EditIcon = ({ size = 28, color = 'white' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      fill={color}
    />
  </Svg>
);

export const LocationIcon = ({ size, color }) => (
    <Image
      source={appIcons.LocationLogo}
      resizeMode="contain"
      style={{ width: getSize(size), height: getSize(size), tintColor: color || colors.appTextColor2 }}
    />
  );
  
export const DeleteIcon = ({ size, color }) => (
  <Image
    source={appIcons.Close || appIcons.Back}
    resizeMode="contain"
    style={{ width: getSize(size), height: getSize(size), tintColor: getColor(color) }}
  />
);

// Minimal SVG icons for map zoom controls
export const PlusSvgIcon = ({ size, color }) => {
  const s = getSize(size);
  const c = getColor(color);
  const r = s / 2 - 1;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Circle cx={s/2} cy={s/2} r={r} stroke={c} strokeWidth={2} fill="none" />
      <Line x1={s/2} y1={s*0.25} x2={s/2} y2={s*0.75} stroke={c} strokeWidth={2} strokeLinecap="round" />
      <Line x1={s*0.25} y1={s/2} x2={s*0.75} y2={s/2} stroke={c} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
};

export const MinusSvgIcon = ({ size, color }) => {
  const s = getSize(size);
  const c = getColor(color);
  const r = s / 2 - 1;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Circle cx={s/2} cy={s/2} r={r} stroke={c} strokeWidth={2} fill="none" />
      <Line x1={s*0.25} y1={s/2} x2={s*0.75} y2={s/2} stroke={c} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
};

// Grey Dislike (X in circle) for Hot/Not button
export const DislikeGreySvgIcon = ({ size, color }) => {
  const s = getSize(size);
  const c = color || '#A5A7AC';
  const r = s / 2;
  const p = s * 0.28;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Circle cx={s/2} cy={s/2} r={r} fill="#FFFFFF" />
      <Line x1={p} y1={p} x2={s-p} y2={s-p} stroke={c} strokeWidth={s * 0.08} strokeLinecap="round" />
      <Line x1={s-p} y1={p} x2={p} y2={s-p} stroke={c} strokeWidth={s * 0.08} strokeLinecap="round" />
    </Svg>
  );
};

// Info icon (circle with "i") for profile navigation
export const InfoSvgIcon = ({ size, color }) => {
  const s = getSize(size);
  const fill = color || '#FFFFFF';
  // SVG path provided by user (circle with information glyph)
  const dPath =
    'M356.004,61.156c-81.37-81.47-213.377-81.551-294.848-0.182c-81.47,81.371-81.552,213.379-0.181,294.85 c81.369,81.47,213.378,81.551,294.849,0.181C437.293,274.636,437.375,142.626,356.004,61.156z M237.6,340.786 c0,3.217-2.607,5.822-5.822,5.822h-46.576c-3.215,0-5.822-2.605-5.822-5.822V167.885c0-3.217,2.607-5.822,5.822-5.822h46.576 c3.215,0,5.822,2.604,5.822,5.822V340.786z M208.49,137.901c-18.618,0-33.766-15.146-33.766-33.765 c0-18.617,15.147-33.766,33.766-33.766c18.619,0,33.766,15.148,33.766,33.766C242.256,122.755,227.107,137.901,208.49,137.901z';
  return (
    <Svg width={s} height={s} viewBox="0 0 416.979 416.979">
      <Path d={dPath} fill={fill} />
    </Svg>
  );
};

// Simple Close (X) SVG icon
export const CloseSvgIcon = ({ size, color }) => {
  const s = getSize(size || 24);
  const fill = color || '#0F1729';
  // Provided path from user (X glyph)
  const dPath =
    'M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z';
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path fillRule="evenodd" clipRule="evenodd" d={dPath} fill={fill} />
    </Svg>
  );
};


export const SearchIcon = ({ size = 28, color = '#C61323' }) => (
  <Svg width={size} height={size} viewBox="0 0 21 22" fill="none">
    <Path
      d="M9.76688 17.7549C14.7549 17.7549 18.7555 13.7543 18.7555 8.76628C18.7555 3.77825 14.7549 -0.222351 9.76688 -0.222351C4.77885 -0.222351 0.778244 3.77825 0.778244 8.76628C0.778244 13.7543 4.77885 17.7549 9.76688 17.7549Z"
      stroke="url(#searchGradient1)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17.0186 17.4849L20.5426 20.9997"
      stroke="url(#searchGradient2)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Defs>
      <LinearGradient
        id="searchGradient1"
        x1="9.76688"
        y1="-0.222351"
        x2="9.76688"
        y2="17.7549"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#C61323" />
        <Stop offset="1" stopColor="#9B0207" />
      </LinearGradient>
      <LinearGradient
        id="searchGradient2"
        x1="18.7806"
        y1="17.4849"
        x2="18.7806"
        y2="20.9997"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#C61323" />
        <Stop offset="1" stopColor="#9B0207" />
      </LinearGradient>
    </Defs>
  </Svg>
);

export const SettingsIcon = ({ size = 28, color = '#C61323' }) => (
  <Svg width={size} height={size} viewBox="0 0 21 22" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18.8064 6.62337L18.184 5.54328C17.6574 4.62936 16.4905 4.31408 15.5753 4.83847V4.83847C15.1397 5.0951 14.6198 5.16791 14.1305 5.04084C13.6411 4.91378 13.2224 4.59727 12.9666 4.16113C12.8021 3.8839 12.7137 3.56815 12.7103 3.2458V3.2458C12.7251 2.72898 12.5302 2.22816 12.1698 1.85743C11.8094 1.48669 11.3143 1.27762 10.7973 1.27783H9.54326C9.03672 1.27783 8.55107 1.47967 8.19376 1.8387C7.83644 2.19773 7.63693 2.68435 7.63937 3.19088V3.19088C7.62435 4.23668 6.77224 5.07657 5.72632 5.07646C5.40397 5.07311 5.08821 4.9847 4.81099 4.82017V4.82017C3.89582 4.29577 2.72887 4.61105 2.20229 5.52497L1.5341 6.62337C1.00817 7.53615 1.31916 8.70236 2.22975 9.23207V9.23207C2.82166 9.5738 3.18629 10.2053 3.18629 10.8888C3.18629 11.5723 2.82166 12.2038 2.22975 12.5456V12.5456C1.32031 13.0717 1.00898 14.2351 1.5341 15.1451V15.1451L2.16568 16.2344C2.4124 16.6795 2.82636 17.0081 3.31595 17.1472C3.80554 17.2863 4.3304 17.2247 4.77438 16.9758V16.9758C5.21084 16.7211 5.73094 16.6513 6.2191 16.782C6.70725 16.9126 7.12299 17.2328 7.37392 17.6714C7.53845 17.9486 7.62686 18.2644 7.63021 18.5868V18.5868C7.63021 19.6433 8.48671 20.4998 9.54326 20.4998H10.7973C11.8502 20.4998 12.7053 19.6489 12.7103 18.5959V18.5959C12.7079 18.0878 12.9086 17.5998 13.2679 17.2405C13.6272 16.8812 14.1152 16.6804 14.6233 16.6829C14.9449 16.6915 15.2594 16.7795 15.5387 16.9392V16.9392C16.4515 17.4651 17.6177 17.1541 18.1474 16.2435V16.2435L18.8064 15.1451C19.0615 14.7073 19.1315 14.1858 19.001 13.6961C18.8704 13.2065 18.55 12.7891 18.1108 12.5364V12.5364C17.6715 12.2837 17.3511 11.8663 17.2206 11.3767C17.09 10.8871 17.16 10.3656 17.4151 9.92772C17.581 9.63809 17.8211 9.39795 18.1108 9.23207V9.23207C19.0159 8.70265 19.3262 7.54325 18.8064 6.63252V6.63252V6.62337Z"
      stroke="url(#settingsGradient1)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.1752 10.8886C11.8114 10.8886 13.1352 9.56478 13.1352 7.92856C13.1352 6.29234 11.8114 4.96852 10.1752 4.96852C8.53897 4.96852 7.21515 6.29234 7.21515 7.92856C7.21515 9.56478 8.53897 10.8886 10.1752 10.8886Z"
      stroke="url(#settingsGradient2)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Defs>
      <LinearGradient
        id="settingsGradient1"
        x1="10.1718"
        y1="1.27783"
        x2="10.1718"
        y2="20.4998"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#C61323" />
        <Stop offset="1" stopColor="#9B0207" />
      </LinearGradient>
      <LinearGradient
        id="settingsGradient2"
        x1="10.1752"
        y1="4.96852"
        x2="10.1752"
        y2="10.8886"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#C61323" />
        <Stop offset="1" stopColor="#9B0207" />
      </LinearGradient>
    </Defs>
  </Svg>
);

export const SupportIcon = ({ size = 28, color = '#C61323' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"
      fill={color}
    />
    <Path
      d="M7 9H17V11H7V9ZM7 12H17V14H7V12ZM7 6H17V8H7V6Z"
      fill={color}
    />
  </Svg>
);

export const CoinIcon = ({ size = 28, color = '#C61323' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20Z"
      fill={color}
    />
    <Path
      d="M12 6C8.69 6 6 8.69 6 12S8.69 18 12 18 18 15.31 18 12 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12S9.79 8 12 8 16 9.79 16 12 14.21 16 12 16Z"
      fill={color}
    />
    <Path
      d="M12 10C10.9 10 10 10.9 10 12S10.9 14 12 14 14 13.1 14 12 13.1 10 12 10Z"
      fill={color}
    />
  </Svg>
);

export const WalletIcon = ({ size = 28, color = '#C61323' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 7H5C3.89 7 3 7.89 3 9V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V9C21 7.89 20.11 7 19 7ZM19 19H5V9H19V19Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 15H9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 11H18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const RestoreIcon = ({ size = 28, color = '#C61323' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12H21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 6L3 12L9 18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 6V18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const BackendIcon = ({ size = 28, color = '#C61323' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 12H16"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 16H16"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 8H12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const LogoutIcon = ({ size = 28, color = '#C61323' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7Z"
      fill={color}
    />
    <Path
      d="M4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z"
      fill={color}
    />
  </Svg>
);

// Eye icons for password visibility toggle
export const EyeOutlineIcon = ({ size = 24, color }) => {
  const s = getSize(size);
  const c = color || colors.appTextColor1;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export const EyeOffOutlineIcon = ({ size = 24, color }) => {
  const s = getSize(size);
  const c = color || colors.appTextColor1;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3L21 21" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.584 10.586A3 3 0 0012 15C13.657 15 15 13.657 15 12c0-.415-.084-.81-.236-1.168" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.88 4.26A10.78 10.78 0 0112 4c7 0 11 8 11 8a20.7 20.7 0 01-3.24 4.26M6.24 6.24A20.7 20.7 0 001 12s4 8 11 8c1.104 0 2.16-.197 3.156-.56" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};
