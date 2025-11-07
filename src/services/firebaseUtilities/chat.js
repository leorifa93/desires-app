import firestore from '@react-native-firebase/firestore';
import {addDocument, updateDocument, removeDocument} from './firestore';

export const getAllChats = async (userId, limit = null, filters = []) => {
  try {
    let query = firestore()
      .collection('Chats')
      .where('memberIds', 'array-contains', userId);

    // Apply additional filters if provided
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        query = query.where(filter.key, filter.opr, filter.value);
      });
    }

    query = query.orderBy('lastMessageAt', 'desc');
    
    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    const chats = [];
    snapshot.forEach(doc => {
      chats.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return chats;
  } catch (error) {
    console.error('Error getting chats:', error);
    throw error;
  }
};

export const getChat = async (chatId) => {
  try {
    if (!chatId) {
      console.error('No chatId provided for getChat');
      return null;
    }

    const doc = await firestore()
      .collection('Chats')
      .doc(chatId)
      .get();

    if (doc.exists) {
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    console.log(`Chat with ID ${chatId} not found`);
    return null;
  } catch (error) {
    console.error('Error getting chat:', error);
    throw error;
  }
};

export const createChat = async (chatData) => {
  try {
    // Create members object like in old project
    const members = {};
    chatData.memberIds.forEach(id => {
      members[id] = true;
    });

    const chatDocument = {
      ...chatData,
      members,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
      seen: chatData.seen || [chatData.memberIds[0]] // Mark first user as seen
    };

    const result = await addDocument({
      collection: 'Chats',
      data: chatDocument
    });
    
    // The result now contains both id and data
    return result;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

export const updateChat = async (chatId, updates) => {
  console.log('Updating chat:', chatId, updates);
  try {
    if (!chatId) {
      console.error('No chatId provided for updateChat');
      return;
    }

    await updateDocument({
      collection: 'Chats',
      id: chatId,
      data: updates // Don't automatically add lastMessageAt
    });
  } catch (error) {
    console.error('Error updating chat:', error);
    throw error;
  }
};

export const deleteChat = async (chatId) => {
  try {
    await removeDocument({
      collection: 'Chats',
      docId: chatId
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

export const markChatAsSeen = async (chatId, userId) => {
  try {
    if (!chatId) {
      console.log('No chatId provided for markChatAsSeen');
      return;
    }

    const chat = await getChat(chatId);
    if (chat && !chat.seen?.includes(userId)) {
      const updatedSeen = [...(chat.seen || []), userId];
      await updateDocument({
        collection: 'Chats',
        id: chatId,
        data: { seen: updatedSeen }
      });
      console.log(`Marked chat ${chatId} as seen for user ${userId}`);
    }
  } catch (error) {
    console.error('Error marking chat as seen:', error);
    // Don't throw error, just log it
  }
};

export const addMessageToChat = async (chatId, message) => {
  try {
    if (!chatId) {
      console.error('No chatId provided for addMessageToChat');
      return;
    }

    const chat = await getChat(chatId);
    if (chat) {
      let lastMessageText = message.text;
      if (message.type === 'image') {
        lastMessageText = 'Image';
      } else if (message.type === 'video') {
        lastMessageText = 'Video';
      }
      
      const updatedChat = {
        lastMessage: lastMessageText,
        lastMessageFrom: message.senderId,
        lastMessageFromId: message.senderId,
        lastMessageAt: Date.now()
      };
      
      // Include image data if it's an image message
      if (message.type === 'image' && message.picture) {
        updatedChat.type = 'image';
        updatedChat.picture = message.picture;
        updatedChat.provider = message.provider || 'firebase';
      } else if (message.type === 'video' && message.video) {
        updatedChat.type = 'video';
        updatedChat.video = message.video;
        updatedChat.provider = message.provider || 'firebase';
      } else {
        updatedChat.type = 'text';
      }
      
      // Mark as unseen for other members
      const updatedSeen = chat.memberIds.filter(id => id === message.senderId);
      
      await updateChat(chatId, {
        ...updatedChat,
        seen: updatedSeen
      });
    }
  } catch (error) {
    console.error('Error updating chat with message:', error);
    throw error;
  }
}; 

export const findChatBetweenUsers = async (userId1, userId2) => {
  try {
    // Get all chats for the first user
    const user1Chats = await getAllChats(userId1);
    
    // Find chat that includes both users
    const chat = user1Chats.find(chat => 
      chat.memberIds?.includes(userId1) && 
      chat.memberIds?.includes(userId2)
    );
    
    return chat || null;
  } catch (error) {
    console.error('Error finding chat between users:', error);
    throw error;
  }
}; 

export const getMessagesForChat = async (chatId, limit = 50) => {
  try {
    if (!chatId) {
      console.log('No chatId provided for getMessagesForChat');
      return [];
    }

    console.log(`Loading messages for chat: ${chatId}`);
    
    const snapshot = await firestore()
      .collection('Chats')
      .doc(chatId)
      .collection('Messages')
      .orderBy('sentAt', 'desc')
      .limit(limit)
      .get();

    const messages = [];
    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`Found ${messages.length} messages for chat ${chatId}`);

    // Sort by sentAt ascending for display
    return messages.reverse();
  } catch (error) {
    console.error('Error getting messages:', error);
    // Return empty array instead of throwing
    return [];
  }
};

export const addMessage = async (messageData) => {
  try {
    if (!messageData.chatId) {
      console.error('No chatId provided for addMessage');
      throw new Error('No chatId provided');
    }

    const message = {
      ...messageData,
      sentAt: Date.now(),
      createdAt: Date.now()
    };

    console.log(`Adding message to chat ${messageData.chatId}:`, message);

    // Add message as subcollection of Chat
    const docRef = await firestore()
      .collection('Chats')
      .doc(messageData.chatId)
      .collection('Messages')
      .add(message);

    const newMessage = {
      id: docRef.id,
      ...message
    };

    console.log(`Message added successfully with ID: ${docRef.id}`);
    return newMessage;
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
}; 

export const listenToMessages = (chatId, callback) => {
  try {
    if (!chatId) {
      console.log('No chatId provided for listenToMessages');
      return null;
    }

    console.log(`Setting up real-time listener for chat: ${chatId}`);
    
    const unsubscribe = firestore()
      .collection('Chats')
      .doc(chatId)
      .collection('Messages')
      .orderBy('sentAt', 'asc')
      .onSnapshot((snapshot) => {
        const messages = [];
        snapshot.forEach(doc => {
          messages.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`Real-time update: ${messages.length} messages`);
        callback(messages);
      }, (error) => {
        console.error('Error in real-time listener:', error);
      });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up real-time listener:', error);
    return null;
  }
};

export const listenToChats = (userId, callback) => {
  try {
    if (!userId) {
      console.log('No userId provided for listenToChats');
      return null;
    }

    console.log(`Setting up real-time listener for chats of user: ${userId}`);
    
    const unsubscribe = firestore()
      .collection('Chats')
      .where('memberIds', 'array-contains', userId)
      .orderBy('lastMessageAt', 'desc')
      .onSnapshot((snapshot) => {
        const chats = [];
        snapshot.forEach(doc => {
          chats.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`Real-time update: ${chats.length} chats`);
        callback(chats);
      }, (error) => {
        console.error('Error in real-time chats listener:', error);
      });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up real-time chats listener:', error);
    return null;
  }
}; 