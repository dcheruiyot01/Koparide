// src/components/GoogleLoginButton.tsx
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../auth/useAuth";

export const GoogleLoginButton = () => {
    const { googleLogin } = useAuth();

    return (
        <GoogleLogin
            onSuccess={(credentialResponse) => {
                if (!credentialResponse.credential) return;
                googleLogin(credentialResponse.credential);
            }}
            onError={() => {
                console.error("Google Login Failed");
            }}
        />
    );
};
