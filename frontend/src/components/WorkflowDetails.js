import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, Button } from '@material-ui/core';

const WorkflowDetails = () => {
  const { workflowId } = useParams();

  return (
    <div>
      <Card>
        <CardContent>ID: {workflowId}</CardContent>
      </Card>
      <Card>
        <CardContent>Name: Workflow Name</CardContent> {/* Replace with actual name */}
      </Card>
      <div>
        <Button variant="contained" color="primary">Edit</Button>
        <Button variant="contained" color="secondary">Cancel</Button>
      </div>
    </div>
  );
};

export default WorkflowDetails;
