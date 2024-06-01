import React from 'react';
import { Typography } from '@mui/material';

const ProjectOverviewPage = ({ username }) => {
  return (
    <div>
      <Typography variant="h4" gutterBottom>Welcome, {username}</Typography>
      <Typography variant="body1" gutterBottom>Join the revolution in federated learning with FLisbee - Empowering Minds, Transforming Futures!</Typography>
      <Typography variant="caption">Chart Your Course to Success with Flisbee - Master Map-Making Essentials and Navigate Your Way to Brilliance!</Typography>
    </div>
  );
};

export default ProjectOverviewPage;
