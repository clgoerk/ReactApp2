import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; 
import './App.css';
import Navbar from './components/Navbar';
import CreateReservation from './components/CreateReservation';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path={"/create-reservation"} element={<CreateReservation />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
