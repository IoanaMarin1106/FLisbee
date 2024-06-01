import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { setCredentials } from '../features/auth/authSlice';

const Protected = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      axios
        .get('http://localhost:5000/protected', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setMessage(response.data.logged_in_as);
        })
        .catch((error) => {
          setMessage('Failed to fetch protected data');
        });
    }
  }, [token, dispatch]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <h2>Protected Component</h2>
      <p>{message}</p>
    </div>
  );
};

export default Protected;
