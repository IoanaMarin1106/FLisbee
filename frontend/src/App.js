import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import MainLayout from './components/MainLayout';
import Workflows from './components/Workflows';
import EmailConfirmed from './components/EmailConfirmed';
import Models from './components/Models';

function App() {

  return (
    <Router>
      <Routes>
        <Route exact path='/login' element={<Login/>} />
        <Route exact path='/register' element={<Register/>} />
        <Route exact path="/confirm/:user_email/:token" element={<EmailConfirmed/>} />
        <Route exact path='/app' element={ <MainLayout /> } />
        <Route exact path="/workflows" element={<Workflows/>} />
        <Route exact path="/models" element={<Models/>} />
      </Routes>
    </Router>
  );
}

export default App;

