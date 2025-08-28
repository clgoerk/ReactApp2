import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Reservation = () => {
  const { id } = useParams();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Format MySQL TIME (HH:MM:SS) to 12-hour AM/PM, e.g., "9:00 AM"
  const fmt = (t) => {
    if (!t) return "";
    const [hh, mm, ss] = t.split(":");
    const d = new Date();
    d.setHours(hh, mm, ss || 0);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const fetchReservation = async () => {
    setError("");
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/reservation.php/${id}`
      );
      setReservation(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load reservation.");
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setError("");
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/reserve.php`,
        { reservation_id: Number(id), action },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.status === "success") {
        fetchReservation();
      } else {
        setError(res.data?.message || "Failed to update reservation.");
      }
    } catch (err) {
      console.error("Error updating reservation:", err);
      const serverMsg = err?.response?.data?.message;
      setError(serverMsg || "Failed to update reservation.");
    }
  };

  useEffect(() => {
    fetchReservation();
  }, );

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  const isReserved = Number(reservation?.reserved) === 1;

  return (
    <div className="container my-4">
      {error && <div className="alert alert-danger">{error}</div>}

      <h1 className="mb-2 text-center">{reservation?.location}</h1>
      <p className="text-center">
        {fmt(reservation?.start_time)} &ndash; {fmt(reservation?.end_time)}
      </p>
      <hr />
      <div className="text-center mb-3">
        <strong>Status: </strong>
        {isReserved ? (
          <span className="text-danger">Reserved</span>
        ) : (
          <span className="text-success">Available</span>
        )}
      </div>

      <div className="d-flex justify-content-center gap-2 mt-3">
        <button
          className="btn btn-success"
          onClick={() => handleAction("reserve")}
          disabled={isReserved}
        >
          Reserve
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => handleAction("unreserve")}
          disabled={!isReserved}
        >
          Unreserve
        </button>
      </div>
    </div>
  );
};

export default Reservation;