import { updateUser } from './firebaseUtilities/user';
import { addDocument } from './firebaseUtilities/firestore';

export const setBoost = async (user) => {
    if (user.availableCoins > 0) {
        const history = {
            createdOn: Date.now(),
            activity: 'BOOST', // CoinActivity.Boost from old project
            isRevenue: false,
            userId: user.id,
            amount: 1
        };

        const updatedUser = {
            ...user,
            lastBoostAt: new Date().getTime() / 1000,
            availableCoins: user.availableCoins - 1
        };

        console.log('setBoost: Adding history record to Wallet collection');
        // Add history record to Wallet collection (like old project)
        await addDocument({
            collection: 'Wallet',
            data: history
        });
        console.log('setBoost: History record added successfully');

        console.log('setBoost: Updating user in Firestore with lastBoostAt:', updatedUser.lastBoostAt);
        // Update user
        await updateUser(user.id, updatedUser);
        console.log('setBoost: User updated in Firestore successfully');

        console.log('setBoost: Success, returning updated user');
        return updatedUser;
    } else {
        console.log('setBoost: Not enough coins');
        throw new Error('NOTENOUGHCOINS');
    }
};

export const setNextBoost = async (userId) => {
    try {
        console.log('setNextBoost: Attempting to call cloud function for userId:', userId);
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 5000)
        );
        
        // Create the fetch promise
        const fetchPromise = fetch(`http://127.0.0.1:5001/dexxire-dfcba/us-central1/setNextBoost?userId=${userId}`);
        
        // Race between fetch and timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('setNextBoost: Error calling cloud function:', error);
        // Don't throw error - just log it and continue
        console.log('setNextBoost: Continuing without cloud function call');
        return { success: false, error: error.message };
    }
}; 