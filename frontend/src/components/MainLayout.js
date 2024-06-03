import React, { useState, useEffect } from 'react';
import { Box } from '@material-ui/core';
import Sidebar from './Sidebar';
import UserMenu from './UserMenu';
import Workflows from './Workflows';
import Models from './Models';
import ProjectOverview from './ProjectOverview';
import { useLocation, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const MainLayout = () => {
  const [view, setView] = useState('');
  const username = localStorage.getItem('username');
  const location = useLocation();
  const storedToken = localStorage.getItem('token');

  useEffect(() => {
    console.log(storedToken);
    if (storedToken) {
      const path = location.pathname;
      if (path === '/app') {
        setView('app');
      }
    }
  }, [location.pathname]);

  const handleProjectClick = () => {
    setView('projectoverview');
  }

  const handleWorkflowsClick = () => {
    setView('workflows');
  };

  const handleModelsClick = () => {
    setView('models');
  };

  if (!storedToken) {
    return <Navigate to="/app" />;
  }

  return (
    <Box display="flex" height="100vh" position="relative">
      <Sidebar onProjectClick={handleProjectClick} onWorkflowsClick={handleWorkflowsClick} onModelsClick={handleModelsClick} />
      <Box flexGrow={1} p={3} position="relative">
        <UserMenu />
        {view === 'workflows' && <Workflows />}
        {view === 'models' && <Models />}
        {view === 'projectoverview' && <ProjectOverview username={username} />}
      </Box>
    </Box>
  );
};

export default MainLayout;
