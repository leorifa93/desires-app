import { auth } from '../../firebaseConfig';
import { getAuth } from '@react-native-firebase/auth';

export async function registerWithEmail(email, password) {
    try {
        const userCredential = await getAuth().createUserWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('EMAIL_ALREADY_IN_USE');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('INVALID_EMAIL');
        } else if (error.code === 'auth/weak-password') {
            throw new Error('WEAK_PASSWORD');
        } else if (error.code === 'auth/network-request-failed') {
            throw new Error('NETWORK_ERROR');
        } else {
            throw new Error('REGISTRATION_ERROR_GENERIC');
        }
    }
}

export async function signInWithEmail(email, password) {
    try {
        const userCredential = await getAuth().signInWithEmailAndPassword(email, password);
        return userCredential;
    } catch (error) {
        console.log('Login error:', error);
        
        // Translate Firebase error codes to user-friendly messages
        if (error.code === 'auth/user-not-found') {
            throw new Error('EMAIL_OR_PASSWORD_INCORRECT');
        } else if (error.code === 'auth/wrong-password') {
            throw new Error('EMAIL_OR_PASSWORD_INCORRECT');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('INVALID_EMAIL');
        } else if (error.code === 'auth/user-disabled') {
            throw new Error('USER_DISABLED');
        } else if (error.code === 'auth/too-many-requests') {
            throw new Error('TOO_MANY_ATTEMPTS');
        } else if (error.code === 'auth/network-request-failed') {
            throw new Error('NETWORK_ERROR');
        } else {
            throw new Error('LOGIN_ERROR_GENERIC');
        }
    }
}