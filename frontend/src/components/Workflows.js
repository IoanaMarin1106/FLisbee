import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWorkflowsCount, registerWorkflow, fetchAllWorkflows } from '../features/workflows/workflowsSlice';
import { Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, IconButton, Paper } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    minHeight: '100vh',
  },
  paper: {
    padding: theme.spacing(1),
    margin: theme.spacing(1),
  },
  button: {
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2),
  },
  workflowItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
  },
  workflowName: {
    flexGrow: 1,
  },
}));

const Workflows = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const workflowsCount = useSelector((state) => state.workflows.count);
  const allWorkflows = useSelector((state) => state.workflows.items) || []; // Initialize as empty array if undefined

  const [showAddWorkflowDialog, setShowAddWorkflowDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState('');

  useEffect(() => {
    dispatch(getWorkflowsCount());
    dispatch(fetchAllWorkflows());
  }, [dispatch]);

  const handleAddWorkflow = () => {
    setShowAddWorkflowDialog(true);
  };

  const handleWorkflowNameChange = (e) => {
    setWorkflowName(e.target.value);
  };

  const handleCloseDialog = () => {
    setShowAddWorkflowDialog(false);
  };

  const handleAddWorkflowSubmit = () => {
    dispatch(registerWorkflow({ name: workflowName })).then(() => {
      dispatch(getWorkflowsCount());
      dispatch(fetchAllWorkflows());
    });
    setShowAddWorkflowDialog(false);
  };

  return (
    <Grid container justifyContent="center" alignItems="center" className={classes.container} style={{ position: 'relative' }}>
      <Grid item xs={12} textAlign="center">
        {workflowsCount === 0 ? (
          <Typography variant="h5">No workflows</Typography>
        ) : (
          <Typography variant="h5">List of Workflows</Typography>
        )}
      </Grid>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={handleAddWorkflow}
        className={classes.button}
      >
        Add Workflow
      </Button>
      <Grid item xs={12}>
        {allWorkflows.map((workflow) => (
          <Paper key={workflow.id} className={classes.workflowItem}>
            <Typography variant="body1" className={classes.workflowName}>{workflow.name}</Typography>
            <IconButton color="primary">
              <PlayArrowIcon />
            </IconButton>
          </Paper>
        ))}
      </Grid>
      <Dialog open={showAddWorkflowDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add New Workflow</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Workflow Name"
            fullWidth
            value={workflowName}
            onChange={handleWorkflowNameChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddWorkflowSubmit} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default Workflows;
