// src/auth/pages/Dashboard.tsx
import { Typography, Paper, Box } from "@mui/material";

export const Dashboard = () => {
    return (
        <Box>
            <Typography variant="h4" mb={3}>
                Welcome to your Dashboard
            </Typography>

            <Paper sx={{ p: 3 }}>
                <Typography>
                    This is where your main content will go.
                </Typography>
            </Paper>
        </Box>
    );
};
