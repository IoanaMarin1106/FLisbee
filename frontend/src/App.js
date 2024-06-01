import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import Login from './components/Login';
import Register from './components/Register';
import Protected from './components/Protected';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route exact path='/login' element={<Login/>} />
          <Route exact path='/register' element={<Register/>} />
          <Route exact path='/protected' element={<Protected/>} />
          <Route exact path='/' element={<Login/>} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
