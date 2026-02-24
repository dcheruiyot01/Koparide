// src/auth/pages/Login.tsx
import { useState, FormEvent } from "react";
import { useAuth } from "../../auth/useAuth";
import { GoogleLoginButton } from "../../components/GoogleLoginButton";
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
import {Link, useNavigate} from "react-router-dom";

export const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate(); // hook for navigation
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await login(email, password);
            // On success, redirect to dashboard
            navigate("/");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Login failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box display="flex" justifyContent="center" mt={10} px={2}>
            <Paper elevation={4} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
                <Typography variant="h5" fontWeight={600} mb={2}>
                    Login
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

                        <TextField
                            label="Password"
                            type="password"
                            required
                            fullWidth
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />

                        {error && <Alert severity="error">{error}</Alert>}

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={submitting}
                            fullWidth
                        >
                            {submitting ? "Logging in..." : "Login"}
                        </Button>
                    </Stack>
                </form>

                <Box mt={3}>
                    <GoogleLoginButton />
                </Box>

                <Box mt={3} textAlign="center">
                    <MuiLink component={Link} to="/forgot-password" underline="hover">
                        Forgot your password
                    </MuiLink>
                </Box>

                <Box mt={1} textAlign="center">
                    <MuiLink component={Link} to="/register" underline="hover">
                        Create an account
                    </MuiLink>
                </Box>
            </Paper>
        </Box>
    );
};