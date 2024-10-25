import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    InputBase,
    Badge,
    Menu,
    MenuItem,
    Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircle from '@mui/icons-material/AccountCircle';
import axios from 'axios'; // To fetch user details

const Navbar = () => {
    const [anchorEl, setAnchorEl] = useState(null); // For profile menu
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Track if user is logged in
    const [userDetails, setUserDetails] = useState({}); // To store user details

    // Fetch user details on component mount if token is present
    useEffect(() => {
        const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
        if (token) {
            axios.get('/user/details', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then(response => {
                setUserDetails(response.data); // Store user details
                setIsLoggedIn(true); // User is logged in
            })
            .catch(error => {
                console.error('Error fetching user details:', error);
                setIsLoggedIn(false);
            });
        }
    }, []);

    // Handle profile menu open/close
    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // Handle user logout
    const handleLogout = () => {
        localStorage.removeItem('token'); // Remove token from storage
        setIsLoggedIn(false); // Update login state
        setAnchorEl(null); // Close menu
    };

    return (
        <AppBar position="static">
            <Toolbar>
                {/* Logo */}
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>WildLens</Link>
                </Typography>

                {/* Search Bar */}
                <InputBase
                    placeholder="Search…"
                    startAdornment={<SearchIcon />}
                    sx={{
                        flex: 1,
                        backgroundColor: '#fff',
                        padding: '0 10px',
                        borderRadius: '4px',
                        maxWidth: '400px',
                    }}
                />

                {/* Cart Icon */}
                <IconButton color="inherit" component={Link} to="/cart">
                    <Badge badgeContent={4} color="error">
                        <ShoppingCartIcon />
                    </Badge>
                </IconButton>

                {/* Conditional rendering based on login status */}
                {isLoggedIn ? (
                    <>
                        {/* Profile Icon with Dropdown Menu */}
                        <IconButton
                            edge="end"
                            color="inherit"
                            onClick={handleMenuOpen}
                        >
                            <AccountCircle />
                        </IconButton>

                        {/* Dropdown menu for profile */}
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                        >
                            <MenuItem>
                                <Typography textAlign="center">Profile: {userDetails.username}</Typography>
                            </MenuItem>
                            <MenuItem>
                                <Typography textAlign="center">Email: {userDetails.email}</Typography>
                            </MenuItem>
                            <MenuItem onClick={handleLogout}>
                                Logout
                            </MenuItem>
                        </Menu>
                    </>
                ) : (
                    // Show Login/Register buttons if not logged in
                    <>
                        <Button color="inherit" component={Link} to="/login">Login</Button>
                        <Button color="inherit" component={Link} to="/register">Register</Button>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
