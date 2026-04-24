import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './admin.css'
import axios from 'axios'
import Swal from 'sweetalert2'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const Admin = () => {
  const keyRef = useRef();
  const sessionRef = useRef();
  const navi = useNavigate();

  const handleAdmin = async () => {
    let logkey = keyRef.current.value;
    let sessionkey = sessionRef.current.value;
    sessionStorage.setItem("sessionkey", sessionkey);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}api.php?endpoint=admin`,
        { logkey }
      );

      console.log(response.data);
      sessionStorage.setItem("token", response.data.token);

      if (response.data.status) {
        Swal.fire({icon: "success", title: "Login Successful"});
        navi("/StudentReg");
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
    <div className="adm">
      <ToastContainer position="top-right" autoClose={2000} />
      <section className="admsec">
        <h2 className="adm-title">🔑 Admin Login</h2>
        <input type="password" placeholder="Enter Login Key..." ref={keyRef} />
        <select ref={sessionRef} defaultValue="">
          <option value="" disabled>Choose Session</option>
          <option value="2025-26">2025-26</option>
          <option value="2026-27">2026-27</option>
          <option value="2027-28">2027-28</option>
          <option value="2028-29">2028-29</option>
          <option value="2029-30">2029-30</option>
        </select>
        <button onClick={handleAdmin}>🚀 Enter</button>
        <p className="dev-credit">👨‍💻 Developed by <strong>Yatharth Dubey</strong></p>
      </section>
    </div>
  )
}
