import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';

import './App.css';
import Navbar from './components/Navbar';
import CreateReservation from './components/CreateReservation';
import ReservationList from './components/ReservationList';
import Reservation from './components/Reservation';
import EditReservation from './components/EditReservation'; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected + shows Navbar only when logged in */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <ReservationList />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-reservation"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <CreateReservation />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservation/:id"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Reservation />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-reservation/:id" 
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <EditReservation />
                </>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
