import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Reg.css";
import Swal from 'sweetalert2'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
export const Structure = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [editEnabled, setEditEnabled] = useState(false); // 🔹 NEW: controls edit mode
  const [feesData, setFeesData] = useState({});
  const navi = useNavigate();
  const monthsList = [ "April", "May","June","July","August",
    "September","October","November","December","January","February","March"
  ];
  // Loading class+session from sessionStorage
  useEffect(() => {
    const classid = sessionStorage.getItem("classid");
    const classsession = sessionStorage.getItem("classsession");
    if (classid && classsession) {
      setSelectedClass(classid);
    } else {
      const classsession = sessionStorage.getItem("sessionkey");
      const fetchclasses = async () => {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}api.php?endpoint=StudentReg/fetch`, {classsession}, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},});
          setClasses(response.data.result || []);
        } catch (error) {
          console.log("Error fetching classes:", error);
          setClasses([]);
        }
      };
      fetchclasses();
    }
  }, [navi]);
  //fetching existing fees structure
  useEffect(() => {
    if (!selectedClass) return; // doing nothing if no class is selected
    const fetchFeeStructure = async () => {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}api.php?endpoint=view-structure`,
          {
            classid: selectedClass,
            classsession: sessionStorage.getItem("sessionkey"),
          },
          {
            headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
          }
        );
        if (response.data.status === "yes" && response.data.result) {
          // assuming result has fee structure like { april: 200, may: 300, ... }
          setFeesData(response.data.result[0]);
          setEditEnabled(false); // 🔹 Disable editing initially
        } else {
          // No structure found -> clear inputs
          setFeesData({});
          setEditEnabled(true); // 🔹 Allow edit if no structure exists
        }
      } catch (error) {
        console.error("Error fetching fee structure:", error);
        toast.error("⚠️ Could not load fee structure!");
      }
    };

    fetchFeeStructure();
  }, [selectedClass]);

  // Handle change in fees input
  const handleFeeChange = (month, value) => {
    setFeesData(prev => ({
      ...prev,
      [month.toLowerCase()]: value
    }));
  };
  // Save to DB
  const handleSave = async (e) => {
    e.preventDefault();
    let now = new Date();
    let time = now.toLocaleTimeString();
    let date = now.toLocaleDateString();
    let milliseconds = now.getMilliseconds().toString().padStart(3, "0"); // always 3 digits
    let timeStamp = `Date: ${date}, Time: ${time}.${milliseconds}`;
    console.log(timeStamp);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}api.php?endpoint=fees-structure`, {
        classid: selectedClass,
        classsession: sessionStorage.getItem("sessionkey"),
        ...feesData,
        timeRecord: timeStamp
      }, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},});
      if (response.data.status === "yes") {
        Swal.fire({icon: "success", title: "Fees Structure Saved Successfully"});
        setFeesData({});
        navi("/StudentReg");
      }
      else if(response.data.status === "updated"){
        Swal.fire({icon: "info", title: "Fees Structure Has Been Updated!"});
        setFeesData({});
        navi("/StudentReg");
      }
      else{
        Swal.fire({icon: "info", title: "something went wrong!"});
      }
    } catch (error) {
      toast.error("⚠️ Server error, please try again later!");
      console.log("Error:", error);
    }
  };
  return (
    <div className="reg-container">
      <ToastContainer position="top-right" autoClose={2000} />
      <h2>Fees Structure</h2>
      {/* Fixed Class & Session */}
      <div className="form-section">
  <div className="form-grid">
    <div>
      <label>Class</label>
      {sessionStorage.getItem("classid") ? (
        <input type="text" value={selectedClass} readOnly className="class-session"/>
      ) : (
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="class-session">
          <option value="">Select Class</option>
          {classes.map((cls, idx) => (
            <option key={idx} value={cls.class}>{cls.class}</option>
          ))}
        </select>
      )}
    </div>
    <div>
      <label>Session</label>
      <input type="text" value={sessionStorage.getItem("sessionkey")} readOnly className="class-session" />
        </div>
      </div>
    </div>
      {/* Fees Table */}
      <div className="form-section">
        <h3>Monthly Fees</h3>
        {/* 🔹 Toggle Button */}
          <button
            onClick={() => setEditEnabled((prev) => !prev)}
            className="edit-toggle-btn"
          >
            {editEnabled ? "🔒 Disable Edit" : "✏️ Enable Edit"}
          </button>
        <table className="fees-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Fees</th>
            </tr>
          </thead>
          <tbody>
            {monthsList.map((month, idx) => (
              <tr key={idx}>
                <td data-label="Month">{month}</td>
                <td data-label="Fees" className="month-table">
                  <input
                    type="number"
                    placeholder="Enter Fees"
                    value={feesData[month.toLowerCase()] || ""}
                    onChange={(e) => handleFeeChange(month, e.target.value)}
                    disabled={!editEnabled} // 🔹 disable when not editing
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={handleSave} className="submit-btn">
        💾 Save Fees Structure
      </button>
    </div>
  );
};