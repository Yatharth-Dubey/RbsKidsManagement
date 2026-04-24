import React, { useEffect, useRef, useState } from "react";
import "./ViewStructure.css";
import axios from "axios";
import Swal from 'sweetalert2'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
export const ViewStructure = () => {
  const classref = useRef();
  const sessionref = useRef();
  const [classes, setclasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(""); // dropdown
  const [classReport, setClassReport] = useState([]);     // API result
  useEffect(() => {
    const classsession = sessionStorage.getItem("sessionkey")
    const fetchclasses = async () => {
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}api.php?endpoint=StudentReg/fetch`, {classsession}, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},});
        setclasses(response.data.result || []);
      } catch (error) {
        console.log("Error fetching classes:", error);
        setclasses([]);
      }
    };
    fetchclasses();
  }, []);
  const handleView = async (e) => {
    e.preventDefault();
    let classid = classref.current.value;
    let classsession = sessionref.current.value;
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}api.php?endpoint=view-structure`, {
        classid,
        classsession,
      }, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},});
      console.log(response.data);
      if (response.data.status === "yes") {
        setClassReport(response.data.result);
      } else {
        setClassReport([]);
        toast.error("⚠️ No students found for this class/session!");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        toast.error("❌ Wrong Credentials!");
      } else {
        toast.error("⚠️ Server error, please try again later!");
        console.log("Error:", error);
      }
    }
  };
  return (
    <div>
      <ToastContainer position="top-right" autoClose={2000} />
      <div className="view-structure">
        <h2>View Fees Structure</h2>
        {/* Class Report Form */}
        <form className="view-form" onSubmit={handleView}>
          <label>Class</label>
          <select
            ref={classref}
            required
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)} // ✅ keep selected class
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls.classno} value={cls.class}>
                {cls.class}
              </option>
            ))}
          </select>
          <label>Session</label>
          <input
            type="text"
            name="session"
            value={sessionStorage.getItem("sessionkey")}
            readOnly
            ref={sessionref}
          />
          <button type="submit">View Structure</button>
        </form>
      </div>
      {/* Display backend results */}
      {classReport.length > 0 && (
        <div className="table-wrapper">
          <h3>📊 Fees Structure</h3>
          <div className="table-container">
            <table className="structure-table">
              <thead>
                <tr>
                  <th>Class No</th>
                  <th>Class</th>
                  <th>Session</th>
                  <th>April</th>
                  <th>May</th>
                  <th>June</th>
                  <th>July</th>
                  <th>August</th>
                  <th>September</th>
                  <th>October</th>
                  <th>November</th>
                  <th>December</th>
                  <th>January</th>
                  <th>February</th>
                  <th>March</th>
                </tr>
              </thead>
              <tbody>
                {classReport.map((row, idx) => (
                  <tr key={idx}>
                    <td data-label="Class No">{row.classno}</td>
                    <td data-label="Class">{row.class}</td>
                    <td data-label="Session">{row.classsession}</td>
                    <td data-label="April">{row.april}</td>
                    <td data-label="May">{row.may}</td>
                    <td data-label="June">{row.june}</td>
                    <td data-label="July">{row.july}</td>
                    <td data-label="August">{row.august}</td>
                    <td data-label="September">{row.september}</td>
                    <td data-label="October">{row.october}</td>
                    <td data-label="November">{row.november}</td>
                    <td data-label="December">{row.december}</td>
                    <td data-label="January">{row.january}</td>
                    <td data-label="February">{row.february}</td>
                    <td data-label="March">{row.march}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
