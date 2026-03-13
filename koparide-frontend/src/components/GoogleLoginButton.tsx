// src/components/GoogleLoginButton.tsx
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../auth/useAuth";

interface GoogleLoginButtonProps {
    onSuccess?: () => void; // optional callback to close modal
}

export const GoogleLoginButton = ({ onSuccess }: GoogleLoginButtonProps) => {
    const { googleLogin } = useAuth();

    return (
        <GoogleLogin
            onSuccess={async (credentialResponse) => {
                if (!credentialResponse.credential) return;
                await googleLogin(credentialResponse.credential);
                onSuccess?.(); // close modal after login
            }}
            onError={() => {
                console.error("Google Login Failed");
            }}
        />
    );
};