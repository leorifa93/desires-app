//import { createStore, applyMiddleware } from 'redux'
//import { applyMiddleware } from 'redux'
import {configureStore} from '@reduxjs/toolkit';
import rootReducers from './reducers';
// import thunk from 'redux-thunk';
// import persistReducer from 'redux-persist/es/persistReducer'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
//import storage from 'redux-persist/lib/storage'
import AsyncStorage from '@react-native-async-storage/async-storage';

let persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Only persist auth state
  //blacklist: ['app']
};

let persistedReducer = persistReducer(persistConfig, rootReducers);

// const middleWare = [thunk]

//const store = createStore(rootReducers, applyMiddleware(...middleWare))

const store = configureStore(
  {
    //reducer: rootReducers
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  },

  // applyMiddleware(...middleWare)
);

const persistor = persistStore(store);

export default store;
export { persistor };
