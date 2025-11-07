import * as appSvgs from './appSvgs';

// leave off @2x/@3x
const appImages = {
  user1:
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&w=1000&q=80',
  user2:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQEZrATmgHOi5ls0YCCQBTkocia_atSw0X-Q&usqp=CAU',
  user3:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIwMIGTutu1jpkhgNCLM-Rd2gz3d0MRSXuPw&usqp=CAU',
  user4:
    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8dXNlcnxlbnwwfHwwfHw%3D&w=1000&q=80',
  user5:
    'https://i.pinimg.com/474x/c2/76/05/c2760595530e6633ae778a60de74f127.jpg',
  noUser:
    'https://icon-library.com/images/no-user-image-icon/no-user-image-icon-27.jpg',

  materCardLogo:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/800px-Mastercard_2019_logo.svg.png',
  visaCardLogo:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png',
  SplashBackgroundImage: require('../../../assets/images/DSRS_splash.jpg'),
  profile: require('../../../assets/images/profile.png'),
  image2: require('../../../assets/images/image2.jpeg'),
  image3: require('../../../assets/images/image3.jpeg'),
  image4: require('../../../assets/images/image4.jpeg'),
  verificationImage: require('../../../assets/images/image4.jpeg'),
  notApprovedMale: require('../../../assets/images/not_approved_male.jpg'),
  notApprovedFemale: require('../../../assets/images/not_approved_female.jpg'),
  // Gestenbilder für Verifikation
  geste001: require('../../../assets/images/001.jpg'),
  geste002: require('../../../assets/images/002.jpg'),
  geste003: require('../../../assets/images/003.jpg'),
  geste004: require('../../../assets/images/004.jpg'),
  geste005: require('../../../assets/images/005.jpg'),
  geste006: require('../../../assets/images/006.jpg'),
  geste007: require('../../../assets/images/007.jpg'),
  geste008: require('../../../assets/images/008.jpg'),
  geste009: require('../../../assets/images/009.jpg'),
  geste010: require('../../../assets/images/010.jpg'),
};

const appIcons = {
  LogoWithWhiteText: require('../../../assets/icons/LogoWithWhiteText.png'),
  LogoWithBlackText: require('../../../assets/icons/LogoWithBlackText.png'),
    Email: require('../../../assets/icons/Email.png'),
    Eye: require('../../../assets/icons/eye-outline.png'),
    EyeOff: require('../../../assets/icons/eye-off-outline.png'),
  Google: require('../../../assets/icons/google.png'),
  //Bottom Tab Icons
  Home: require('../../../assets/icons/Home.png'),
  HomeActive: require('../../../assets/icons/HomeActive.png'),
  Explore: require('../../../assets/icons/Explore.png'),
  ExploreActive: require('../../../assets/icons/ExploreActive.png'),
  Fire: require('../../../assets/icons/Fire.png'),
  FireActive: require('../../../assets/icons/FireActive.png'),
  Friends: require('../../../assets/icons/Friends.png'),
  FriendsActive: require('../../../assets/icons/FriendsActive.png'),
  Message: require('../../../assets/icons/Message.png'),
  MessageActive: require('../../../assets/icons/MessageActive.png'),
  ProfileSetting: require('../../../assets/icons/ProfileSetting.png'),
  ProfileSettingActive: require('../../../assets/icons/ProfileSettingActive.png'),
  //Country Flags for language
  unitedstates: require('../../../assets/icons/unitedstates.png'),
  spain: require('../../../assets/icons/spain.png'),
  germany: require('../../../assets/icons/germany.png'),
  france: require('../../../assets/icons/france.png'),

  //App
  Back: require('../../../assets/icons/Back.png'),
  Down: require('../../../assets/icons/down.png'),
  Forward: require('../../../assets/icons/Forward.png'),
  SwipeForward: require('../../../assets/icons/SwipeForward.png'),
  Tick: require('../../../assets/icons/Tick.png'),
  TickCircle: require('../../../assets/icons/TickCircle.png'),
  LocationHistory: require('../../../assets/icons/LocationHistory.png'),
  LocationLogo: require('../../../assets/icons/locationLogo.png'),
  LocationLogo1: require('../../../assets/icons/locationLogo1.png'),
  LocationMessageContainer: require('../../../assets/icons/locationMessageContainer.png'),
  Heart: require('../../../assets/icons/Heart.png'),
  //pay
  BTC: require('../../../assets/icons/btc.png'),
  // Hot or Not
  Hot: require('../../../assets/icons/Hot.png'),
  NotLiked: require('../../../assets/icons/NotLiked.png'),
  HotLiked: require('../../../assets/icons/HotLiked.png'),
  //Position
  PositionBackground: require('../../../assets/icons/PositionBackground.png'),
  //ProfileSetting
  user: require('../../../assets/icons/user.png'),
  wallet: require('../../../assets/icons/wallet.png'),
  SignOut: require('../../../assets/icons/SignOut.png'),
  Search: require('../../../assets/icons/Search.png'),
  Location: require('../../../assets/icons/Location.png'),
  Frame: require('../../../assets/icons/Frame.png'),
  DollarCircle: require('../../../assets/icons/DollarCircle.png'),
  Coin: require('../../../assets/icons/coin.png'),
  dataSets: require('../../../assets/icons/dataSets.png'),
  //Home Page
  sendIcon: require('../../../assets/icons/Send.png'),
  sendMessage: require('../../../assets/icons/SendMessage.png'),
  filterIcon: require('../../../assets/icons/Filter.png'),
  EmptyListHome: require('../../../assets/icons/EmptyListHome.png'),
  EmptyListHotorNot: require('../../../assets/icons/EmptyListHotorNot.png'),
  // Friends
  Menu: require('../../../assets/icons/Menu.png'),
  camera: require('../../../assets/icons/Camera.png'),
  video: require('../../../assets/icons/Video.png'),
  VideoOff: require('../../../assets/icons/VideoOff.png'),
  FullScreenExit: require('../../../assets/icons/FullScreenExit.png'),
  callEnd: require('../../../assets/icons/callEnd.png'),
  flipCamera: require('../../../assets/icons/flip-camera.png'),
  EditPen: require('../../../assets/icons/Edit.png'),
  UploadImage: require('../../../assets/icons/UploadImage.png'),
  inviteQrCode: require('../../../assets/icons/inviteQrCode.png'),
  //
  applogo: require('../../../assets/icons/logo.png'),
  Calender: require('../../../assets/icons/Calender.png'),
  phoneInput: require('../../../assets/icons/phoneInput.png'),
};

const appFonts = {
  appTextLight: 'Roboto-Light',
  appTextRegular: 'Roboto-Regular',
  appTextMedium: 'Roboto-Medium',
  appTextBold: 'Roboto-Bold',
  // appTextLight: 'Montserrat-Light',
  // appTextRegular: 'Montserrat-Regular',
  // appTextMedium: 'Montserrat-Medium',
  // appTextBold: 'Montserrat-Bold',
};

export {appImages, appIcons, appSvgs, appFonts};
