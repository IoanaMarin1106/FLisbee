import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModels, addModel, deleteModel, getModelsCount } from '../features/models/modelsSlice';
import { Typography, AppBar, Toolbar, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Grid, Card, CardContent, IconButton } from '@material-ui/core';
import { Add as AddIcon, Delete as DeleteIcon } from '@material-ui/icons';
import { Navigate } from 'react-router-dom';

const Models = () => {
  const dispatch = useDispatch();
  const models = useSelector((state) => state.models.items);
  const status = useSelector((state) => state.models.status);

  const [open, setOpen] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchModels());
    }
  }, [status, dispatch]);

  const handleAddModel = () => {
    dispatch(addModel({ name: newModelName })).then(() => {
      dispatch(fetchModels());
      setOpen(false);
      setNewModelName('');
    });
  };

  const handleDeleteModel = (id, e) => {
    e.stopPropagation();
    dispatch(deleteModel(id)).then(() => {
      dispatch(getModelsCount());
      dispatch(fetchModels());
    });
  };

  const handleCardClick = (model) => {
    setSelectedModel(model);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedModel(null);
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <AppBar position="static" style={{ height: "100px", backgroundColor: 'steelblue', color: 'white' }}>
        <Toolbar style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <Typography variant="h6">
            ML Models
          </Typography>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            style={{ backgroundColor: 'silver', color: 'white' }}
          >
            Add new model
          </Button>
        </Toolbar>
      </AppBar>

      {models.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)' }}>
          <img src={'/no-models-found.png'} alt="No models found" style={{ width: '200px', marginBottom: '20px' }} />
          <Typography variant="h5">No models found</Typography>
        </div>
      ) : (
        <Grid container spacing={3} style={{ padding: 16 }}>
          {models.map(model => (
            <Grid item key={model.id} xs={12} sm={6} md={4} lg={3}>
              <Card style={{ position: 'relative', height: '150px' }}>
                <CardContent onClick={() => handleCardClick(model)}>
                  <Typography variant="h6">{model.name}</Typography>
                </CardContent>
                <IconButton 
                  style={{ position: 'absolute', top: 0, right: 0 }} 
                  onClick={(e) => handleDeleteModel(model.id, e)}>
                  <DeleteIcon />
                </IconButton>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>{selectedModel ? 'Model Details' : 'Add New Model'}</DialogTitle>
        <DialogContent>
          {selectedModel ? (
            <Typography variant="body1">{selectedModel.name}</Typography>
          ) : (
            <TextField
              autoFocus
              margin="dense"
              label="Model Name"
              type="text"
              fullWidth
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          {!selectedModel && (
            <Button onClick={handleAddModel} color="primary">
              Submit
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Models;
