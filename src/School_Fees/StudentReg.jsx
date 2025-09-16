import React, { useEffect, useRef, useState } from "react";
import "./StudentReg.css";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
function StudentReg() {
  const navigate = useNavigate();
  const location = useLocation();
  const classref = useRef();
  const sessionref = useRef();
  const [timeRecord, settimeRecord] = useState("");

  const closeSidebar = () => {
    document.body.classList.remove("sidenav-open");
  };
  // Register Class
  const handleRegister = async () => {
    let classid = classref.current.value;
    let classsession = sessionref.current.value;
    let now = new Date();
    let time = now.toLocaleTimeString();
    let date = now.toLocaleDateString();
    let milliseconds = now.getMilliseconds().toString().padStart(3, "0");
    let timeStamp = `Date: ${date}, Time: ${time}.${milliseconds}`;
    settimeRecord(timeStamp);
    sessionStorage.setItem("classid", classid);
    sessionStorage.setItem("classsession", classsession);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=StudentReg/register`, {
        classid,
        classsession,
        timeRecord: timeStamp,
      }, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},});
      if (response.data.status) {
        alert("✅ Class Registered");
        navigate("/StudentReg/Structure");
      }
    } catch (error) {
      alert("⚠️ Server error, please try again later");
      console.error("Error:", error);
    }
  };
  // Navigation
  const handleReport = () => {
    closeSidebar();
    navigate("/StudentReg/Report");
  };
  const handleFeesCreate = () => {
    closeSidebar();
    navigate("/StudentReg/Structure");
    sessionStorage.removeItem("classid");
  };
  const handleFees = () => {
    closeSidebar();
    navigate("/StudentReg/Fees");
  };
  const handleCreate = () => {
    closeSidebar();
    navigate("/StudentReg/Reg");
  };
  const handleViewStructure = () => {
    closeSidebar();
    navigate("/StudentReg/ViewStructure");
  };
  const handleHome = () => {
    closeSidebar();
    navigate("/StudentReg");
  };
  const handleAbout = () => {
    closeSidebar();
    navigate("/StudentReg/About")
  }
  const handleLogout = () => {
    closeSidebar();
    sessionStorage.clear();
    navigate("/");
  };
  // Token check
  useEffect(() => {
    const tok = sessionStorage.getItem("token");
    if (!tok) navigate("/");
  }, [navigate]);
  return (
    <div className="stu">
      {/* Header */}
      <header className="headstu">
        <div className="logo-section">
          <img src="/IronLogo.png" alt="school_logo" />
          <h1>RBS PUBLIC SCHOOL</h1>
        </div>
        {/* Mobile Menu Toggle */}
        <button
          className="menu-toggle"
          onClick={() => document.body.classList.toggle("sidenav-open")}
        >
          ☰
        </button>

        <ul>
          <li onClick={handleHome}>Home</li>
          <li onClick={handleAbout}>About Dev</li>
          <li onClick={handleLogout} className="logout">
            Log Out
          </li>
        </ul>
      </header>
      {/* Sidebar + Content */}
      <div className="layout">
        {/* Sidebar */}
        <aside className="sidenav">
          <button type="button" onClick={handleCreate}>🧑‍🎓 Create Student</button>
          <button type="button" onClick={handleFeesCreate}>🧑‍💻 Create Fees Structure</button>
          <button type="button" onClick={handleFees}>💵 Fees Submission Portal</button>
          <button type="button" onClick={handleViewStructure}>💹 Fees Structure</button>
          <button type="button" onClick={handleReport}>📟 Student Fees Report</button>

          {/* Mobile only nav links */}
          <ul className="mobile-nav">
            <li onClick={handleHome}>Home</li>
            <li onClick={handleAbout}>About Dev</li>
            <li onClick={handleLogout} className="logout">Log Out</li>
          </ul>
        </aside>
        {/* Main Content */}
        <section className="sect">
          <Outlet />
          {location.pathname === "/StudentReg" && (
            <>
              <h2>🎓 Class Registration Portal</h2>
              <div className="regStu">
                <p className="label">Register Class🏛️</p>
                <div className="selectors">
                  <input type="text" id="classreg" ref={classref} placeholder="Class (Eg: 3A)" />
                  <input
                    type="text"
                    id="select"
                    ref={sessionref}
                    value={sessionStorage.getItem("sessionkey") || ""}
                    readOnly
                  />
                </div>
              </div>
              <button type="button" onClick={handleRegister} className="regbtn">
                Register
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
export default StudentReg;