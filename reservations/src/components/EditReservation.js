import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EditReservation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState(""); // HH:MM
  const [endTime, setEndTime] = useState("");     // HH:MM
  const [image, setImage] = useState(null);       // File or existing filename (string)
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Convert "HH:MM:SS" → "HH:MM"
  const toHHMM = (t) => (typeof t === "string" && t.length >= 5 ? t.slice(0, 5) : "");

  useEffect(() => {
    const fetchReservation = async () => {
      setError(null);
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/reservation.php`,
          {
            params: { id },          // ?id=123
            withCredentials: true,   // send PHP session cookie
          }
        );

        const r = res?.data?.data;
        if (!r) {
          throw new Error("Empty response");
        }

        setLocation(r.location || "");
        setStartTime(toHHMM(r.start_time));
        setEndTime(toHHMM(r.end_time));
        setImage(r.image_name || null); // keep existing filename
      } catch (e) {
        console.error("GET reservation failed:", e?.response?.status, e?.response?.data);
        setError("Failed to fetch reservation details.");
      }
    };

    fetchReservation();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("id", id);
      formData.append("location", location);
      formData.append("start_time", startTime); // HH:MM (PHP will add :00 if needed)
      formData.append("end_time", endTime);

      // Only append if it’s a newly uploaded File (not the existing filename string)
      if (image && typeof image !== "string") {
        formData.append("image", image);
      }

      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/update-reservation.php`,
        formData,
        { withCredentials: true }
      );

      navigate(`/reservation/${id}`);
    } catch (e) {
      console.error("POST update failed:", e?.response?.status, e?.response?.data);
      setError("Failed to update reservation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4 p-4 bg-light rounded shadow-lg mt-5 border-0">
      <h2 className="mb-5">Edit Reservation</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Location */}
        <div className="row mb-3 align-items-center">
          <label htmlFor="location" className="col-sm-2 col-form-label fw-semibold">
            Location
          </label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control w-50"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
              required
            />
          </div>
        </div>

        {/* Start Time */}
        <div className="row mb-3 align-items-center">
          <label htmlFor="start_time" className="col-sm-2 col-form-label fw-semibold">
            Start Time
          </label>
          <div className="col-sm-10">
            <input
              type="time"
              className="form-control w-25"
              id="start_time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* End Time */}
        <div className="row mb-3 align-items-center">
          <label htmlFor="end_time" className="col-sm-2 col-form-label fw-semibold">
            End Time
          </label>
          <div className="col-sm-10">
            <input
              type="time"
              className="form-control w-25"
              id="end_time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Image Upload */}
        <div className="row mb-3 align-items-center">
          <label htmlFor="image" className="col-sm-2 col-form-label fw-semibold">
            Image
          </label>
          <div className="col-sm-10">
            <input
              type="file"
              className="form-control w-50"
              id="image"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />
            {image && (
              <img
                src={
                  typeof image === "string"
                    ? `${process.env.REACT_APP_API_BASE_URL}/uploads/${image}`
                    : URL.createObjectURL(image)
                }
                alt="Preview"
                className="img-thumbnail mt-2"
                style={{ maxWidth: "150px" }}
              />
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="text-end">
          <button type="submit" className="btn btn-primary me-2" disabled={isLoading}>
            {isLoading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving changes...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>

          <button type="button" className="btn btn-danger" onClick={() => navigate("/")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditReservation;