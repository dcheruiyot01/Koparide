import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: { main: "#1976d2" },
        secondary: { main: "#9c27b0" }
    }
});
console.log("Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <App />
                </ThemeProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    </React.StrictMode>
);
