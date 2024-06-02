import React from 'react';
import { Typography, Container, Button } from '@material-ui/core';
import { Link } from 'react-router-dom';

const EmailConfirmation = () => {
  return (
    <Container maxWidth="sm" style={{ textAlign: 'center', marginTop: '50px' }}>
      <Typography variant="h4" gutterBottom>
        Confirm Your Email
      </Typography>
      <Typography variant="body1" gutterBottom>
        Please check your email inbox and follow the instructions to confirm your email address.
      </Typography>
    </Container>
  );
};

export default EmailConfirmation;
