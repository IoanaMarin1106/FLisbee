import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Typography, Grid } from '@mui/material';
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
  flisbeeText: {
    marginBottom: theme.spacing(1),
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
      <div className={classes.toolbar} />
      <List>
        <Grid container alignItems="center" justifyContent="center" className={classes.flisbeeText}>
          <Grid item>
            <Typography variant="h6">FLisbee</Typography>
          </Grid>
        </Grid>
        <Divider />
        <ListItem button onClick={onProjectClick}>
          <ListItemIcon><HomeIcon /></ListItemIcon>
          <ListItemText primary="Project Overview" />
        </ListItem>
        <Divider />
        <ListItem button onClick={onWorkflowsClick}>
          <ListItemIcon><WorkIcon /></ListItemIcon>
          <ListItemText primary="Workflows" />
        </ListItem>
        <ListItem button onClick={onModelsClick}>
          <ListItemIcon><StorageIcon /></ListItemIcon>
          <ListItemText primary="ML Models" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
