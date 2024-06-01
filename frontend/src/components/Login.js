import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../features/auth/authSlice';
import { Navigate } from 'react-router-dom';
import { TextField, Button, Typography, Container, Link, Box, IconButton, InputAdornment } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Visibility, VisibilityOff } from '@material-ui/icons'; // Import eye icons

const useStyles = makeStyles(theme => ({
  root: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundImage: 'url(/assets/background.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  paper: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: theme.spacing(3),
    borderRadius: theme.spacing(1),
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginTop: '1em',
  },
  submit: {
    marginTop: '1em',
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  link: {
    marginTop: theme.spacing(2),
  },
}));

const Login = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const token = useSelector((state) => state.auth.token);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  if (token) {
    return <Navigate to="/app" />;
  }

  return (
    <div className={classes.root}>
      <Container component="main" maxWidth="xs">
        <Box className={classes.paper}>
          <Typography component="h1" variant="h5">
            Login
          </Typography>
          <form onSubmit={handleSubmit} className={classes.form}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              label="Email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'} // Toggle between 'text' and 'password'
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePasswordVisibility}>
                      {showPassword ? <Visibility /> : <VisibilityOff />} {/* Show/hide eye icon */}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
            >
              Login
            </Button>
            <Box className={classes.link}>
              <Link href="/register" variant="body2">
                {"No account yet? Get started and join us now!"}
              </Link>
            </Box>
          </form>
        </Box>
      </Container>
    </div>
  );
};

export default Login;
