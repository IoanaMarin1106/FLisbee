import React, { useState } from 'react';
import { Box } from '@material-ui/core';
import Sidebar from './Sidebar';
import UserMenu from './UserMenu';
import Workflows from './Workflows';
import Models from './Models';
import ProjectOverview from './ProjectOverview';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const MainLayout = () => {
  const [view, setView] = useState('projectoverview');
  const username = localStorage.getItem('username');
  const token = useSelector((state) => state.auth.token);

  const handleProjectClick = () => {
    setView('projectoverview');
  }

  const handleWorkflowsClick = () => {
    setView('workflows');
  };

  const handleModelsClick = () => {
    setView('models');
  };

  console.log("aici: " + token);
  if (token == null) {
    return <Navigate to="/login" />;
  }

  return (
    <Box display="flex" height="100vh" position="relative">
      <Sidebar onProjectClick={handleProjectClick} onWorkflowsClick={handleWorkflowsClick} onModelsClick={handleModelsClick} />
      <Box flexGrow={1} p={3} position="relative"> {/* Add position relative */}
        <UserMenu />
        {view === 'workflows' && <Workflows />}
        {view === 'models' && <Models />}
        {view === 'projectoverview' && <ProjectOverview username={username} />}
      </Box>
    </Box>
  );
};

export default MainLayout;
