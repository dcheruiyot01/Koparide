// src/auth/pages/VerifyEmailRequest.tsx
import { useState, FormEvent } from "react";
import api from "../../api/axios";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    Alert,
    Link as MuiLink
} from "@mui/material";
import { Link } from "react-router-dom";

export const VerifyEmailRequest = () => {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await api.post("/auth/resend-verification", { email });
            setSuccess(res.data.message || "Verification email sent.");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box display="flex" justifyContent="center" mt={10} px={2}>
            <Paper elevation={4} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
                <Typography variant="h5" fontWeight={600} mb={1}>
                    Verify Your Email
                </Typography>

                <Typography variant="body2" color="text.secondary" mb={3}>
                    Enter your email and we’ll resend the verification link.
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        <TextField
                            label="Email Address"
                            type="email"
                            required
                            fullWidth
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />

                        {error && <Alert severity="error">{error}</Alert>}
                        {success && <Alert severity="success">{success}</Alert>}

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={submitting}
                            fullWidth
                        >
                            {submitting ? "Sending..." : "Send Verification Email"}
                        </Button>
                    </Stack>
                </form>

                <Box mt={3} textAlign="center">
                    <MuiLink component={Link} to="/login" underline="hover">
                        Back to Login
                    </MuiLink>
                </Box>
            </Paper>
        </Box>
    );
};