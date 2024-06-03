import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModels, deleteModel, getModelsCount } from '../features/models/modelsSlice';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Grid,
  Card,
  CardContent,
  IconButton,
} from '@material-ui/core';
import { Add as AddIcon, Delete as DeleteIcon } from '@material-ui/icons';
import './CardFlip.css'; 
import CustomButton from './CustomButton';
import axios from 'axios';
import { addModel } from '../features/models/modelsSlice';

const Models = () => {
  const dispatch = useDispatch();
  const models = useSelector((state) => state.models.items);
  const status = useSelector((state) => state.models.status);

  const [open, setOpen] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [flipped, setFlipped] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchModels());
    }
  }, [status, dispatch]);

  const handleAddModel = async () => {
      dispatch(addModel({ name: newModelName, file: selectedFile })).then(() => {
        dispatch(getModelsCount());
        dispatch(fetchModels());
      });

      setOpen(false);
      setNewModelName('');
      setSelectedFile(null);
  };
  

  const handleDeleteModel = (id, e) => {
    e.stopPropagation();
    dispatch(deleteModel(id)).then(() => {
      dispatch(getModelsCount());
      dispatch(fetchModels());
    });
  };

  const handleCardClick = (model) => {
    setFlipped((prevFlipped) => ({
      ...prevFlipped,
      [model.id]: !prevFlipped[model.id],
    }));
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedModel(null);
  };

  const handleFileUpload = (file) => {
    setSelectedFile(file);
  };

  return (
    <div style={{ marginTop: '60px', padding: '20px' }}>
      <AppBar position="static" style={{ height: "100px", backgroundColor: 'steelblue', color: 'white' }}>
        <Toolbar style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <Typography variant="h6">
            ML Models
          </Typography>
          <CustomButton
            color="inherit"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            style={{ backgroundColor: 'white', color: 'steelblue' }}
          >
            Add new model
          </CustomButton>
        </Toolbar>
      </AppBar>

      {models.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)' }}>
          <img src={'/no-models-found.png'} alt="No models found" style={{ width: '200px', marginBottom: '20px' }} />
          <Typography variant="h5">No models found</Typography>
        </div>
      ) : (
        <Grid container spacing={2} style={{ padding: 16 }}>
          {models.map(model => (
            <Grid item key={model.id} xs={12} sm={6} md={4} lg={3}>
              <Card className={`card ${flipped[model.id] ? 'flip' : ''}`} style={{ height: '200px', width: '100%' }} elevation={5}>
                <div className="card-inner" onClick={() => handleCardClick(model)}>
                  <div className="card-front">
                    <CardContent style={{ textAlign: 'center', height: '100%' }}>
                      <Box
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                        height="100%"
                      >
                        <Typography variant="h5">{model.name}</Typography>
                        <img src="./ml-model.png" alt="ML Model" style={{ marginTop: '10px', width: '80px', height: '80px' }} />
                      </Box>
                    </CardContent>
                    <IconButton 
                      style={{ position: 'absolute', top: 0, right: 0 }} 
                      onClick={(e) => handleDeleteModel(model.id, e)}>
                        <DeleteIcon />
                    </IconButton>
                  </div>
                  <div className="card-back" style={{ backgroundColor: 'lightblue', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
                    <Typography variant="h6">Model name: {model.name}</Typography>
                    <Typography variant="body2">File Name: {model.filename}</Typography> {/* Display file name */}
                  </div>
                </div>
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
            <div>
              <TextField
                autoFocus
                margin="dense"
                label="Model Name"
                type="text"
                fullWidth
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
              />
              <input
                type="file"
                accept=".csv,.json,.xml"  // Specify the accepted file types
                onChange={(e) => handleFileUpload(e.target.files[0])}  // Handle file upload
                style={{ marginTop: '10px' }}  // Add some space between text field and file input
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          {!selectedModel && (
            <Button onClick={handleAddModel} color="primary" disabled={!newModelName || !selectedFile}>
              Submit
            </Button>
          )}
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default Models;
