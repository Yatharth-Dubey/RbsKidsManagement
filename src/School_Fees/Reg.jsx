import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import axios from "axios";
import "./Reg.css";
import Swal from 'sweetalert2'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
export const Reg = () => {
  const [classes, setclasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [excelData, setExcelData] = useState([]); // store excel records
  useEffect(() => {
    let classsession = sessionref.current.value;
    const fetchclasses = async () => {
      try{
        const response = await axios.post(`${process.env.REACT_APP_API_URL}api.php?endpoint=StudentReg/fetch`, {classsession}, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},});
        setclasses(response.data.result || []);
      }catch(error){
        console.log("Error fetching classes:", error);
        setclasses([])
      }
    };
    fetchclasses();
  }, []);
  const rollref = useRef();
  const studentref = useRef();
  const genderref = useRef();
  const motherref = useRef();
  const fatherref = useRef();
  const classref = useRef();
  const sessionref = useRef();
  const residenceref = useRef();
  const phoneref = useRef();
  const relaxref = useRef();
  const navi = useNavigate();
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0]; // first sheet
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log("Excel Data:", jsonData);
      setExcelData(jsonData);
    };
    reader.readAsBinaryString(file);
  };
  const handleBulk = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}api.php?endpoint=reg/bulk`, {
        students: excelData, // send all excel rows
      }, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},});
      Swal.fire({icon: "success", title: "Bulk Upload Done!"});
      console.log(response.data);
    } catch (error) {
      toast.error("⚠️ Bulk upload error!");
      console.error("Bulk upload error:", error);
    }
  };
  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    let rollno = rollref.current.value;
    let studentname = studentref.current.value;
    let gender = genderref.current.value;
    let mothername = motherref.current.value;
    let fathername = fatherref.current.value;
    let classid = classref.current.value;
    let classsession = sessionref.current.value;
    let residence = residenceref.current.value;
    let phone = phoneref.current.value;
    let relaxation = relaxref.current.value;
    let now = new Date();
    let time = now.toLocaleTimeString();
    let date = now.toLocaleDateString();
    let milliseconds = now.getMilliseconds().toString().padStart(3, "0"); // always 3 digits
    let timeStamp = `Date: ${date}, Time: ${time}.${milliseconds}`;
    try{
      const response = await axios.post(`${process.env.REACT_APP_API_URL}api.php?endpoint=reg`, {rollno, studentname, gender, mothername, fathername, classid, classsession, residence, phone, relaxation, timeRecord: timeStamp}, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},});
      console.log(response.data);
      if(response.data.status === true){
        Swal.fire({icon: "success", title: "Student Registered!"});
        navi("/StudentReg");
      }
      else{
        Swal.fire({icon: "info", title: "Student Already Registered!"});
        navi("/StudentReg");
      }
    }catch(error){
      if (error.response && error.response.status === 401) {
        toast.error("❌ Wrong Credentials!");
      } else {
        toast.error("⚠️ Server error, please try again later!");
        console.log("Error:", error);
      }
    }
    e.preventDefault();  
  };
  return (
      <div className="reg-container">
        <ToastContainer position="top-right" autoClose={3000} />
        <h2>Student Registration</h2>
        <form className="reg-form" onSubmit={handleSubmit}>
          {/* Academic Info Section */}
          <div className="form-section">
            <h3>Academic Info</h3>
            <div className="form-grid">
              <div>
                <label>Roll No.</label>
                <input
                  type="text"
                  name="rollno"
                  ref={rollref}
                  placeholder="Enter Roll No."
                />
              </div>
              <div>
                <label>Class</label>
                <select ref={classref} required onChange={(e) => setSelectedClass(e.target.value)}>
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.classno} value={cls.class}>
                      {cls.class} 
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Session</label>
                <input type="text" value={sessionStorage.getItem("sessionkey")} ref={sessionref} readOnly/>
                {/* <select ref={sessionref} required disabled={!selectedClass}>
                  <option value="">Select Session</option>
                  {classes.filter((cls) => cls.class === selectedClass) // only sessions of selected class
                  .map((cls, idx) => (
                  <option key={idx} value={cls.classsession}>
                    {cls.classsession}
                  </option>
                  ))}
                </select> */}
              </div>
              <div>
                <label>Student's Name</label>
                <input
                  type="text"
                  name="studentname"
                  ref={studentref}
                  placeholder="Enter Student's Name"
                />
              </div>
              <div>
                <label>Gender</label>
                <select ref={genderref} required >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>
          {/* Personal Info Section */}
          <div className="form-section">
            <h3>Personal Info</h3>
            <div className="form-grid">
              <div>
                <label>Mother's Name</label>
                <input
                  type="text"
                  name="mothername"
                  ref={motherref}
                  placeholder="Enter Mother's Name"
                />
              </div>
              <div>
                <label>Father's Name</label>
                <input
                  type="text"
                  name="fathername"
                  ref={fatherref}
                  placeholder="Enter Father's Name"
                />
              </div>
              <div>
                <label>Phone No.</label>
                <input
                  type="text"
                  name="phone"
                  ref={phoneref}
                  placeholder="Enter Phone No."
                />
              </div>
              <div>
                <label>Relaxation</label>
                <input
                  type="text"
                  name="phone"
                  ref={relaxref}
                  placeholder="Enter Relaxation %"
                />
              </div>
              <div className="address-field">
                <label>Residence Info</label>
                <textarea
                  name="residence"
                  ref={residenceref}
                  placeholder="Enter Residence"
                />
              </div>
            </div>
          </div>
          <button type="submit" className="submit-btn">
            Register
          </button>
        </form>
        <div className="upload-section">
          <label>Upload Excel File: </label>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload}/>
          {excelData.length > 0 && (
            <button className="bulk-btn" onClick={handleBulk}>
              Bulk Upload ({excelData.length} students)
            </button>
          )}
        </div>
      </div>
  );
};
