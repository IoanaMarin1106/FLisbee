import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, Avatar } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';

const UserMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const username = localStorage.getItem('username');
  const dispatch = useDispatch();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div style={{ position: 'absolute', top: 0, right: 0 }}>
      <IconButton onClick={handleMenuOpen}>
        <Avatar alt={username} src="/static/images/avatar/1.jpg" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>My Profile</MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </div>
  );
};

export default UserMenu;
