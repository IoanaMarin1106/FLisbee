import React, { useState } from 'react';
import { Grid, Card, CardContent, Typography, Chip, IconButton, Snackbar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ContentCopy } from '@mui/icons-material';

const useStyles = makeStyles((theme) => ({
    gridContainer: {
      marginTop: theme.spacing(1),
    },
    card: {
      elevation: 5,
      height: "150px",
      backgroundColor: "#f5f5f5"
    },
    cardContent: {
      padding: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
    },
    chipContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
    },
    chip: {
      margin: theme.spacing(0.5),
    },
    copyIcon: {
      marginLeft: theme.spacing(1),
      cursor: 'pointer',
    },
    hostnameContainer: {
      display: 'flex',
      alignItems: 'center',
    },
  }));
  
  

const WorkflowDetails = ({ selectedWorkflow }) => {
  const classes = useStyles();
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setShowCopiedMessage(true);
  };

  const handleCloseMessage = () => {
    setShowCopiedMessage(false);
  };

  return (
    <Grid container spacing={2} className={classes.gridContainer}>
      <Grid item xs={6}>
        <Card className={classes.card}>
          <CardContent className={classes.cardContent}>
            <Typography variant="body1">
              <strong>Name:</strong> <Chip label={selectedWorkflow.name} className={classes.chip} />
            </Typography>
            <Typography variant="body1">
              <strong>ID:</strong> <Chip label={selectedWorkflow.id} className={classes.chip} />
            </Typography>
            <div className={classes.hostnameContainer}>
              <Typography variant="body1" style={{ marginRight: '8px' }}>
                <strong>Hostname:</strong>
              </Typography>
              <Typography variant="body1" style={{ marginRight: '8px' }}>
                <Chip label={selectedWorkflow.server_hostname} className={classes.chip} />
              </Typography>
              <IconButton
                className={classes.copyIcon}
                onClick={() => copyToClipboard(selectedWorkflow.server_hostname)}
              >
                <ContentCopy />
              </IconButton>
            </div>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6}>
        <Card className={classes.card}>
          <CardContent className={classes.cardContent}>
            <Typography variant="body1">
              <strong>Model:</strong> <Chip label={selectedWorkflow.ml_model} className={classes.chip} />
            </Typography>
            <Typography variant="body1">
              <strong>Avg Method:</strong> <Chip label="Fed Avg" className={classes.chip} />
            </Typography>
            <Typography variant="body1">
              <strong>Training Frequency:</strong> <Chip label={`${selectedWorkflow.training_frequency} hour(s)`} className={classes.chip} />
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Snackbar
        open={showCopiedMessage}
        autoHideDuration={3000}
        onClose={handleCloseMessage}
        message="Hostname copied"
      />
    </Grid>
  );
};

export default WorkflowDetails;
