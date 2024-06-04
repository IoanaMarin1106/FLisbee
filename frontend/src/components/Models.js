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
  IconButton, MenuItem,
} from '@material-ui/core';
import { Add as AddIcon, Delete as DeleteIcon } from '@material-ui/icons';
import './CardFlip.css'; 
import CustomButton from './CustomButton';
import axios from 'axios';
import { addModel } from '../features/models/modelsSlice';

import UploadFileIcon from '@mui/icons-material/UploadFile';

const Models = () => {
  const dispatch = useDispatch();
  const models = useSelector((state) => state.models.items);
  const status = useSelector((state) => state.models.status);

  const [open, setOpen] = useState(false);
  const [flipped, setFlipped] = useState({});
  const [newModelName, setNewModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const username = localStorage.getItem('username');

  const handleSubmit = () => {
    handleAddModel({
      name: newModelName,
      description: modelDescription,
      file: selectedFile,
      userEmail: username,
    });
    handleCloseDialog();
  };


  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchModels());
    }
  }, [status, dispatch]);

  const handleAddModel = async () => {
      dispatch(addModel(
        {
          name: newModelName,
          description: modelDescription,
          file: selectedFile,
          userEmail: username
        }
      )).then(() => {
        dispatch(getModelsCount());
        dispatch(fetchModels());
      });

      handleCloseDialog()
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setNewModelName('');
    setModelDescription('');
    setSelectedFile(null);
  }
  

  const handleDeleteModel = (id, e) => {
    e.stopPropagation();
    dispatch(deleteModel(id, username)).then(() => {
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
                  <div className="card-back" style={{ borderRadius: '5px', textAlign: 'center' }}>
                    <Typography variant="h6">{model.name}</Typography>
                    <Typography variant="body2">File Name: {model.filename}</Typography>
                    <Typography variant="body2">{model.description}</Typography>
                    <Typography variant="body2">{model.features} features, {model.labels} labels</Typography>
                    <IconButton
                      style={{ position: 'absolute', top: 0, right: 0 }}
                      onClick={(e) => handleDeleteModel(model.id, e)}>
                      <DeleteIcon />
                    </IconButton>
                  </div>
                </div>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>Add New Model</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Model Name"
            type="text"
            fullWidth
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Model Description"
            type="text"
            fullWidth
            multiline
            minRows={4}
            value={modelDescription}
            onChange={(e) => setModelDescription(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Box
            sx={{
              border: '2px dashed grey',
              borderRadius: 4,
              p: 3,
              mb: 3,
              mt: 3,
              textAlign: 'center',
              backgroundColor: 'rgba(169, 169, 169, 0.1)', // Grey background with opacity
              width: '80%', // 80% width of its container
              margin: '0 auto', // Center horizontally
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Box shadow for depth
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload(e.dataTransfer.files[0]);
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {selectedFile ? selectedFile.name : 'Drag & Drop .keras file here'}
          </Box>
          <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} >
            Upload File
            <input type="file" hidden onChange={(e) => handleFileUpload(e.target.files[0])} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" disabled={!newModelName || !selectedFile}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default Models;
