import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import MainLayout from './components/MainLayout';
import Workflows from './components/Workflows';
import WorkflowDetails from './components/WorkflowDetails';

function App() {

  return (
    <Router>
      <Routes>
        <Route exact path='/login' element={<Login/>} />
        <Route exact path='/register' element={<Register/>} />
        <Route exact path='/app' element={ <MainLayout /> } />
        <Route exact path="/workflows" element={<Workflows/>} />
        <Route exact path="/workflows/:workflowId" element={<WorkflowDetails/>} />
      </Routes>
    </Router>
  );
}

export default App;

