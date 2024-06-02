import { Card, CardContent, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  logsContainer: {
    backgroundColor: theme.palette.grey[200], // Set background color
    padding: theme.spacing(2), // Add some padding
    borderRadius: theme.shape.borderRadius, // Add border radius
    whiteSpace: 'pre-line', // Preserve line breaks
    fontFamily: 'monospace', // Use a monospace font for logs
  },
}));

const LogsCard = () => {
  const classes = useStyles();

  return (
    <Card elevation={5}>
      <CardContent className={classes.logsContainer}>
        <Typography variant="body1">Started FedAvg</Typography>
        <Typography variant="body1">Completed Epoch 1</Typography>
        <Typography variant="body1">Updated model weights</Typography>
        <Typography variant="body1">Loss: 0.12</Typography>
      </CardContent>
    </Card>
  );
};

export default LogsCard;
