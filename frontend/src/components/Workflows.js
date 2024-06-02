import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWorkflowsCount, registerWorkflow, fetchAllWorkflows, deleteWorkflow } from '../features/workflows/workflowsSlice';
import { Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, IconButton, Paper, AppBar, Toolbar, Box, Card, CardContent, CardActions } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import DeleteIcon from '@material-ui/icons/Delete';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    minHeight: '40vh',
    paddingTop: theme.spacing(8), // Adjusted to match AppBar double height
  },
  appBar: {
    position: 'relative',
    backgroundColor: theme.palette.primary.main,
    height: theme.spacing(16), // Double height
    display: 'flex',
    justifyContent: 'center',
  },
  title: {
    flexGrow: 1,
    fontSize: '1.5rem',
  },
  button: {
    marginRight: theme.spacing(2),
    backgroundColor: theme.palette.info.light,
    '&:hover': {
      backgroundColor: theme.palette.info.main,
    },
  },
  workflowItem: {
    marginBottom: theme.spacing(2),
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  workflowInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  workflowActions: {
    display: 'flex',
    alignItems: 'center',
  },
}));

const Workflows = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const workflowsCount = useSelector((state) => state.workflows.count);
  const allWorkflows = useSelector((state) => state.workflows.items) || [];

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

  const handleDeleteWorkflow = (id) => {
    console.log(id)
    dispatch(deleteWorkflow(id)).then(() => {
      dispatch(getWorkflowsCount());
      dispatch(fetchAllWorkflows());
    });
  };

  return (
    <Grid container justifyContent="center" alignItems="center" className={classes.container}>
      <AppBar position="static" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            {workflowsCount === 0 ? "No workflows" : "Workflows"}
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={handleAddWorkflow}
            className={classes.button}
          >
            Add New Workflow
          </Button>
        </Toolbar>
      </AppBar>
      <Grid item xs={12} style={{ width: '100%' }}>
        <Box mt={2}>
          {allWorkflows.map((workflow) => (
            <Card key={workflow.id} className={classes.workflowItem} elevation={3}>
              <CardContent className={classes.card}>
                <div className={classes.workflowInfo}>
                  <Typography variant="body2">ID: {workflow.id}</Typography>
                  <Typography variant="h6">{workflow.name}</Typography>
                </div>
                <CardActions className={classes.workflowActions}>
                  <IconButton color="primary">
                    <PlayArrowIcon />
                  </IconButton>
                  <IconButton color="secondary" onClick={() => handleDeleteWorkflow(workflow.id)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </CardContent>
            </Card>
          ))}
        </Box>
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
