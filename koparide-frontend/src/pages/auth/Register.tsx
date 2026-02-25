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
import { Link, useNavigate } from "react-router-dom";

export const Register = ({ onSuccess }: { onSuccess?: () => void }) => {
    const { register } = useAuth();
    const navigate = useNavigate();

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
            await register(name, email, password);

            if (onSuccess) {
                onSuccess(); // close modal
            } else {
                navigate("/"); // normal page redirect
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "Registration failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box>
            <Paper elevation={0} sx={{ p: 0 }}>
                <Typography variant="h5" fontWeight={600} mb={2}>
                    Create an Account
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        <TextField
                            label="Full Name"
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

                <Box mt={3}>
                    <GoogleLoginButton />
                </Box>

                <Box mt={3} textAlign="center">
                    <MuiLink component={Link} to="/login" underline="hover">
                        Already have an account? Login
                    </MuiLink>
                </Box>
            </Paper>
        </Box>
    );
};
