import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { registerUser } from '../features/auth/authSlice';
import { TextField, Button, Typography, Container, Link, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import EmailConfirmation from './EmailConfirmation';

const useStyles = makeStyles((theme) => ({
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
    textAlign: 'center', // Center the content inside the paper
  },
  form: {
    width: '100%',
    marginTop: '1em',
  },
  submit: {
    marginTop: '1em',
  },
}));

const Register = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(registerUser({ email, password }));
    setIsRegistered(true);
  };

  if (isRegistered) {
    return <EmailConfirmation />;
  }

  return (
    <div className={classes.root}>
      <Container component="main" maxWidth="xs">
        <Box className={classes.paper}>
          <Typography component="h1" variant="h5">
            Register
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
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
            >
              Create new user
            </Button>
          </form>
        </Box>
      </Container>
    </div>
  );
};

export default Register;
