import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, Avatar } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const CustomIconButton = styled(IconButton)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: 'lightblue',
  '&:hover': {
    backgroundColor: 'deepskyblue',
  },
  '& .MuiAvatar-root': {
    width: theme.spacing(5),
    height: theme.spacing(5),
  },
}));

const CustomAvatar = styled(Avatar)(({ theme }) => ({
  border: `2px solid ${theme.palette.primary.main}`,
}));

const UserMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const firstName = localStorage.getItem('first_name');
  const dispatch = useDispatch();
  const navigate = useNavigate()

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div style={{ position: 'absolute', top: 0, right: 0 }}>
      <CustomIconButton onClick={handleMenuOpen}>
        <CustomAvatar alt={firstName} src="/static/images/avatar/1.jpg" />
      </CustomIconButton>
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
