import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { registerUser } from '../features/auth/authSlice';
import { Navigate } from 'react-router-dom';
import { TextField, Button, Typography, Container, Link, Box } from '@material-ui/core';

const Register = () => {
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
    return <Navigate to="/login" />;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box mt={8} display="flex" flexDirection="column" alignItems="center">
        <Typography component="h1" variant="h5">
          Register
        </Typography>
        <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: '1em' }}>
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
            style={{ marginTop: '1em' }}
          >
            Create new user
          </Button>
          <Box mt={2}>
            <Link href="/login" variant="body2">
              {"Already have an account? Login"}
            </Link>
          </Box>
        </form>
      </Box>
    </Container>
  );
};

export default Register;
