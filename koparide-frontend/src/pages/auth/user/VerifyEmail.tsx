// src/auth/pages/VerifyEmail.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../../api/axios.ts";
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert
} from "@mui/material";

export const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await api.get(`/auth/verify-email/${token}`);
                setMessage(res.data.message || "Email verified successfully.");
                setStatus("success");
            } catch (err: any) {
                setMessage(err?.response?.data?.message || "Invalid or expired verification link.");
                setStatus("error");
            }
        };

        verify();
    }, [token]);

    return (
        <Box display="flex" justifyContent="center" mt={10} px={2}>
            <Paper elevation={4} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
                {status === "loading" && (
                    <Typography>Verifying your email...</Typography>
                )}

                {status === "success" && (
                    <>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {message}
                        </Alert>
                        <Button
                            variant="contained"
                            fullWidth
                            component={Link}
                            to="/login"
                        >
                            Continue to Login
                        </Button>
                    </>
                )}

                {status === "error" && (
                    <>
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {message}
                        </Alert>
                        <Button
                            variant="outlined"
                            fullWidth
                            component={Link}
                            to="/verify-email"
                        >
                            Resend Verification Email
                        </Button>
                    </>
                )}
            </Paper>
        </Box>
    );
};