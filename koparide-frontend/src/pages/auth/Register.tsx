// src/auth/pages/Register.tsx
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
import { Link, useNavigate } from "react-router-dom"; // import useNavigate

export const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate(); // hook for navigation

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Call backend register via useAuth
            await register(name, email, password);

            // On success, redirect to dashboard
            navigate("/");
        } catch (err: any) {
            // Show error message if registration fails
            setError(err?.response?.data?.message || "Registration failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box display="flex" justifyContent="center" mt={10} px={2}>
            <Paper elevation={4} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
                <Typography variant="h5" fontWeight={600} mb={2}>
                    Create an Account
                </Typography>

                {/* ✅ Registration form */}
                <form onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        <TextField
                            label="Full Name"
                            type="text"
                            required
                            fullWidth
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />

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

                        {/* ✅ Show error if registration fails */}
                        {error && <Alert severity="error">{error}</Alert>}

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={submitting}
                            fullWidth
                        >
                            {submitting ? "Creating account..." : "Register"}
                        </Button>
                    </Stack>
                </form>

                {/* ✅ Optional Google login */}
                <Box mt={3}>
                    <GoogleLoginButton />
                </Box>

                {/* ✅ Link back to login */}
                <Box mt={3} textAlign="center">
                    <MuiLink component={Link} to="/login" underline="hover">
                        Already have an account? Login
                    </MuiLink>
                </Box>
            </Paper>
        </Box>
    );
};