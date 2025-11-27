import {Pressable, StyleSheet, TextInput, View, Alert, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Modal, Image} from 'react-native';
import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  Headers,
  Icons,
  Images,
  ScrollViews,
  Spacer,
  StatusBars,
  Text,
  TextInputs,
  Wrapper,
  VideoTrimmer,
} from '../../../components';
import {
  appIcons,
  appImages,
  appStyles,
  appSvgs,
  colors,
  fontSizes,
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
  routes,
  sizes,
} from '../../../services';
import {scale} from 'react-native-size-matters';
import {goBack, navigate} from '../../../navigation/rootNavigation';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {getChat, markChatAsSeen, addMessageToChat, createChat, findChatBetweenUsers, getMessagesForChat, addMessage, updateChat, listenToMessages} from '../../../services/firebaseUtilities/chat';
import {getUser, blockUser, unblockUser} from '../../../services/firebaseUtilities/user';
import {useDispatch} from 'react-redux';
import {setUser as setUserAction} from '../../../store/actions/auth';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import useImagePicker from '../../../services/helper/hooks/useImagePicker';
import {uploadImage, uploadVideo} from '../../../services/firebaseUtilities/storage';
import Video from 'react-native-video';
import CallMinutesShopModal from '../../../components/modals/CallMinutesShopModal';

