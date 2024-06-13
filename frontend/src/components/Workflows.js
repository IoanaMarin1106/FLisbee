import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getWorkflowsCount,
  createWorkflow,
  fetchAllWorkflows,
  deleteWorkflow, registerWorkflow, registerWorkflowRun, registerWorkflowCancel,
} from '../features/workflows/workflowsSlice';
import {
  getUserModels,
} from "../features/models/modelsSlice";
import {
  Typography,
  Button,
  Grid,
  IconButton,
  AppBar,
  Toolbar,
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputLabel,
  MenuItem,
  Select,
  FormControl,
  InputAdornment,
  Snackbar, 
  ThemeProvider
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import CancelIcon from '@material-ui/icons/Stop';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import DeleteIcon from '@material-ui/icons/Delete';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import LogsCard from './LogsCard';
import { makeStyles } from '@material-ui/core/styles';
import { getWorkflowStatus, cancelWorkflow, runWorkflow } from '../features/workflows/workflowsSlice';
import {Add, ErrorOutline, Refresh, Remove} from "@material-ui/icons";
import CustomButton from './CustomButton';
import WorkflowDetails from './WorkflowDetails';
import {Grow} from "@mui/material";
import { Cancel, CheckCircle } from '@material-ui/icons';
import { createMuiTheme } from '@material-ui/core/styles';
import HourglassFullIcon from '@mui/icons-material/HourglassFull';

const useStyles = makeStyles((theme) => ({
  workflowDetails: {
    display: 'flex',
    alignItems: 'center',
  },
  label: {
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
  },
  spacer: {
    borderLeft: `1px solid ${theme.palette.text.secondary}`,
    marginLeft: "15px",
    height: '1.5em',
    marginRight: theme.spacing(2),
  },
  spin: {
    animation: '$spin 1s linear infinite',
    padding: "5px"
  },
  rotate: {
    animation: '$rotate 2s linear infinite',
    padding: "5px"
  },
  '@keyframes spin': {
    from: {
      transform: 'rotate(0deg)',
    },
    to: {
      transform: 'rotate(360deg)',
    },
  },
  '@keyframes rotate': {
    from : {
      transform: 'rotate(0deg)',
    },
    to: {
      transform: 'rotate(360deg)',
    }
  },
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
    backgroundColor: "cornflowerblue",
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

const getStatusColor = (status) => {
  switch (status) {
    case 'Canceled':
      return 'gray'; 
    case 'Failed':
      return 'red';
    case 'Created':
    case 'Running':
      return 'green';
    case 'Pending':
    case 'Provisioning':
      return 'orange';
    default:
      return 'gray';
  }
};

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#ff0000', // Change this to your desired color
    },
  },
});

