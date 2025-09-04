import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateReservation() {

  const [location, setLocation] = useState('');
  const [start_time, setStartTime] = useState('');
  const [end_time, setEndTime] = useState('');
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (!image) { setPreviewUrl(''); return; }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const validateForm = () => {
    if (!location.trim() || !start_time || !end_time) {
      setError("Please fill in all the fields.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const startHHMMSS = start_time.length === 5 ? `${start_time}:00` : start_time;
      const endHHMMSS = end_time.length === 5 ? `${end_time}:00` : end_time;

      const formData = new FormData();
      formData.append('location', location);
      formData.append('start_time', startHHMMSS);
      formData.append('end_time', endHHMMSS);
      if (image) formData.append('image', image);

      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/create-reservation.php`,
        formData,
        {
          // IMPORTANT: let axios set the boundary; do not add JSON headers
          headers: { /* 'Content-Type': 'multipart/form-data' */ },
          withCredentials: false
        }
      );

      if (res.data?.id) {
        navigate('/');
      } else {
        setError(res.data?.message || 'Failed to create reservation.');
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Failed to create reservation. Please try again later.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Create a New Reservation</h2>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="location" className="form-label">Location</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Maple Grove"
            id="location"
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="start_time" className="form-label">Start Time</label>
          <input
            type="time"
            className="form-control"
            id="start_time"
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="end_time" className="form-label">End Time</label>
          <input
            type="time"
            className="form-control"
            id="end_time"
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="image" className="form-label">Reservation Image (optional)</label>
          <input
            type="file"
            className="form-control"
            id="image"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
          {previewUrl && (
            <div className="mt-3">
              <img
                src={previewUrl}
                alt="Selected preview"
                style={{ maxWidth: '240px', height: 'auto', borderRadius: 8 }}
              />
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating reservation...' : 'Create Reservation'}
        </button>
      </form>
    </div>
  );
}

export default CreateReservation;