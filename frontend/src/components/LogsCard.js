import React, {useEffect, useRef} from 'react';
import { Card, CardContent, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {useDispatch, useSelector} from "react-redux";
import {getWorkflowLogs} from "../features/workflows/workflowsSlice";

const useStyles = makeStyles((theme) => ({
  logsContainer: {
    backgroundColor: theme.palette.grey[200],
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    whiteSpace: 'pre-line',
    fontFamily: 'monospace',
    height: '300px',  // Set a fixed height
    overflowY: 'auto',  // Enable vertical scrolling
    overflowX: 'hidden',  // Hide horizontal overflow
  },
  timestamp: {
    fontSize: '0.8rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
    fontFamily: 'monospace',
  },
}));

const LogsCard = ( { workflow_id } ) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const logs = useSelector((state) => state.workflows.logs);

  const logsContainerRef = useRef(null);

  useEffect(() => {
    dispatch(getWorkflowLogs(workflow_id));
  }, [dispatch, workflow_id]);

  useEffect(() => {
    const logsContainer = logsContainerRef.current;
    if (logsContainer) {
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  }, [logs]);

  return (
    <Card elevation={5}>
      {
       logs && logs.length > 0 ? (
          <CardContent ref={logsContainerRef} className={classes.logsContainer}>
            {logs.map((log, index) => (
              <Typography key={index} variant="body2" style={{ fontFamily: 'monospace' }}>
                {log}
              </Typography>
            ))}
          </CardContent>
        ) : (
          <CardContent className={classes.logsContainer}>
            <Typography variant="body2" style={{ fontFamily: 'monospace' }}>
              No logs available...
            </Typography>
          </CardContent>
        )
      }

    </Card>
  );
};

export default LogsCard;
