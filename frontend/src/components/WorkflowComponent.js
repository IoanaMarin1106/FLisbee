import {makeStyles} from "@material-ui/core/styles";
import {Card, CardActions, CardContent, IconButton, Typography} from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import DeleteIcon from "@material-ui/icons/Delete";
import React from "react";

const useStyles = makeStyles((theme) => ({
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

const WorkflowComponent = ({ workflow }) => {
  const handleWorkflowClick = (workflow) => {
    setSelectedWorkflow(workflow);
    setShowOverview(true);
    setShowLogs(false);
  };



  return (
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
  );
}

export default WorkflowComponent;