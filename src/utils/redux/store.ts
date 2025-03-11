import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/authSlice";

// Persist Config for User Auth
const userPersistConfig = { key: "userAuth", storage, version: 1 };
const AuthPersistReducer = persistReducer(userPersistConfig, authReducer);

export const store = configureStore({
    reducer: {
        auth: AuthPersistReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
