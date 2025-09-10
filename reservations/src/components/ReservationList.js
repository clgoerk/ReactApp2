import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function ReservationList() {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReservations, setTotalReservations] = useState(0);
  const reservationsPerPage = 6;
  const { user } = useAuth();

  // Format MySQL TIME (HH:MM:SS) to 12-hour AM/PM
  const fmt = (t) => {
    if (!t) return "";
    const [hh, mm, ss] = t.split(":");
    const d = new Date();
    d.setHours(hh, mm, ss || 0);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/reservations.php?page=${currentPage}`
      );
      setReservations(response.data.reservations || []);
      setTotalReservations(response.data.totalReservations || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load reservations.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reservation?")) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/delete-reservation.php`,
        { id },
        { withCredentials: true }
      );
      fetchReservations(); // refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to delete reservation.");
    }
  };

  const totalPages = Math.ceil(totalReservations / reservationsPerPage) || 1;
  const goToPreviousPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="container mt-5">
      <h2 className="mb-4">All Reservations</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row">
        {isLoading ? (
          <p>Loading reservations...</p>
        ) : reservations.length ? (
          reservations.map((reservation) => {
            const isReserved = Number(reservation.reserved) === 1;
            return (
              <div className="col-md-4" key={reservation.id}>
                <div className="card mb-4">
                  <div className="card-body text-center">
                    <h5 className="card-title">{reservation.location}</h5>
                    <p className="card-text mb-2">
                      {fmt(reservation.start_time)} – {fmt(reservation.end_time)}
                    </p>
                    <span
                      className={`badge ${isReserved ? "bg-danger" : "bg-success"}`}
                    >
                      {isReserved ? "Reserved" : "Available"}
                    </span>

                    <div className="mt-3 d-flex justify-content-center gap-2">
                      <Link to={`/reservation/${reservation.id}`} className="btn btn-primary">
                        View
                      </Link>

                      {/* 🔒 Only admins see Edit & Delete */}
                      {user?.role === "admin" && (
                        <>
                          <Link
                            to={`/edit-reservation/${reservation.id}`}
                            className="btn btn-secondary"
                          >
                            Edit
                          </Link>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(reservation.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p>No reservations available</p>
        )}
      </div>

      {/* Pagination */}
      <nav aria-label="Page navigation">
        <ul className="pagination">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={goToPreviousPage}>Previous</button>
          </li>
          {Array.from({ length: totalPages }, (_, i) => (
            <li key={i} className={`page-item ${i + 1 === currentPage ? "active" : ""}`}>
              <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
            </li>
          ))}
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button className="page-link" onClick={goToNextPage}>Next</button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default ReservationList;