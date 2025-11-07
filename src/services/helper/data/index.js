import { appImages } from "../../utilities"
import firestore from '@react-native-firebase/firestore'
import { setUser } from '../../../store/reducers/auth';
import { useDispatch } from 'react-redux';

export const rolesTypes = {
    weight_loss: 'weight-loss',
    maintain_weight: 'maintain-weight',
    professional_dietitian: 'professional-dietitian',
}

export const users = [
    {
        id: 8373,
        name: 'Jenny Wilson',
        image: appImages.user1,
        address: 'London',
        friend: true,
    },
    {
        id: 22345,
        name: 'William Shaw',
        image: appImages.user2,
        address: 'London',
        friend: true,
    },
    {
        id: 8453,
        name: 'John Thomas',
        image: appImages.user3,
        address: 'London',
        friend: true,
    },
    {
        id: 23445,
        name: 'Nilson Meno',
        image: appImages.user4,
        address: 'New York',
        friend: true,
    },
    {
        id: 46216,
        name: 'Jackobe Black',
        image: appImages.user5,
        address: 'New York',
        friend: true,
    },
]

export const orderStatuses={
    pending:'pending',
    inProgress:'inProgress',
    completed:'completed',
    canelled:'canelled'
}

export const appointmentStatuses={
    pending:'pending',
    confirmed:'confirmed',
    completed:'completed',
    canelled:'canelled'
}

export const saveUserData = async (userData, callback) => {
    try {
      // Remove ALL undefined values recursively to prevent Firestore errors
      const removeUndefined = (obj) => {
        if (obj === null) return null;
        if (typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) {
          return obj.map(removeUndefined).filter(item => item !== undefined);
        }
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = removeUndefined(value);
          }
        }
        return cleaned;
      };
      
      const finalUserData = removeUndefined(userData);
      
      await firestore().collection('Users').doc(finalUserData.id).update(finalUserData);
      
      if (callback) {
        callback();
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Users:', error);
    }
  };