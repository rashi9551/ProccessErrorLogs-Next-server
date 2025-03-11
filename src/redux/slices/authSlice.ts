import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
    email: string;
    loggedIn: boolean;
}

const initialState: AuthState = {
    email: "",
    loggedIn: false,
};

export const authSlice = createSlice({
    name: "Auth",
    initialState,
    reducers: {
        userLogin: (state, action: PayloadAction<{ email: string; loggedIn: boolean }>) => {
            state.email = action.payload.email;
            state.loggedIn = action.payload.loggedIn;
        },
        userLogout: (state) => {
            state.email = "";
            state.loggedIn = false;
        },
    },
});

export const { userLogin, userLogout } = authSlice.actions;
export default authSlice.reducer;
