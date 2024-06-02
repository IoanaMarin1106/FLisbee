import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWorkflowsCount, registerWorkflow, fetchAllWorkflows, deleteWorkflow } from '../features/workflows/workflowsSlice';
import { Typography, Button, Grid, IconButton, Paper, AppBar, Toolbar, Box, Card, CardContent, CardActions } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import DeleteIcon from '@material-ui/icons/Delete';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    minHeight: '10vh',
    paddingTop: theme.spacing(4), // Adjusted to match AppBar double height
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
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
}));

const Workflows = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const workflowsCount = useSelector((state) => state.workflows.count);
  const allWorkflows = useSelector((state) => state.workflows.items) || [];

  const [showAddWorkflowDialog, setShowAddWorkflowDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  useEffect(() => {
    dispatch(getWorkflowsCount());
    dispatch(fetchAllWorkflows());
  }, [dispatch]);

  const handleAddWorkflow = () => {
    setWorkflowName(''); // Reset the TextField value
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
    dispatch(deleteWorkflow(id)).then(() => {
      dispatch(getWorkflowsCount());
      dispatch(fetchAllWorkflows());
    });
  };

  const handleWorkflowClick = (workflow) => {
    setSelectedWorkflow(workflow);
  };

  const handleBreadcrumbClick = () => {
    setSelectedWorkflow(null);
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
      <Grid item xs={12} style={{ width: '100%' }}>
        <Box mt={2}>
          {selectedWorkflow ? (
            <Box className={classes.breadcrumb}>
              <IconButton onClick={handleBreadcrumbClick} color="primary">
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="body1" className={classes.breadcrumbText}>Workflows > {selectedWorkflow.id}</Typography>
            </Box>
          ) : null}
          {selectedWorkflow ? (
            <Card className={classes.detailsCard}>
              <CardContent>
                <Typography variant="body1">{`ID: ${selectedWorkflow.id}`}</Typography>
                <Typography variant="body1">{`Name: ${selectedWorkflow.name}`}</Typography>
              </CardContent>
              <CardActions>
                <Button onClick={() => setSelectedWorkflow(null)} color="primary">
                  Cancel
                </Button>
                <Button onClick={() => {}} color="primary">
                  Edit
                </Button>
              </CardActions>
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
                      <IconButton color="primary">
                        <PlayArrowIcon />
                      </IconButton>
                      <IconButton color="secondary" onClick={() => handleDeleteWorkflow(workflow.id)}>
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

