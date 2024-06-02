import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWorkflowsCount, registerWorkflow, fetchAllWorkflows, deleteWorkflow } from '../features/workflows/workflowsSlice';
import {
  Typography, Button, Grid, IconButton, AppBar, Toolbar, Box, Card, CardContent, CardActions,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import CancelIcon from '@material-ui/icons/Stop';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import DeleteIcon from '@material-ui/icons/Delete';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import LogsCard from './LogsCard';
import { makeStyles } from '@material-ui/core/styles';
import { getWorkflowState, cancelWorkflow, runWorkflow } from '../features/workflows/workflowsSlice';

const useStyles = makeStyles((theme) => ({
  container: {
    minHeight: '10vh',
    paddingTop: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBar: {
    position: 'relative',
    backgroundColor: theme.palette.primary.main,
    height: theme.spacing(16),
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
  noWorkflowsContainer: {
    minHeight: 'calc(100vh - 128px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noWorkflowsImage: {
    width: '300px',
    height: '300px',
    fill: theme.palette.info.light,
  },
  noWorkflowsText: {
    marginTop: theme.spacing(2),
    fontSize: '1.2rem',
    color: theme.palette.text.secondary,
  },
  detailsCard: {
    marginTop: theme.spacing(2),
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  breadcrumbText: {
    marginRight: theme.spacing(1),
  },
  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonsContainer: {
    display: 'flex',
    gap: theme.spacing(1),
  },
}));

const Workflows = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const workflowsCount = useSelector((state) => state.workflows.count);
  const allWorkflows = useSelector((state) => state.workflows.items) || [];

  const [showAddWorkflowDialog, setShowAddWorkflowDialog] = useState(false);
  const [workflowNameInput, setWorkflowNameInput] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showOverview, setShowOverview] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [workflowState, setWorkflowState] = useState(null);

  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (selectedWorkflow) {
      dispatch(getWorkflowState(selectedWorkflow.id)).then((response) => {
        setWorkflowState(response.payload);
      });
    }
  }, [selectedWorkflow, dispatch]);

  useEffect(() => {
    dispatch(getWorkflowsCount());
    dispatch(fetchAllWorkflows());
  }, [dispatch]);

  const handleAddWorkflow = () => {
    setShowAddWorkflowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddWorkflowDialog(false);
    setWorkflowNameInput('');
  };

  const handleAddWorkflowSubmit = () => {
    dispatch(registerWorkflow({ name: workflowNameInput })).then(() => {
      dispatch(getWorkflowsCount());
      dispatch(fetchAllWorkflows());
    });
    setShowAddWorkflowDialog(false);
    setWorkflowNameInput('');
  };

  const handleDeleteWorkflow = (id, e) => {
    e.stopPropagation(); // Prevents the click event from bubbling up to the card
    dispatch(deleteWorkflow(id)).then(() => {
      dispatch(getWorkflowsCount());
      dispatch(fetchAllWorkflows());
    });
  };

  const handleWorkflowClick = (workflow) => {
    setSelectedWorkflow(workflow);
    setShowOverview(true);
    setShowLogs(false);
  };

  const handleBreadcrumbClick = () => {
    setSelectedWorkflow(null);
  };

  const handleOverviewClick = () => {
    setShowOverview(!showOverview);
    setShowLogs(false);
  };

  const handleLogsClick = () => {
    setShowOverview(false);
    setShowLogs(!showLogs);
  };

  const handleCancelWorkflow = async (id) => {
    await dispatch(cancelWorkflow(id));
      console.log("cancel workflow");
  };
  
  const handleRunWorkflow = async (id, e) => {
    e.stopPropagation(); // Prevents the click event from bubbling up to the card
    await dispatch(runWorkflow(id));
      console.log("run workflow");
  };

  return (
    <Grid container justifyContent="center" alignItems="center" className={classes.container}>
      <AppBar position="static" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            {selectedWorkflow ? 'Workflow Details' : 'Workflows'}
          </Typography>
          {!selectedWorkflow && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={handleAddWorkflow}
              className={classes.button}
            >
              Add New Workflow
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Dialog open={showAddWorkflowDialog} onClose={handleCloseDialog} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Add New Workflow</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Workflow Name"
            type="text"
            fullWidth
            value={workflowNameInput}
            onChange={(e) => setWorkflowNameInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddWorkflowSubmit} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      <Grid item xs={12} style={{ width: '100%' }}>
        <Box mt={2}>
          {selectedWorkflow ? (
            <Box className={classes.breadcrumb}>
              <Chip
                className={classes.chip}
                icon={<ArrowBackIcon />}
                label="Workflows"
                clickable
                onClick={handleBreadcrumbClick}
                color="primary"
              />
            </Box>
          ) : null}
          {selectedWorkflow ? (
            <Card className={classes.detailsCard} elevation={5}>
              <CardContent>
                <div className={classes.detailsHeader}>
                  <div>
                    <Typography variant="body1">{`ID: ${selectedWorkflow.id}`}</Typography>
                    <Typography variant="body1">{`Name: ${selectedWorkflow.name}`}</Typography>
                    <Typography variant="body1">{`Status: ${workflowState}`}</Typography>
                  </div>
                  <div className={classes.buttonsContainer}>
                    <Button startIcon={<EditIcon />} color="primary" onClick={() => {}}>
                      Edit
                    </Button>
                    {(workflowState === 'running' || workflowState === 'pending') && (
                      <Button startIcon={<CancelIcon />} onClick={() => handleCancelWorkflow(selectedWorkflow.id)} color="secondary">
                        Cancel
                      </Button>
                    )}
                    {workflowState === 'created' && (
                      <Button startIcon={<PlayArrowIcon />} onClick={() => handleRunWorkflow(selectedWorkflow.id)} color="secondary">
                        Run
                      </Button>
                    )}
                  </div>
                </div>
                <Chip
                  label="Overview"
                  onClick={handleOverviewClick}
                  style={{ margin: '20px 20px 20px 0px', width: '90px', height: '50px' }}
                  color={showOverview ? "primary" : "default"}
                />
                <Chip
                  label="Logs"
                  style={{ margin: '20px 20px 20px 0px', width: '90px', height: '50px' }}
                  onClick={handleLogsClick}
                  color={showLogs ? "primary" : "default"}
                />
                {showOverview && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Card elevation={5}>
                        <CardContent>
                          <Typography variant="body1">Name: {selectedWorkflow.name}</Typography>
                          <Typography variant="body1">ID: {selectedWorkflow.id}</Typography>
                          <Typography variant="body1">Hostname: Example</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card elevation={5}>
                        <CardContent>
                          <Typography variant="body1">Model: Example Model</Typography>
                          <Typography variant="body1">Avg method: Method</Typography>
                          <Typography variant="body1">Training frequency: Once a week</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}
                {showLogs && (
                  <div>
                                        <LogsCard logs="HERE WILL BE LOGS" />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            workflowsCount === 0 ? (
              <div className={classes.noWorkflowsContainer}>
                <img src={'/7466140.svg'} alt="No workflows found" className={classes.noWorkflowsImage} />
                <Typography className={classes.noWorkflowsText}>No workflows found</Typography>
              </div>
            ) : (
              allWorkflows.map((workflow) => (
                <Card key={workflow.id} className={classes.workflowItem} onClick={() => handleWorkflowClick(workflow)}>
                  <CardContent className={classes.card}>
                    <div className={classes.workflowInfo}>
                      <Typography variant="body1">{workflow.id}</Typography>
                      <Typography variant="body1">{workflow.name}</Typography>
                    </div>
                    <CardActions className={classes.workflowActions}>
                      <IconButton color="primary" onClick={(e) => handleRunWorkflow(workflow.id, e)}>
                        <PlayArrowIcon />
                      </IconButton>
                      <IconButton color="secondary" onClick={(e) => handleDeleteWorkflow(workflow.id, e)}>
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </CardContent>
                </Card>
              ))
            )
          )}
        </Box>
      </Grid>
    </Grid>
  );
};

export default Workflows;

                 
