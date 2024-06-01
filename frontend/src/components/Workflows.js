import React from 'react';
import { Typography, MenuItem, Select } from '@material-ui/core';

const Workflows = () => {
  const [workflow, setWorkflow] = React.useState('');

  const handleChange = (event) => {
    setWorkflow(event.target.value);
  };

  return (
    <div>
      <Typography variant="h4">Workflows</Typography>
      <Select value={workflow} onChange={handleChange}>
        <MenuItem value=""><em>None</em></MenuItem>
        <MenuItem value={10}>Workflow 1</MenuItem>
        <MenuItem value={20}>Workflow 2</MenuItem>
        <MenuItem value={30}>Workflow 3</MenuItem>
      </Select>
    </div>
  );
};

export default Workflows;