const Workflows = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const workflowsCount = useSelector((state) => state.workflows.count);
  const allWorkflows = useSelector((state) => state.workflows.items) || [];
  const userModels = useSelector((state) => state.models.userModels);

  const [showAddWorkflowDialog, setShowAddWorkflowDialog] = useState(false);
  const [workflowNameInput, setWorkflowNameInput] = useState('');
  const [trainingFrequency, setTrainingFrequency] = useState(1);
  const [selectedModel, setSelectedModel] = useState(userModels[0] ? userModels[0].filename.split('.')[0] : null);

  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showOverview, setShowOverview] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const [showMissingModelsAlert, setShowMissingModelsAlert] = useState(false)

  const username = localStorage.getItem('username');

  useEffect(() => {
    dispatch(getUserModels(username));
    dispatch(getWorkflowsCount());
    dispatch(fetchAllWorkflows());
  }, [dispatch]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      allWorkflows.forEach((workflow) => {
        dispatch(getWorkflowStatus(workflow.id))
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [dispatch, allWorkflows]);

  const handleAddWorkflow = () => {
    if (userModels.length === 0) {
      setShowMissingModelsAlert(true);
    } else {
      setShowAddWorkflowDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setShowAddWorkflowDialog(false);
    setWorkflowNameInput('');
  };

  const handleAddWorkflowSubmit = () => {
    dispatch(
      registerWorkflow(
        {
          name: workflowNameInput,
          ml_model: selectedModel,
          training_frequency: trainingFrequency,
          user_email: username,
        }
      )
    ).then((result) => {
      const workflow_id = result.payload.workflow_id;
      console.log('Registered Workflow:', workflow_id);

      dispatch(getWorkflowsCount());
      dispatch(fetchAllWorkflows());
      dispatch(
        createWorkflow(
          {
            name: workflowNameInput,
            workflow_id: workflow_id,
            ml_model: selectedModel,
            training_frequency: trainingFrequency,
            user_email: username,
          }
        )
      );
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
    dispatch(registerWorkflowCancel(id)).then(() => {
      dispatch(cancelWorkflow(id))
    });
  };
  
  const handleRunWorkflow = async (id, e) => {
    e.stopPropagation(); // Prevents the click event from bubbling up to the card
    dispatch(registerWorkflowRun(id)).then(() => {
      dispatch(runWorkflow(id))
    });
  };

  const handleIncrementFrequency = () => {
    setTrainingFrequency(Math.min(trainingFrequency + 1, 24));
  };

  const handleDecrementFrequency = () => {
    setTrainingFrequency(Math.max(trainingFrequency - 1, 1));
  };

  return (
    <Grid container justifyContent="center" style={{ marginTop: "30px"}}alignItems="center" className={classes.container}>
      <AppBar position="static" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            {selectedWorkflow ? 'Workflow Details' : 'Workflows'}
          </Typography>
          {!selectedWorkflow && (
            <CustomButton
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={handleAddWorkflow}
              className={classes.button}
              style={{ backgroundColor: 'white', color: 'cornflowerblue' }}
            >
              Add New Workflow
            </CustomButton>
          )}
          <Snackbar
            anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
            open={showMissingModelsAlert}
            TransitionComponent={Grow}
            autoHideDuration={5000}
            onClose={() => setShowMissingModelsAlert(false)}
            message={
            <Box style={{ display: "flex", justifyContent: "space-between"}}>
              <ErrorOutline style={{ paddingRight: 5 }}/>
              <Typography>No ML model found. You need to add a model before creating a workflow.</Typography>
            </Box>
            }
          />
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
          <TextField
              id="training-frequency"
              label="Training Frequency (hours)"
              type="number"
              fullWidth
              value={trainingFrequency}
              onChange={(e) => {
                let value = parseInt(e.target.value);
                if (value < 1) {
                  value = 1;
                } else if (value > 24) {
                  value = 24;
                }
                setTrainingFrequency(value);
              }}
              InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleIncrementFrequency}>
                        <Add />
                      </IconButton>
                      <IconButton onClick={handleDecrementFrequency}>
                        <Remove />
                      </IconButton>
                    </InputAdornment>
                ),
                inputProps: {
                  min: 1,
                  max: 24,
                },
              }}
          />
          <FormControl fullWidth>
            <InputLabel id="model-select-label">Select Model</InputLabel>
            <Select
                labelId="model-select-label"
                id="model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
            >
              {
                userModels.map((model) => (
                  <MenuItem key={model.filename.split('.')[0]} value={model.filename.split('.')[0]}>{model.name}</MenuItem>
                ))
              }
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <CustomButton onClick={handleAddWorkflowSubmit} color="primary">
            Submit
          </CustomButton>
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
                <div className={classes.workflowDetails}>
                  <Typography variant="body1" className={classes.label}>ID:</Typography>
                  <Typography variant="body1">{selectedWorkflow.id}</Typography>
                  <div className={classes.spacer} />
                  <Typography variant="body1" className={classes.label}>Name:</Typography>
                  <Typography variant="body1">{selectedWorkflow.name}</Typography>
                  <div className={classes.spacer} />
                  <Typography variant="body1" className={classes.label}>Status:</Typography>
                  <Chip
                    label={<Typography>{selectedWorkflow.status}</Typography>}
                    style={{ backgroundColor: getStatusColor(selectedWorkflow.status), color: '#fff' }}
                    avatar={
                      <>
                        {selectedWorkflow.status === 'Running' && <Refresh className={classes.spin} />}
                        {selectedWorkflow.status === 'Failed' && <ErrorOutline style={{ padding: "5px" }} />}
                        {selectedWorkflow.status === 'Canceled' && <Cancel style={{ padding: "5px" }} />}
                        {(selectedWorkflow.status === 'Pending' || selectedWorkflow.status === 'Provisioning') && <HourglassFullIcon className={classes.rotate} />}
                        {selectedWorkflow.status === 'Created' && <CheckCircle style={{ padding: "5px" }} />}
                      </>
                    }
                  />
                </div>
                  <div className={classes.buttonsContainer}>
                    {(selectedWorkflow.status === 'Running' || selectedWorkflow.status === 'Provisioning' || selectedWorkflow.status === 'Pending') && (
                      <Button startIcon={<CancelIcon />} onClick={() => handleCancelWorkflow(selectedWorkflow.id)} color="secondary">
                        Cancel
                      </Button>
                    )}
                    {(selectedWorkflow.status === 'Created' || selectedWorkflow.status === 'Canceled' || selectedWorkflow.status === 'Failed') && (
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
                  <WorkflowDetails selectedWorkflow={selectedWorkflow} />
                )}
                {showLogs && (
                  <div>
                    <LogsCard workflow_id={selectedWorkflow.id}/>
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
                <Card key={workflow.id} className={classes.workflowItem} onClick={() => handleWorkflowClick(workflow)} elevation={5}>
                  <CardContent className={classes.card}>
                    <div className={classes.workflowInfo}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Typography style={{ padding: "20px"}} variant="body1">{workflow.id}</Typography>
                        <div style={{ borderLeft: '1px solid #ccc', height: '50px', margin: '0px 10px' }}></div> {/* Vertical Separator */}
                        <Typography style={{ padding: "20px"}} variant="body1">{workflow.created_at}</Typography>
                        <div style={{ borderLeft: '1px solid #ccc', height: '50px', margin: '0 10px' }}></div> {/* Vertical Separator */}
                        <Typography style={{ padding: "20px"}} variant="body1">{workflow.name}</Typography>
                        <div style={{ margin: '0 20px' }}></div> {/* Add more space */}
                      </div>
                    </div>
                    <CardActions className={classes.workflowActions}>
                      <ThemeProvider theme={theme}>
                        <Chip
                          label={<Typography>{workflow.status}</Typography>}
                          style={{ backgroundColor: getStatusColor(workflow.status), color: '#fff' }}
                          avatar={
                            <>
                              {workflow.status === 'Running' && <Refresh className={classes.spin} />}
                              {workflow.status === 'Failed' &&  <ErrorOutline style={{ padding: "5px" }}/> }
                              {workflow.status === 'Canceled' && <Cancel style={{padding: "5px"}}/>}
                              {(workflow.status === 'Pending' || workflow.status === 'Provisioning') && <HourglassFullIcon className={classes.rotate}/>}
                              {workflow.status === 'Created' && <CheckCircle style={{ padding: "5px"}}/>}
                            </>
                          }
                        />
                      </ThemeProvider>
                      {(workflow.status === 'Running' || workflow.status === 'Provisioning' || workflow.status === 'Pending') && (
                        <IconButton color="primary" onClick={(e) => handleCancelWorkflow(workflow.id, e)}>
                          <CancelIcon />
                        </IconButton>
                      )}
                      {(workflow.status === 'Created' || workflow.status === 'Canceled' || workflow.status === 'Failed') && (
                        <IconButton color="primary" onClick={(e) => handleRunWorkflow(workflow.id, e)}>
                          <PlayArrowIcon />
                        </IconButton>
                      )}
                      <IconButton onClick={(e) => handleDeleteWorkflow(workflow.id, e)}>
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

                 
