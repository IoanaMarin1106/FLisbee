import React from 'react';
import { Card, CardContent, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  logsContainer: {
    backgroundColor: theme.palette.grey[200],
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    whiteSpace: 'pre-line',
    fontFamily: 'monospace',
  },
  timestamp: {
    fontSize: '0.8rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
    fontFamily: 'monospace',
  },
}));

const LogsCard = ( { logs} ) => {
  const classes = useStyles();

  return (
    <Card elevation={5}>
      <CardContent className={classes.logsContainer}>
        <Typography variant="body1" style={{ fontFamily: 'monospace' }}>
          {logs}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default LogsCard;
