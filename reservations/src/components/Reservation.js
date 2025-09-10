// src/components/Reservation.js
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Reservation = () => {
  const { id } = useParams();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Format MySQL TIME (HH:MM:SS) → "9:00 AM"
  const fmt = (t) => {
    if (!t) return "";
    const [hh, mm, ss] = t.split(":");
    const d = new Date();
    d.setHours(hh, mm, ss || 0);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const fetchReservation = useCallback(async () => {
    if (!id) {
      setError("Missing reservation id in URL.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/reservation.php/${id}`,
        { withCredentials: true }
      );
      if (res.data?.data) {
        setReservation(res.data.data);
      } else {
        setError("Unexpected response from server.");
        console.warn("reservation.php response:", res.data);
      }
    } catch (err) {
      console.error(err);
      const serverMsg = err?.response?.data?.message;
      setError(serverMsg || "Failed to load reservation.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  async function handleAction(action) {
    setError("");
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/reserve.php`,
        { id: Number(id), action },
        { withCredentials: true }
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
  }

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  if (error) {
    return (
      <div className="container my-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="container my-4">
        <div className="alert alert-warning">No reservation found.</div>
      </div>
    );
  }

  const isReserved = Number(reservation.reserved) === 1;
  const placeholder = `${process.env.REACT_APP_API_BASE_URL}/uploads/placeholder_100.jpg`;
  const imageUrl = `${process.env.REACT_APP_API_BASE_URL}/uploads/${reservation.image_name || "placeholder_100.jpg"}`;

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-center mb-3">
        <img
          src={imageUrl}
          alt={reservation.location || "Reservation"}
          className="img-fluid rounded"
          style={{ maxHeight: 260, objectFit: "cover" }}
          onError={(e) => { e.currentTarget.src = placeholder; }}
        />
      </div>

      <h1 className="mb-2 text-center">{reservation.location}</h1>
      <p className="text-center">
        {fmt(reservation.start_time)} &ndash; {fmt(reservation.end_time)}
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