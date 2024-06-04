import React, { useState } from 'react';
import { Grid, Card, CardContent, Typography, Chip, IconButton, Snackbar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ContentCopy } from '@mui/icons-material';

const useStyles = makeStyles((theme) => ({
    gridContainer: {
      marginTop: theme.spacing(1),
    },
    card: {
      elevation: 3,
      height: "170px",
      backgroundColor: "#f5f5f5"
    },
    cardContent: {
      padding: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
    },
    chipContainer: {
      position: 'absolute',
      right: 0,
    },
    leftLabel: {
      marginRight: theme.spacing(2),
      minWidth: '80px', // Adjust as needed
    },
    rightLabel: {
      marginRight: theme.spacing(2),
      minWidth: '160px', // Adjust as needed
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
      position: 'relative',
      marginBottom: theme.spacing(1),
    },
    chipContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
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
            <div className={classes.hostnameContainer}>
              <Typography variant="body1" className={classes.leftLabel}>
                <strong>Name:</strong> 
              </Typography>
              <div className={classes.chipContainer}>
                <Chip label={<Typography>{selectedWorkflow.name}</Typography>} className={classes.chip} />
              </div>
            </div>
            <div className={classes.hostnameContainer}>
              <Typography variant="body1" className={classes.leftLabel}>
                <strong>ID:</strong> 
              </Typography>
              <div className={classes.chipContainer}>
                <Chip label={<Typography>{selectedWorkflow.id}</Typography>} className={classes.chip} />
              </div>
            </div>
            <div className={classes.hostnameContainer}>
              <Typography variant="body1" className={classes.leftLabel}>
                <strong>Hostname:</strong>
              </Typography>
              <div className={classes.chipContainer}>
                <Chip label={<Typography style={{ marginRight: '8px' }}>{selectedWorkflow.server_hostname}</Typography>} className={classes.chip} />
              </div>
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
            <div className={classes.hostnameContainer}>
              <Typography variant="body1" className={classes.rightLabel}>
                <strong>Model:</strong> 
              </Typography>
              <div className={classes.chipContainer}>
                <Chip label={<Typography>{selectedWorkflow.ml_model}</Typography>} className={classes.chip} />
              </div>
            </div>
            <div className={classes.hostnameContainer}>
              <Typography variant="body1" className={classes.rightLabel}>
                <strong>Avg Method:</strong> 
              </Typography>
              <Chip label={<Typography>FedAvg</Typography>} className={classes.chip} />
            </div>
            <div className={classes.hostnameContainer}>
              <Typography variant="body1" className={classes.rightLabel}>
                <strong>Training Frequency:</strong> 
              </Typography>
              <Chip label={<Typography>{selectedWorkflow.training_frequency} hour(s)</Typography>} className={classes.chip} />
            </div>
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
