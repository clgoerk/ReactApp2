import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateReservation() {

  const [location, setLocation] = useState('');
  const [start_time, setStartTime] = useState('');
  const [end_time, setEndTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Validation function
  const validateForm = () => {
    if (!location.trim() || !start_time || !end_time) {
      setError("Please fill in all the fields.");
      return false;
    }
    return true;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); // reset error message on a new form submission
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        location,
        start_time: start_time.length === 5 ? `${start_time}:00` : start_time, // HH:MM -> HH:MM:00
        end_time: end_time.length === 5 ? `${end_time}:00` : end_time
      };

      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/create-reservation.php`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(response.data);
      navigate('/');
    } catch (error) {
      console.error(error);
      setError('Failed to create reservation. Please try again later.');
      setIsLoading(false);
    } 
  }
  
  return(
    <div className="container mt-4">
      <h2>Create a New Reservation</h2>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="location" className="form-label">
            Location
          </label>
          <input
            type="text"
            className="form-control"
            id="location"
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="start_time" className="form-label">
            Start Time
          </label>
          <input
            type="time"
            className="form-control"
            id="start_time"
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="end_time" className="form-label">
            End Time
          </label>
          <input
            type="time"
            className="form-control"
            id="end_time"
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? <span><span className="spinner-boarder spinner-boarder-sm" role="status" aria-hidden="true"></span>
          Creating reservation...</span> : 'Create Reservation'}
        </button>
      </form>
    </div>
    );
}

export default CreateReservation;