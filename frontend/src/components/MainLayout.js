import React, { useState } from 'react';
import { Box } from '@material-ui/core';
import Sidebar from './Sidebar';
import UserMenu from './UserMenu';
import Workflows from './Workflows';
import Models from './Models';
import ProjectOverview from './ProjectOverview';

const MainLayout = () => {
  const [view, setView] = useState('projectoverview');
  const username = localStorage.getItem('username');

  const handleProjectClick = () => {
    setView('projectoverview');
  }

  const handleWorkflowsClick = () => {
    setView('workflows');
  };

  const handleModelsClick = () => {
    setView('models');
  };

  return (
    <Box display="flex" height="100vh">
      <Sidebar onProjectClick={handleProjectClick} onWorkflowsClick={handleWorkflowsClick} onModelsClick={handleModelsClick} />
      <Box flexGrow={1} p={3}>
        <UserMenu />
        {view === 'workflows' && <Workflows />}
        {view === 'models' && <Models />}
        {view === 'projectoverview' && <ProjectOverview username={username} />}
      </Box>
    </Box>
  );
};

export default MainLayout;
