// src/auth/pages/ResetPassword.tsx
import { useState, FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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

export const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!token) {
        return <Typography>Invalid or missing reset token.</Typography>;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        if (password !== confirm) {
            setError("Passwords do not match.");
            setSubmitting(false);
            return;
        }

        try {
            const res = await api.post(`/auth/reset-password/${token}`, { password });
            setSuccess(res.data.message || "Password reset successful.");

            setTimeout(() => navigate("/login"), 2000);
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
                    Reset Password
                </Typography>

                <Typography variant="body2" color="text.secondary" mb={3}>
                    Enter your new password below.
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        <TextField
                            label="New Password"
                            type="password"
                            required
                            fullWidth
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />

                        <TextField
                            label="Confirm Password"
                            type="password"
                            required
                            fullWidth
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
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
                            {submitting ? "Resetting..." : "Reset Password"}
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