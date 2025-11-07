//import { combineReducers } from 'redux';
import { combineReducers } from '@reduxjs/toolkit';
// Removed nested persist here; we already persist at root level in store/index.js

import authReducer from './auth';

export default combineReducers({
    auth: authReducer,
    //app: appReducer,
});


