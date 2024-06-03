import React from 'react';
import { Typography, Card, CardContent } from '@mui/material';
import './ProjectOverview.css'; 

const ProjectOverviewPage = ({ username }) => {
  return (
    <div className="project-overview-container">
      <Typography variant="h4" gutterBottom>Welcome, {username}</Typography>
      <Typography variant="body1" gutterBottom>Join the revolution in federated learning with FLisbee - Empowering Minds, Transforming Futures!</Typography>
      <Typography variant="caption">Chart Your Course to Success with Flisbee - Master Map-Making Essentials and Navigate Your Way to Brilliance!</Typography>

      <Card className="project-card" elevation={6} style={{ backgroundColor: 'skyblue', padding: '20px', borderRadius: '15px' }}>
        <CardContent>
          <Typography variant="h5" align="center" style={{ color: 'white', marginBottom: '20px' }}>Revolutionize Your Machine Learning Workflow</Typography>
          <Typography variant="body1" align="center" style={{ color: 'white' }}>
            Explore the future of machine learning with FLisbee - the ultimate federated learning framework. 
            Automate the creation of federated model components, servers, orchestrators, and models with TensorFlow Lite. 
            Empower your team to collaborate seamlessly and unleash the power of distributed learning.
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectOverviewPage;
