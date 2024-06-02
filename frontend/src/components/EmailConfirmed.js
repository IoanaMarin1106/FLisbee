import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Typography, Container, Button } from '@material-ui/core';
import axios from 'axios';
import './EmailConfirmed.css'; // Import CSS file for animations

const EmailConfirmed = () => {
  const { user_email, token } = useParams(); // Get the user_email and token from the URL params

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Make an API call to confirm the email using the user_email and token
        const response = await axios.get(`http://localhost:5000/confirm/${user_email}`);
        // Handle the response, e.g., display a success message
        console.log(response.data);
      } catch (error) {
        // Handle errors, e.g., display an error message
        console.error(error);
      }
    };

    confirmEmail();
  }, [user_email, token]);

  return (
    <Container style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', position: 'relative' }}>
      <Typography variant="h4" gutterBottom>
        You can login now.
      </Typography>
      <Button variant="contained" color="primary" component={Link} to="/login" style={{ marginBottom: '120px' }}>
        Click here and go to login.
      </Button>
      <div className="balloon-container">
        <div className="flying-freesby"></div>
      </div>
    </Container>
  );
};

export default EmailConfirmed;
