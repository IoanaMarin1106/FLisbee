import React from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Typography, Grid, Card, CardContent } from '@mui/material';
import { Home as HomeIcon, Work as WorkIcon, Storage as StorageIcon } from '@mui/icons-material';
import { makeStyles } from '@material-ui/core/styles';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
    background: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
  toolbar: theme.mixins.toolbar,
  card: {
    margin: theme.spacing(1),
    cursor: 'pointer',
  },
  flisbeeLogo: {
    width: '60px',
    marginRight: '10px',
  },
}));

const Sidebar = ({ onProjectClick, onWorkflowsClick, onModelsClick }) => {
  const classes = useStyles();

  return (
    <Drawer
      variant="permanent"
      className={classes.drawer}
      classes={{
        paper: classes.drawerPaper,
      }}
    >
      <List>
        <Card className={classes.card} onClick={onProjectClick} elevation={4}>
          <CardContent>
            <Grid container alignItems="center" justifyContent="center">
              <Grid item>
                <img src={"/frisbee_2826998.png"} alt="Flisbee Logo" className={classes.flisbeeLogo} />
              </Grid>
              <Grid item>
                <Typography variant="h4" align="center">FLisbee</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Divider />
        <Card className={classes.card} onClick={onProjectClick} elevation={4}>
          <CardContent>
            <ListItem button>
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Project Overview" />
            </ListItem>
          </CardContent>
        </Card>
        <Divider />
        <Card className={classes.card} onClick={onWorkflowsClick} elevation={4}>
          <CardContent>
            <ListItem button>
              <ListItemIcon><WorkIcon /></ListItemIcon>
              <ListItemText primary="Workflows" />
            </ListItem>
          </CardContent>
        </Card>
        <Card className={classes.card} onClick={onModelsClick} elevation={4}>
          <CardContent>
            <ListItem button>
              <ListItemIcon><StorageIcon /></ListItemIcon>
              <ListItemText primary="ML Models" />
            </ListItem>
          </CardContent>
        </Card>
      </List>
      <Box position="absolute" bottom={0} left={0} p={2} zIndex={1000}> {}
          <Typography variant="body2">
            FLisbee 2024.6.0
          </Typography>
        </Box>
    </Drawer>
    
  );
};

export default Sidebar;
