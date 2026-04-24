import React, { useEffect, useRef, useState } from "react";
import "./StudentReg.css";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function StudentReg() {
  const [schoolInfo, setSchoolInfo] = useState({
    schoolname: "",
    mobno: "",
    schooladd: ""
  });
  const navigate = useNavigate();
  const location = useLocation();
  const classref = useRef();
  const sessionref = useRef();
  const [timeRecord, settimeRecord] = useState("");

  const closeSidebar = () => {
    document.body.classList.remove("sidenav-open");
  };

  // ✅ RESET DATABASE FUNCTION WITH ADMIN KEY VERIFICATION
  const handleReset = async () => {
    closeSidebar();

    // Step 1️⃣ - Ask for admin key
    const { value: adminKey } = await Swal.fire({
      title: "🔐 Admin Key Required",
      input: "password",
      inputLabel: "Enter Admin Security Key",
      inputPlaceholder: "Enter admin key...",
      inputAttributes: {
        maxlength: 30,
        autocapitalize: "off",
        autocorrect: "off",
      },
      showCancelButton: true,
      confirmButtonText: "Verify",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!adminKey) {
      Swal.fire("Cancelled", "Reset process cancelled.", "info");
      return;
    }

    // Step 2️⃣ - Verify key
    const correctKey = "fatherofalltime";
    if (adminKey !== correctKey) {
      Swal.fire({
        icon: "error",
        title: "❌ Invalid Key",
        text: "You are not authorized to reset the database!",
      });
      return;
    }

    // Step 3️⃣ - Confirm reset action
    const result = await Swal.fire({
      title: "⚠️ Are you sure?",
      text: "You want to reset the database. You will be redirected to the Login Page!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reset it!",
      cancelButtonText: "No, cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    // Step 4️⃣ - Proceed with reset request
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}api.php?endpoint=StudentReg/resetDatabase`,
        {},
        { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } }
      );

      if (response.data.status) {
        await Swal.fire({
          icon: "success",
          title: "✅ Database Reset",
          text: "Database has been reset successfully! You will be redirected to Login!",
          confirmButtonColor: "#4caf50",
        });
        sessionStorage.clear();
        navigate("/");
      } else {
        Swal.fire({
          icon: "error",
          title: "⚠️ Reset Failed",
          text: "Could not reset database. Please try again.",
        });
        console.error("Reset error:", response.data);
      }
    } catch (error) {
      toast.error("⚠️ Server error, please try again later");
      console.error("Error:", error);
    }
  };

  // ✅ CLASS REGISTRATION FUNCTION
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
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}api.php?endpoint=StudentReg/register`,
        { classid, classsession, timeRecord: timeStamp },
        { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } }
      );

      if (response.data.status === true) {
        Swal.fire({ icon: "success", title: "Class Registered" });
        navigate("/StudentReg/Structure");
      } else {
        Swal.fire({ icon: "info", title: response.data.message });
        navigate("/StudentReg");
      }
    } catch (error) {
      toast.error("⚠️ Server error, please try again later");
      console.error("Error:", error);
    }
  };

  // ✅ NAVIGATION HANDLERS
  const handleReport = () => {
    closeSidebar();
    navigate("/StudentReg/Report");
  };

  const handleFeesCreate = () => {
    closeSidebar();
    navigate("/StudentReg/Structure");
    sessionStorage.removeItem("classid");
  };
  const handleSet = () => {
    closeSidebar();
    navigate("/set")
  }
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
    navigate("/StudentReg/About");
  };

  const handleLogout = () => {
    closeSidebar();
    sessionStorage.clear();
    navigate("/");
  };

  // ✅ TOKEN CHECK ON MOUNT
  useEffect(() => {
    const tok = sessionStorage.getItem("token");
    if (!tok) navigate("/");
  }, [navigate]);
  // ✅ FETCH SCHOOL INFO FROM DB
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}api.php?endpoint=getSchoolInfo`,
          {},
          { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } }
        );
        if (response.data.status) {
          setSchoolInfo(response.data.data);
        } else {
          console.warn("School info not found");
        }
      } catch (error) {
        console.error("Error fetching school info:", error);
      }
    };
    fetchSchoolInfo();
  }, []);
  // ✅ MAIN RETURN
  return (
    <div className="stu">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* HEADER */}
      <header className="headstu">
        <div className="logo-section">
          <img src={schoolInfo.schoollogo ? schoolInfo.schoollogo : "/WebLogo.png"} alt="school_logo" onError={(e) => { e.target.src = "/WebLogo.png"; }} />
          <h1>{schoolInfo.schoolname || "Loading..."}</h1>
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
          <li onClick={handleSet}>Settings</li>
          <li onClick={handleLogout} className="logout">
            Log Out
          </li>
        </ul>
      </header>

      {/* SIDEBAR + CONTENT */}
      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidenav">
          <button type="button" onClick={handleCreate}>
            🧑‍🎓 Create Student
          </button>
          <button type="button" onClick={handleFeesCreate}>
            🧑‍💻 Create Fees Structure
          </button>
          <button type="button" onClick={handleFees}>
            💵 Fees Submission Portal
          </button>
          {/* <button type="button" onClick={handleViewStructure}>
            💹 Fees Structure
          </button> */}
          <button type="button" onClick={handleReport}>
            📟 Student Fees Report
          </button>
          <button type="button" onClick={handleReset}>
            🔁 Reset Database
          </button>

          {/* Mobile-only nav links */}
          <ul className="mobile-nav">
            <li onClick={handleHome}>Home</li>
            <li onClick={handleAbout}>About Dev</li>
            <li onClick={handleSet}>Settings</li>
            <li onClick={handleLogout} className="logout">
              Log Out
            </li>
          </ul>
        </aside>

        {/* MAIN CONTENT */}
        <section className="sect">
          <Outlet />
          {location.pathname === "/StudentReg" && (
            <>
              <h2>🎓 Class Registration Portal</h2>
              <div className="regStu">
                <p className="label">Register Class🏛️</p>
                <div className="selectors">
                  <input
                    type="text"
                    id="classreg"
                    ref={classref}
                    placeholder="Class (Eg: 3A)"
                  />
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
          <p onClick={handleAbout} className="dev-credit">
            👨‍💻 Developed by <strong>Yatharth Dubey</strong>
          </p>
        </section>
      </div>
    </div>
  );
}

export default StudentReg;