const ChatScreen = ({route}) => {
  const {t} = useTranslation();
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const {chatId, otherUserId} = route.params || {};
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const {openLibrary, openVideoLibrary} = useImagePicker();
  const [isBlocked, setIsBlocked] = useState(false);
  
  const [chat, setChat] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unsubscribeMessages, setUnsubscribeMessages] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [showCallMinutesShop, setShowCallMinutesShop] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);

  useEffect(() => {
    if (user) {
      if (chatId || otherUserId) {
        initializeChat();
      } else {
        // If no chatId or otherUserId, just stop loading
        console.log('No chatId or otherUserId provided, stopping loading');
        setLoading(false);
      }
    }
    
    // Cleanup function
    return () => {
      if (unsubscribeMessages) {
        console.log('Cleaning up real-time messages listener');
        unsubscribeMessages();
      }
    };
  }, [user, chatId, otherUserId]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom immediately when messages are first loaded
    if (messages.length > 0 && !loading) {
      scrollToBottomImmediate();
    }
  }, [messages.length, loading]);

  // Mark chat as seen when component is focused (user is actively in chat)
  useEffect(() => {
    const markAsSeen = async () => {
      if (chat?.id && user?.id && !loading) {
        try {
          await markChatAsSeen(chat.id, user.id);
          console.log('Chat marked as seen on focus');
        } catch (error) {
          console.error('Error marking chat as seen on focus:', error);
        }
      }
    };

    // Mark as seen immediately when chat is loaded
    markAsSeen();

    // Also mark as seen when component mounts (user returns to chat)
    const interval = setInterval(markAsSeen, 5000); // Every 5 seconds while in chat

    return () => {
      clearInterval(interval);
    };
  }, [chat?.id, user?.id, loading]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      console.log('ChatScreen: Initializing chat with params:', { chatId, otherUserId, user: user?.id });
      
      // Prefer explicit chatId (demo mode opens existing chat between two users)
      let chatData = null;
      if (chatId) {
        try {
          chatData = await getChat(chatId);
          if (chatData) {
            setChat(chatData);
            try { await markChatAsSeen(chatId, user.id); } catch (error) { console.error('Error marking chat as seen:', error); }
          }
        } catch (error) {
          console.error('Error loading chat by ID:', error);
        }
      }
      // If no chat by ID, fall back to pair-wise lookup
      if (!chatData && otherUserId) {
        try {
          const existingChat = await findChatBetweenUsers(user.id, otherUserId);
          if (existingChat) {
            chatData = existingChat;
            setChat(chatData);
            if (!chatData.seen?.includes(user.id)) {
              try { await markChatAsSeen(chatData.id, user.id); } catch (error) { console.error('Error marking chat as seen:', error); }
            }
          }
        } catch (error) {
          console.error('Error finding existing chat:', error);
        }
      }

      // If otherUser was not provided, try to resolve from chat profiles/memberIds or otherUserId
      if (!otherUser) {
        try {
          let resolvedOtherId = null;
          
          // First try to get from chatData if it exists
          if (chatData) {
            if (Array.isArray(chatData?.profiles) && chatData.profiles.length > 0) {
              const other = chatData.profiles.find(p => p?.id && p.id !== user.id);
              resolvedOtherId = other?.id || null;
            }
            if (!resolvedOtherId && Array.isArray(chatData?.memberIds)) {
              resolvedOtherId = chatData.memberIds.find(id => id !== user.id) || null;
            }
          }
          
          // Use otherUserId if no resolvedOtherId from chatData
          const idToFetch = otherUserId || resolvedOtherId;
          console.log('ChatScreen: Resolving other user, idToFetch:', idToFetch, 'otherUserId:', otherUserId, 'resolvedOtherId:', resolvedOtherId);
          if (idToFetch) {
            const otherUserData = await getUser(idToFetch);
            console.log('ChatScreen: Loaded other user data:', otherUserData?.username, otherUserData?.id);
            setOtherUser(otherUserData);
          } else {
            console.log('ChatScreen: No user ID to fetch, otherUserId:', otherUserId, 'resolvedOtherId:', resolvedOtherId);
          }
        } catch (error) {
          console.error('Error resolving other user:', error);
        }
      }
      // Set up real-time listener for messages
      if (chatData && chatData.id) {
        try {
          console.log(`Setting up real-time messages listener for chat: ${chatData.id}`);
          
          // Clean up existing listener
          if (unsubscribeMessages) {
            unsubscribeMessages();
          }
          
          const unsubscribe = listenToMessages(chatData.id, async (realMessages) => {
            console.log(`Real-time messages update: ${realMessages.length} messages`);
            setMessages(realMessages);
            
            // Mark chat as seen when new messages are received (like in old project)
            if (realMessages.length > 0) {
              const latestMessage = realMessages[realMessages.length - 1];
              // Only mark as seen if the message is not from the current user
              if (latestMessage && latestMessage.senderId !== user.id) {
                try {
                  await markChatAsSeen(chatData.id, user.id);
                  console.log('Chat marked as seen due to new message');
                } catch (error) {
                  console.error('Error marking chat as seen:', error);
                }
              }
            }
            
            // Ensure scroll to bottom after messages update
            setTimeout(() => {
              scrollToBottomImmediate();
            }, 100);
          });
          
          setUnsubscribeMessages(() => unsubscribe);
          
          // ensure badge updates: mark chat seen on open
          try { await markChatAsSeen(chatData.id, user.id); } catch {}
        } catch (error) {
          console.error('Error setting up real-time messages listener:', error);
          // Fallback to empty messages
          setMessages([]);
        }
      } else {
        // No chat exists yet, start with empty messages
        console.log('No chat data available, starting with empty messages');
        setMessages([]);
      }

    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert(t('ERROR'), t('ERROR_LOADING_CHAT'));
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!textInput.trim()) return;

    try {
      setSending(true);
      console.log('Sending message:', textInput.trim());
      
      const messageData = {
        text: textInput.trim(),
        senderId: user.id,
        sender: 'user'
      };

      console.log('Message data:', messageData);

      // If no chat exists, create one first
      let newChat = null;
      if (!chat && otherUserId && otherUser) {
        console.log('Creating new chat...');
        newChat = await createChat({
          memberIds: [user.id, otherUserId],
          profiles: [
            { 
              id: user.id, 
              username: user.username, 
              profilePictures: user.profilePictures 
            },
            { 
              id: otherUser.id, 
              username: otherUser.username, 
              profilePictures: otherUser.profilePictures 
            }
          ],
          lastMessage: messageData.text,
          lastMessageFrom: user.id,
          seen: [user.id]
        });
        
        // Ensure the chat is properly saved before proceeding
        if (newChat && newChat.id) {
          setChat(newChat);
          console.log('New chat created:', newChat);
        } else {
          throw new Error('Failed to create chat');
        }
      }

      // Update chat immediately (like in old project)
      const currentChat = chat || newChat;
      if (currentChat) {
        // Update chat properties immediately
        const updatedChat = {
          ...currentChat,
          seen: [user.id], // Only current user has seen it
          lastMessageAt: Date.now(),
          lastMessage: messageData.text,
          lastMessageFrom: user.id
        };
        
        // Update local state immediately
        setChat(updatedChat);
        
        // Update chat in database immediately (before adding message)
        // Only update if chat already exists in database (not for newly created chats)
        if (chat) { // Only update existing chats, not newly created ones
          try {
            await updateChat(currentChat.id, updatedChat);
          } catch (error) {
            console.error('Error updating chat:', error);
            // Continue anyway
          }
        }
        // For newly created chats, the chat is already saved with the correct data
      }

      // Create temporary message for immediate display
      const tempMessage = {
        id: Date.now().toString(),
        ...messageData,
        sentAt: Date.now(),
        isTemp: true
      };

      // Add to local state immediately and scroll
      setMessages(prev => {
        const next = [...prev, tempMessage];
        return next;
      });
      scrollToBottom();
      
      // Clear input immediately
      setTextInput('');

      // Add message to Messages subcollection
      console.log('Adding message to collection...');
      const newMessage = await addMessage({
        ...messageData,
        chatId: currentChat?.id
      });
      console.log('Message added:', newMessage);
      
      // Replace temp message with real message and ensure scroll
      setMessages(prev => {
        const next = prev.map(msg => (msg.isTemp ? { ...newMessage, isTemp: false } : msg));
        return next;
      });
      scrollToBottom();
      
      // Mark chat as seen after sending message (like in old project)
      try {
        await markChatAsSeen(currentChat.id, user.id);
        console.log('Chat marked as seen after sending message');
      } catch (error) {
        console.error('Error marking chat as seen after sending:', error);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(t('ERROR'), t('ERROR_SENDING_MESSAGE'));
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.isTemp));
      
      // Revert chat state on error if we had a new chat
      if (newChat && !chat) {
        setChat(null);
      }
    } finally {
      setSending(false);
    }
  };

  const sendImage = async () => {
    try {
      // Open image picker - keep modal open until picker is ready
      const image = await openLibrary();
      
      // Close the media options modal after picker returns
      setShowMediaOptions(false);
      
      if (!image || !image.uri) return;

      setUploadingImage(true);
      setUploadProgress(0);
      console.log('Sending image:', image.uri);

      // If no chat exists, create one first
      let newChat = null;
      if (!chat && otherUserId && otherUser) {
        console.log('Creating new chat for image...');
        newChat = await createChat({
          memberIds: [user.id, otherUserId],
          profiles: [
            { 
              id: user.id, 
              username: user.username, 
              profilePictures: user.profilePictures 
            },
            { 
              id: otherUser.id, 
              username: otherUser.username, 
              profilePictures: otherUser.profilePictures 
            }
          ],
          lastMessage: 'Image',
          lastMessageFrom: user.id,
          seen: [user.id]
        });
        
        if (newChat && newChat.id) {
          setChat(newChat);
          console.log('New chat created for image:', newChat);
        } else {
          throw new Error('Failed to create chat for image');
        }
      }

      const currentChat = chat || newChat;
      if (!currentChat) {
        throw new Error('No chat available for image upload');
      }

      // Create temporary message for immediate display with local image
      const tempMessage = {
        id: `temp_${Date.now()}`,
        text: '',
        senderId: user.id,
        sender: 'user',
        type: 'image',
        picture: {
          uploadAt: Date.now(),
          original: image.uri, // Use local URI for preview
          thumbnails: {
            small: image.uri,
            medium: image.uri,
            big: image.uri
          }
        },
        provider: 'firebase',
        sentAt: Date.now(),
        isTemp: true,
        isUploading: true
      };

      // Add temporary message to local state immediately
      setMessages(prev => [...prev, tempMessage]);
      scrollToBottom();

      // Upload image to Firebase Storage
      const timestamp = Date.now();
      const storagePath = `${currentChat.id}/images/${timestamp}_${user.id}`;
      console.log('Uploading image to:', storagePath);
      
      const pictureData = await uploadImage(image.uri, storagePath, (progress) => {
        setUploadProgress(progress);
        console.log('Upload progress:', progress);
      });

      console.log('Image uploaded successfully:', pictureData);

      // Create message data with image according to interface
      const messageData = {
        text: '',
        senderId: user.id,
        sender: 'user',
        type: 'image',
        picture: {
          uploadAt: pictureData.uploadAt,
          original: pictureData.original,
          thumbnails: pictureData.thumbnails
        },
        provider: 'firebase'
      };

      // Update chat with last message
      const updatedChat = {
        ...currentChat,
        seen: [user.id],
        lastMessageAt: Date.now(),
        lastMessage: 'Image',
        lastMessageFrom: user.id,
        lastMessageFromId: user.id,
        type: 'image',
        picture: messageData.picture,
        provider: 'firebase'
      };
      
      setChat(updatedChat);
      
      if (chat) {
        try {
          await updateChat(currentChat.id, updatedChat);
        } catch (error) {
          console.error('Error updating chat with image:', error);
        }
      }

      // Add message to chat
      const newMessage = await addMessage({
        chatId: currentChat.id,
        ...messageData
      });

      console.log('Image message sent successfully:', newMessage);

      // Replace temporary message with actual message
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? { ...newMessage, isTemp: false, isUploading: false } : msg
      ));
      scrollToBottom();

      // Mark chat as seen
      try {
        await markChatAsSeen(currentChat.id, user.id);
      } catch (error) {
        console.error('Error marking chat as seen after image:', error);
      }

    } catch (error) {
      console.error('Error sending image:', error);
      
      // Close media options modal if still open
      setShowMediaOptions(false);
      
      // Only show error alert if it's not a user cancellation
      if (error?.message !== 'User cancelled image selection') {
        Alert.alert(t('ERROR'), t('ERROR_SENDING_IMAGE') || 'Fehler beim Senden des Bildes');
      }
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.isTemp));
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleVideoTrim = async (trimData) => {
    try {
      setShowTrimmer(false);
      setUploadingVideo(true);
      setUploadProgress(0);
      
      console.log('Sending video with trim data:', trimData);

      // If no chat exists, create one first
      let newChat = null;
      if (!chat && otherUserId && otherUser) {
        console.log('Creating new chat for video...');
        newChat = await createChat({
          memberIds: [user.id, otherUserId],
          profiles: [
            { 
              id: user.id, 
              username: user.username, 
              profilePictures: user.profilePictures 
            },
            { 
              id: otherUser.id, 
              username: otherUser.username, 
              profilePictures: otherUser.profilePictures 
            }
          ],
          lastMessage: 'Video',
          lastMessageFrom: user.id,
          seen: [user.id]
        });
        
        if (newChat && newChat.id) {
          setChat(newChat);
          console.log('New chat created for video:', newChat);
        } else {
          throw new Error('Failed to create chat for video');
        }
      }

      const currentChat = chat || newChat;
      if (!currentChat) {
        throw new Error('No chat available for video upload');
      }

      // Create temporary message for immediate display
      const tempMessage = {
        id: `temp_${Date.now()}`,
        text: '',
        senderId: user.id,
        sender: 'user',
        type: 'video',
        video: {
          uploadAt: Date.now(),
          original: selectedVideo.uri, // Use local URI for preview
          duration: trimData.duration,
          startTime: trimData.startTime,
          endTime: trimData.endTime
        },
        provider: 'firebase',
        sentAt: Date.now(),
        isTemp: true,
        isUploading: true
      };

      // Add temporary message to local state immediately
      setMessages(prev => [...prev, tempMessage]);
      scrollToBottom();

      // Upload video to Firebase Storage
      const timestamp = Date.now();
      const storagePath = `${currentChat.id}/videos/${timestamp}_${user.id}`;
      console.log('Uploading video to:', storagePath);
      
      const videoData = await uploadVideo(selectedVideo.uri, storagePath, (progress) => {
        setUploadProgress(progress);
        console.log('Video upload progress:', progress);
      });

      console.log('Video uploaded successfully:', videoData);

      // Create message data with video
      const messageData = {
        text: '',
        senderId: user.id,
        sender: 'user',
        type: 'video',
        video: {
          uploadAt: videoData.uploadAt,
          original: videoData.original,
          duration: trimData.duration,
          startTime: trimData.startTime,
          endTime: trimData.endTime
        },
        provider: 'firebase'
      };

      // Update chat with last message
      const updatedChat = {
        ...currentChat,
        seen: [user.id],
        lastMessageAt: Date.now(),
        lastMessage: 'Video',
        lastMessageFrom: user.id,
        lastMessageFromId: user.id,
        type: 'video',
        video: messageData.video,
        provider: 'firebase'
      };
      
      setChat(updatedChat);
      
      if (chat) {
        try {
          await updateChat(currentChat.id, updatedChat);
        } catch (error) {
          console.error('Error updating chat with video:', error);
        }
      }

      // Add message to chat
      const newMessage = await addMessage({
        chatId: currentChat.id,
        ...messageData
      });

      console.log('Video message sent successfully:', newMessage);

      // Replace temporary message with actual message
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? { ...newMessage, isTemp: false, isUploading: false } : msg
      ));
      scrollToBottom();

      // Mark chat as seen
      try {
        await markChatAsSeen(currentChat.id, user.id);
      } catch (error) {
        console.error('Error marking chat as seen after video:', error);
      }

    } catch (error) {
      console.error('Error sending video:', error);
      Alert.alert(t('ERROR'), t('ERROR_SENDING_VIDEO') || 'Fehler beim Senden des Videos');
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.isTemp));
    } finally {
      setUploadingVideo(false);
      setUploadProgress(0);
      setSelectedVideo(null);
    }
  };

  const handleMediaButtonPress = () => {
    setShowMediaOptions(true);
  };

  const handleMediaOptionSelect = async (option) => {
    if (option === 'photo') {
      // Don't close modal here - let sendImage() handle it after picker opens
      sendImage();
    } else if (option === 'video') {
      setShowMediaOptions(false);
      // Zeige Loader SOFORT beim Öffnen der Library
      setLoadingVideo(true);
      
      try {
        console.log('Opening video library...');
        
        const video = await openVideoLibrary();
        
        if (!video || !video.uri) {
          console.log('No video selected or invalid video object');
          setLoadingVideo(false);
          return;
        }

        console.log('Video selected:', video);
        
        // Video-Objekt ist bereit, öffne Trimmer
        setSelectedVideo(video);
        setLoadingVideo(false);
        setShowTrimmer(true);
      } catch (error) {
        console.log('Video selection cancelled or error:', error.message || error);
        setLoadingVideo(false);
        // User cancelled or error occurred - silently fail
        if (error.code !== 'E_PICKER_CANCELLED') {
          console.error('Error selecting video:', error);
        }
      }
    }
  };

  // Update blocked status when user or otherUser changes
  useEffect(() => {
    if (user && otherUser) {
      setIsBlocked(user._blockList?.includes(otherUser.id) || false);
    } else {
      setIsBlocked(false);
    }
  }, [user?._blockList, otherUser?.id]);

  const handleBlockUser = async () => {
    if (!user || !otherUser) return;

    try {
      if (isBlocked) {
        // Unblock
        await unblockUser(user, otherUser);
        
        // Update local state
        const updatedUser = {
          ...user,
          _blockList: (user._blockList || []).filter(id => id !== otherUser.id)
        };
        dispatch(setUserAction({user: updatedUser, dataLoaded: true}));
        setIsBlocked(false);
        
        Alert.alert(t('SUCCESS'), t('NOTBLOCKPROFILE') || 'User unblocked');
      } else {
        // Block
        Alert.alert(
          t('BLOCKPROFILE') || 'Block User',
          t('BLOCK_USER_CONFIRM') || 'Are you sure you want to block this user?',
          [
            {
              text: t('CANCEL'),
              style: 'cancel'
            },
            {
              text: t('BLOCK'),
              style: 'destructive',
              onPress: async () => {
                try {
                  await blockUser(user, otherUser);
                  
                  // Update local state
                  const updatedUser = {
                    ...user,
                    _blockList: [...(user._blockList || []), otherUser.id]
                  };
                  dispatch(setUserAction({user: updatedUser, dataLoaded: true}));
                  setIsBlocked(true);
                  
                  Alert.alert(t('SUCCESS'), t('BLOCKPROFILE') || 'User blocked');
                  goBack(); // Go back after blocking
                } catch (error) {
                  console.error('Error blocking user:', error);
                  Alert.alert(t('ERROR'), t('SOMETHING_WENT_WRONG'));
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error in block/unblock:', error);
      Alert.alert(t('ERROR'), t('SOMETHING_WENT_WRONG'));
    }
  };

  // Define chatOptions as a useMemo to ensure it updates when isBlocked changes
  const chatOptions = useMemo(() => [
    'Mute',
    'Unfriend',
    t('REPORTPROFILE'),
    isBlocked ? t('NOTBLOCKPROFILE') : t('BLOCKPROFILE')
  ], [isBlocked, t]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (flatListRef.current && messages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 200);
  };

  const scrollToBottomImmediate = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: false });
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  if (loading) {
    return (
      <Wrapper isMain>
        <StatusBars.Dark />
        <Spacer isStatusBarHeigt />
        <Wrapper alignItemsCenter justifyContentCenter style={{flex: 1}}>
          <Text>{t('LOADING')}</Text>
        </Wrapper>
      </Wrapper>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{flex: 1}} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <Wrapper isMain>
        <StatusBars.Dark />
        {/* Header */}
        <Wrapper style={styles.headerMainContainer}>
        {/* Back */}
        <Icons.Custom
          icon={appIcons.Back}
          containerStyle={[styles.BackButtonMainContainer]}
          size={scale(24)}
          onPress={() => {
            goBack();
          }}
        />
        {/* the Image And User Detail */}
        <Wrapper
          paddingHorizontalSmall
          flexDirectionRow
          alignItemsCenter
          style={{marginLeft: responsiveWidth(2)}}>
          {/* Image */}
          <Wrapper>
            <Pressable
              onPress={() => {
                navigate(routes.userProfile, {visiterProfile: true, userId: otherUserId});
              }}>
              <Images.Round 
                source={{uri: otherUser?.profilePictures?.thumbnails?.small || otherUser?.profilePictures?.original || appImages.image4}} 
                size={scale(37)} 
              />
            </Pressable>
          </Wrapper>
          {/* Text Wrapper */}
          <Wrapper
            style={{
              paddingLeft: responsiveWidth(3),
              width: responsiveWidth(37),
            }}>
            <Text isSmall isBoldFont>
              {otherUser?.username || 'Unknown User'}
            </Text>
            {/* Removed online/offline text as requested */}
          </Wrapper>
        </Wrapper>
        {/* Icons To Move on  */}
        <Wrapper
          flex={1}
          flexDirectionRow
          alignItemsCenter
          justifyContentSpaceBetween>
          <Icons.Custom
            icon={appIcons.video}
            size={scale(24)}
            color={colors.appTextColor2}
            onPress={async () => {
              try {
                // Check if user has call minutes
                const callMinutesService = require('../../../services/callMinutesService').default;
                if (!callMinutesService.hasCallMinutes(user)) {
                  console.log('ChatScreen: No call minutes available - showing shop');
                  setShowCallMinutesShop(true);
                  return;
                }
                
                const callService = require('../../../services/callService').default;
                const { callId, channelName } = await callService.initiateCall(
                  user.id,
                  otherUserId,
                  user,
                  false // isAudioOnly = false for video
                );
                navigate(routes.videoCall, { userId: otherUserId, channelName, callId, isReceiver: false });
              } catch (error) {
                console.error('Failed to start video call:', error);
              }
            }}
          />
          <Icons.Custom
            icon={appIcons.phoneInput}
            size={scale(22)}
            color={colors.appTextColor2}
            onPress={async () => {
              try {
                // Check if user has call minutes
                const callMinutesService = require('../../../services/callMinutesService').default;
                if (!callMinutesService.hasCallMinutes(user)) {
                  console.log('ChatScreen: No call minutes available - showing shop');
                  setShowCallMinutesShop(true);
                  return;
                }
                
                const callService = require('../../../services/callService').default;
                const { callId, channelName } = await callService.initiateCall(
                  user.id,
                  otherUserId,
                  user,
                  true // isAudioOnly = true for audio
                );
                navigate(routes.audioCall, { userId: otherUserId, channelName, callId, isReceiver: false });
              } catch (error) {
                console.error('Failed to start audio call:', error);
              }
            }}
          />
          <Menu>
            <MenuTrigger>
              <Icons.Custom
                icon={appIcons.Menu}
                color={colors.appTextColor2}
                size={scale(24)}
              />
            </MenuTrigger>
            <MenuOptions
              optionsContainerStyle={[
                styles.OptionMainContainer,
                {marginTop: scale(22), marginLeft: -scale(7)},
              ]}>
              {chatOptions.map((item, index) => (
                <MenuOption
                  key={index}
                  onSelect={() => {
                    if (item === t('BLOCKPROFILE') || item === t('NOTBLOCKPROFILE')) {
                      handleBlockUser();
                    } else if (item === t('REPORTPROFILE')) {
                      navigate(routes.support, {reportProfile: true, reportedUserId: otherUserId});
                    } else {
                      Alert.alert(t('INFO'), `${item} ${t('FEATURE_COMING_SOON') || 'Coming soon'}`);
                    }
                  }}
                  customStyles={{
                    optionWrapper: {
                      paddingVertical: scale(8),
                    },
                  }}>
                  <Text
                    isSmall
                    isRegularFont
                    isPrimaryColor={item === 'Unfriend' || item === t('REPORTPROFILE') || item === t('BLOCKPROFILE') || item === t('NOTBLOCKPROFILE')}>
                    {item === t('REPORTPROFILE') ? t('REPORTPROFILE') : 
                     item === t('BLOCKPROFILE') ? t('BLOCKPROFILE') :
                     item === t('NOTBLOCKPROFILE') ? t('NOTBLOCKPROFILE') :
                     t(item.toUpperCase())}
                  </Text>
                </MenuOption>
              ))}
            </MenuOptions>
          </Menu>
        </Wrapper>
      </Wrapper>

      {/* Chat Body */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item.id || index.toString()}
        onContentSizeChange={() => scrollToBottomImmediate()}
        renderItem={({item, index}) => {
          const isMyMessage = item?.senderId === user.id;
          const isImageMessage = item?.type === 'image' && item?.picture;
          const isVideoMessage = item?.type === 'video' && item?.video;
          const isMediaMessage = isImageMessage || isVideoMessage;
          
          if (isMyMessage) {
            return (
              <Wrapper marginHorizontalBase key={index}>
                <Wrapper
                  paddingHorizontalBase={!isMediaMessage}
                  paddingVerticalBase={!isMediaMessage}
                  style={[
                    styles.MeMessageContainer, 
                    { backgroundColor: isMediaMessage ? 'transparent' : '#C61323' }
                  ]}>
                  {isImageMessage ? (
                    <TouchableOpacity
                      onPress={() => !item.isUploading && setViewingImage(item)}
                      style={{ position: 'relative' }}
                      disabled={item.isUploading}>
                      <Images.Round
                        source={{ uri: item.picture.thumbnails?.medium || item.picture.original }}
                        style={{
                          width: scale(200),
                          height: scale(200),
                          borderRadius: scale(12),
                          opacity: item.isUploading ? 0.6 : 1
                        }}
                      />
                      {item.isUploading && (
                        <Wrapper style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderRadius: scale(12)
                        }}>
                          <Wrapper style={{
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            paddingHorizontal: scale(12),
                            paddingVertical: scale(8),
                            borderRadius: scale(8)
                          }}>
                            <Text style={{ color: '#FFFFFF', fontSize: scale(12) }}>
                              {uploadProgress}%
                            </Text>
                          </Wrapper>
                        </Wrapper>
                      )}
                    </TouchableOpacity>
                  ) : isVideoMessage ? (
                    <TouchableOpacity
                      onPress={() => setPlayingVideo(item)}
                      style={{ position: 'relative' }}>
                      <Wrapper style={{
                        width: scale(200),
                        height: scale(200),
                        borderRadius: scale(12),
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        opacity: item.isUploading ? 0.6 : 1,
                        borderWidth: 1,
                        borderColor: colors.appColor1,
                      }}>
                        <Wrapper style={{
                          backgroundColor: 'rgba(198, 19, 35, 0.9)',
                          width: scale(64),
                          height: scale(64),
                          borderRadius: scale(32),
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Icons.Custom
                            icon={appIcons.video}
                            size={scale(32)}
                            color="#FFFFFF"
                          />
                        </Wrapper>
                        {item.video.duration && (
                          <Wrapper style={{
                            marginTop: scale(12),
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            paddingHorizontal: scale(12),
                            paddingVertical: scale(6),
                            borderRadius: scale(12),
                          }}>
                            <Text style={{
                              color: '#FFFFFF',
                              fontSize: scale(12),
                              fontWeight: '600',
                            }}>
                              {Math.round(item.video.duration)}s
                            </Text>
                          </Wrapper>
                        )}
                      </Wrapper>
                      {item.isUploading && (
                        <Wrapper style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderRadius: scale(12)
                        }}>
                          <Wrapper style={{
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            paddingHorizontal: scale(16),
                            paddingVertical: scale(12),
                            borderRadius: scale(8)
                          }}>
                            <Text style={{ color: '#FFFFFF', fontSize: scale(14), fontWeight: '600' }}>
                              {uploadProgress}%
                            </Text>
                          </Wrapper>
                        </Wrapper>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontWeight: '400' }}>
                      {item?.text || item?.lastMessage}
                    </Text>
                  )}
                </Wrapper>
                <Text isSmall isTextColor2 style={{alignSelf: 'flex-end'}}>
                  {formatTimeAgo(item?.sentAt)}
                </Text>
                <Spacer isBasic />
              </Wrapper>
            );
          } else {
            return (
              <Wrapper marginHorizontalBase key={index}>
                <Wrapper
                  paddingHorizontalBase={!isMediaMessage}
                  paddingVerticalBase={!isMediaMessage}
                  style={[
                    styles.OtherMessageContainer, 
                    { backgroundColor: isMediaMessage ? 'transparent' : '#EFEFEF' }
                  ]}>
                  {isImageMessage ? (
                    <TouchableOpacity onPress={() => setViewingImage(item)}>
                      <Images.Round
                        source={{ uri: item.picture.thumbnails?.medium || item.picture.original }}
                        style={{
                          width: scale(200),
                          height: scale(200),
                          borderRadius: scale(12)
                        }}
                      />
                    </TouchableOpacity>
                  ) : isVideoMessage ? (
                    <TouchableOpacity
                      onPress={() => setPlayingVideo(item)}
                      style={{ position: 'relative' }}>
                      <Wrapper style={{
                        width: scale(200),
                        height: scale(200),
                        borderRadius: scale(12),
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: colors.appColor1,
                      }}>
                        <Wrapper style={{
                          backgroundColor: 'rgba(198, 19, 35, 0.9)',
                          width: scale(64),
                          height: scale(64),
                          borderRadius: scale(32),
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Icons.Custom
                            icon={appIcons.video}
                            size={scale(32)}
                            color="#FFFFFF"
                          />
                        </Wrapper>
                        {item.video.duration && (
                          <Wrapper style={{
                            marginTop: scale(12),
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            paddingHorizontal: scale(12),
                            paddingVertical: scale(6),
                            borderRadius: scale(12),
                          }}>
                            <Text style={{
                              color: '#FFFFFF',
                              fontSize: scale(12),
                              fontWeight: '600',
                            }}>
                              {Math.round(item.video.duration)}s
                            </Text>
                          </Wrapper>
                        )}
                      </Wrapper>
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ color: '#000000', fontWeight: '400' }}>
                      {item?.text || item?.lastMessage}
                    </Text>
                  )}
                </Wrapper>
                <Text isSmall isTextColor2>
                  {formatTimeAgo(item?.sentAt)}
                </Text>
                <Spacer isBasic />
              </Wrapper>
              );
            }
          }}
        style={{flex: 1}}
        contentContainerStyle={{paddingBottom: responsiveHeight(15)}}
        showsVerticalScrollIndicator={false}
      />
        {/* Chat Input container */}
        <Wrapper style={[styles.ChatInputMainContainer, {paddingBottom: insets.bottom}]}>
          <Wrapper style={styles.ChatInputContainer}>
            <TouchableOpacity
              onPress={handleMediaButtonPress}
              disabled={uploadingImage || uploadingVideo || sending}
              style={{
                padding: scale(8),
                marginRight: scale(4),
              }}
            >
              <Icons.Svg
                svg={appSvgs.attach}
                size={scale(24)}
              />
            </TouchableOpacity>
            
            <TextInput
              placeholder={uploadingImage || uploadingVideo ? `${t(uploadingVideo ? 'UPLOADING_VIDEO' : 'UPLOADING')}... ${uploadProgress}%` : t('YOUR_MESSAGE')}
              placeholderTextColor={colors.appBorderColor2}
              style={styles.InputStyles}
              value={textInput}
              onChangeText={setTextInput}
              multiline
              editable={!uploadingImage && !uploadingVideo}
            />

            <Icons.Button
              isRound
              customIcon={appIcons.sendIcon}
              iconColor={colors.appBgColor1}
              buttonColor={colors.appBGColor}
              buttonStyle={{
                height: responsiveHeight(4.5),
                width: scale(36),
              }}
              iconSize={scale(20)}
              onPress={sendMessage}
              disabled={sending || !textInput.trim() || uploadingImage || uploadingVideo}
            />
          </Wrapper>
          {/* Microphone button removed per request */}
        </Wrapper>

        {/* Media Options Modal */}
        <Modal
          visible={showMediaOptions}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMediaOptions(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowMediaOptions(false)}>
            <View 
              style={styles.mediaOptionsContainer}
              onStartShouldSetResponder={() => true}>
              <TouchableOpacity
                style={styles.mediaOption}
                onPress={() => handleMediaOptionSelect('photo')}>
                <Icons.Custom
                  icon={appIcons.UploadImage}
                  size={scale(32)}
                  color={colors.appColor1}
                />
                <Text style={styles.mediaOptionText}>{t('PHOTO')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mediaOption}
                onPress={() => handleMediaOptionSelect('video')}>
                <Icons.Custom
                  icon={appIcons.video}
                  size={scale(32)}
                  color={colors.appColor1}
                />
                <Text style={styles.mediaOptionText}>{t('VIDEO')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Video Loading Overlay */}
        {loadingVideo && (
          <Wrapper style={styles.loadingOverlay}>
            <Wrapper style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('LOADING')}...</Text>
            </Wrapper>
          </Wrapper>
        )}

        {/* Video Trimmer Modal */}
        <Modal
          visible={showTrimmer}
          transparent={false}
          animationType="slide"
          onRequestClose={() => {
            setShowTrimmer(false);
            setSelectedVideo(null);
          }}>
          {selectedVideo && (
            <VideoTrimmer
              videoUri={selectedVideo.uri}
              onTrim={handleVideoTrim}
              onCancel={() => {
                setShowTrimmer(false);
                setSelectedVideo(null);
              }}
              maxDuration={30}
            />
          )}
        </Modal>

        {/* Video Player Modal */}
        <Modal
          visible={playingVideo !== null}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setPlayingVideo(null)}>
          {playingVideo && (
            <View style={styles.videoPlayerContainer}>
              <TouchableOpacity
                style={[styles.closeVideoButton, { top: insets.top + scale(10) }]}
                onPress={() => setPlayingVideo(null)}>
                <Text style={styles.closeVideoButtonText}>✕</Text>
              </TouchableOpacity>
              <Video
                source={{ uri: playingVideo.video.original }}
                style={styles.videoPlayer}
                controls
                resizeMode="contain"
                paused={false}
              />
            </View>
          )}
        </Modal>

        {/* Image Viewer Modal */}
        <Modal
          visible={viewingImage !== null}
          transparent={false}
          animationType="fade"
          onRequestClose={() => setViewingImage(null)}>
          {viewingImage && (
            <View style={styles.imageViewerContainer}>
              <TouchableOpacity
                style={[styles.closeImageButton, { top: insets.top + scale(10) }]}
                onPress={() => setViewingImage(null)}>
                <Text style={styles.closeImageButtonText}>✕</Text>
              </TouchableOpacity>
              <Image
                source={{ uri: viewingImage.picture.original || viewingImage.picture.thumbnails?.big }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            </View>
          )}
        </Modal>
        
        {/* Call Minutes Shop Modal */}
        <CallMinutesShopModal
          visible={showCallMinutesShop}
          onClose={() => setShowCallMinutesShop(false)}
          onSuccess={(minutes) => {
            console.log('ChatScreen: Purchased', minutes, 'call minutes');
            setShowCallMinutesShop(false);
          }}
        />
      </Wrapper>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  headerMainContainer: {
    paddingVertical: sizes.smallMargin + 20,
    marginTop: sizes.statusBarHeight + responsiveHeight(0.5),
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: sizes.baseMargin,
    backgroundColor: colors.appBgColor1,
  },
  BackButtonMainContainer: {
    borderWidth: 1,
    padding: responsiveWidth(2),
    borderRadius: responsiveWidth(100),
    borderColor: colors.appBorderColor2,
    ...appStyles.center,
  },
  BadgeMainContainer: {
    height: scale(8),
    width: scale(8),
    top: scale(4),
    left: scale(29),
    backgroundColor: colors.appBgColor1,
    borderRadius: responsiveWidth(100),
  },
  BadgeInnerContainer: {
    flex: 1,
    margin: scale(1.1),
    backgroundColor: '#13C634',
    borderRadius: responsiveWidth(100),
  },
  OptionMainContainer: {
    width: responsiveWidth(36),
    backgroundColor: colors.appBgColor1,
    ...appStyles.shadowDark,
    borderRadius: responsiveWidth(3),
    padding: scale(18),
  },
  ChatInputMainContainer: {
    width: responsiveWidth(100),
    paddingVertical: responsiveHeight(2),
    backgroundColor: colors.appBgColor1,
    paddingHorizontal: sizes.baseMargin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.appBorderColor2,
  },
  ChatInputContainer: {
    height: responsiveHeight(6),
    width: responsiveWidth(92),
    borderWidth: 1,
    borderRadius: 150,
    borderColor: colors.appBorderColor2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: sizes.TinyMargin,
  },
  InputStyles: {
    flex: 1,
    fontSize: fontSizes.regular,
    maxHeight: responsiveHeight(4),
    textAlignVertical: 'center',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  MeMessageContainer: {
    borderRadius: 24,
    borderBottomRightRadius: 0,
    maxWidth: responsiveWidth(70),
    minWidth: responsiveWidth(10),
    alignSelf: 'flex-end',
    marginLeft: responsiveWidth(20),
  },
  OtherMessageContainer: {
    borderRadius: 24,
    borderBottomLeftRadius: 0,
    maxWidth: responsiveWidth(70),
    minWidth: responsiveWidth(10),
    alignSelf: 'flex-start',
    marginRight: responsiveWidth(20),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaOptionsContainer: {
    backgroundColor: colors.appBgColor1,
    borderRadius: scale(16),
    padding: scale(20),
    flexDirection: 'row',
    gap: scale(20),
    ...appStyles.shadowDark,
  },
  mediaOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(20),
    borderRadius: scale(12),
    backgroundColor: colors.appBgColor2,
    minWidth: scale(100),
  },
  mediaOptionText: {
    marginTop: scale(8),
    fontSize: fontSizes.regular,
    color: colors.appTextColor1,
    fontWeight: '600',
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: responsiveHeight(50),
  },
  closeVideoButton: {
    position: 'absolute',
    top: scale(50),
    right: scale(20),
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: scale(25),
    padding: scale(8),
  },
  closeVideoButtonText: {
    fontSize: scale(32),
    color: '#FFFFFF',
    fontWeight: '300',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageButton: {
    position: 'absolute',
    top: scale(50),
    right: scale(20),
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: scale(25),
    padding: scale(8),
  },
  closeImageButtonText: {
    fontSize: scale(32),
    color: '#FFFFFF',
    fontWeight: '300',
  },
  fullscreenImage: {
    width: responsiveWidth(100),
    height: responsiveHeight(100),
    borderRadius: 0,
    zIndex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingContainer: {
    backgroundColor: colors.appBgColor1,
    padding: scale(30),
    borderRadius: scale(16),
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSizes.medium,
    color: colors.appTextColor1,
    fontWeight: '600',
  },
}); 