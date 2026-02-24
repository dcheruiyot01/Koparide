// src/layout/DashboardLayout.tsx
import { ReactNode, useState } from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Drawer,
    List,
    ListItemButton,
    ListItemText,
    Box,
    CssBaseline,
    Divider,
    Avatar,
    Menu,
    MenuItem
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../auth/useAuth";
import { Link } from "react-router-dom";

const drawerWidth = 240;

interface Props {
    children: ReactNode;
}

export const DashboardLayout = ({ children }: Props) => {
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

    const toggleDrawer = () => setMobileOpen(!mobileOpen);

    const openMenu = (e: React.MouseEvent<HTMLElement>) =>
        setMenuAnchor(e.currentTarget);

    const closeMenu = () => setMenuAnchor(null);

    const drawer = (
        <Box>
            <Toolbar>
                <Typography variant="h6" fontWeight={600}>
                    Koparide
                </Typography>
            </Toolbar>
            <Divider />

            <List>
                <ListItemButton component={Link} to="/">
                    <DashboardIcon sx={{ mr: 2 }} />
                    <ListItemText primary="Dashboard" />
                </ListItemButton>

                {/* Add more sidebar links here */}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: "flex" }}>
            <CssBaseline />

            {/* Top AppBar */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: theme => theme.zIndex.drawer + 1
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={toggleDrawer}
                        sx={{ mr: 2, display: { sm: "none" } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Dashboard
                    </Typography>

                    <Avatar
                        sx={{ cursor: "pointer" }}
                        onClick={openMenu}
                    >
                        {user?.name?.[0] || user?.email?.[0]}
                    </Avatar>

                    <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
                        {/* Show user email, disabled */}
                        <MenuItem disabled>{user?.email}</MenuItem>
                        <Divider />

                        {/* New dropdown options */}
                        <MenuItem
                            onClick={() => {
                                closeMenu();
                                // Navigate to profile page
                            }}
                        >
                            Profile
                        </MenuItem>

                        <MenuItem
                            onClick={() => {
                                closeMenu();
                                // Navigate to account page
                            }}
                        >
                            Account
                        </MenuItem>

                        <MenuItem
                            onClick={() => {
                                closeMenu();
                                // Navigate to host onboarding page
                            }}
                        >
                            Become a host
                        </MenuItem>

                        <Divider />

                        {/* Logout option */}
                        <MenuItem
                            onClick={() => {
                                closeMenu();
                                logout();
                            }}
                        >
                            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: "none", sm: "block" },
                    "& .MuiDrawer-paper": { width: drawerWidth }
                }}
                open
            >
                {drawer}
            </Drawer>

            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={toggleDrawer}
                sx={{
                    display: { xs: "block", sm: "none" },
                    "& .MuiDrawer-paper": { width: drawerWidth }
                }}
            >
                {drawer}
            </Drawer>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    mt: 8, // space for AppBar
                    width: { sm: `calc(100% - ${drawerWidth}px)` }
                }}
            >
                {children}
            </Box>
        </Box>
    );
};