import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    schoolname: "",
    mobno: "",
    schooladd: "",
    schoollogo: ""
  });
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef();
  // ✅ Fetch existing settings from backend
  useEffect(() => {
    const fetchname = async () => {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}api.php?endpoint=Setfetch`
        );
        if (response.data.status) {
          setSettings(response.data.data);
          if (response.data.data.schoollogo) {
            setPreview(
              `${process.env.REACT_APP_API_URL}${response.data.data.schoollogo}`
            );
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchname();
  }, []);
  // ✅ Handle input change
  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };
  // ✅ Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSettings({ ...settings, schoollogo: file });
      setPreview(URL.createObjectURL(file));
    }
  };
  // ✅ Go back
  const handleback = () => {
    navigate("/StudentReg");
  };
  // ✅ Save updated settings
  const handleSave = () => {
    const formData = new FormData();
    formData.append("schoolname", settings.schoolname);
    formData.append("mobno", settings.mobno);
    formData.append("schooladd", settings.schooladd);

    if (settings.schoollogo instanceof File) {
      formData.append("schoollogo", settings.schoollogo);
    }
    axios
      .post(`${process.env.REACT_APP_API_URL}api.php?endpoint=Set`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        if (res.data.status) {
          Swal.fire({
            icon: "success",
            title: "Settings updated successfully!",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          Swal.fire("Error", res.data.message, "error");
        }
      })
      .catch((err) => {
        console.error(err);
        Swal.fire("Error", "Failed to update settings", "error");
      });
  };
  return (
    <div className="stu">
      <section className="sect">
        <h2>🏫 School Info Update</h2>
        <div className="regStu">
          <div className="selectors">
            <label className="label">School Name:</label>
            <input
              id="classreg"
              type="text"
              name="schoolname"
              value={settings.schoolname}
              onChange={handleChange}
            />
            <label className="label">Mobile No.:</label>
            <input
              id="classreg"
              type="text"
              name="mobno"
              value={settings.mobno}
              onChange={handleChange}
            />
            <label className="label">School Address:</label>
            <input
              id="classreg"
              type="text"
              name="schooladd"
              value={settings.schooladd}
              onChange={handleChange}
            />
            <label className="label">Upload School Logo:</label>
            <input
              id="classreg"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            {preview && (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "10px",
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <button onClick={handleSave} className="regbtn">
          💾 Save Changes
        </button>
        <button onClick={handleback} className="backbtn">
          ⬅ Back
        </button>
      </section>
    </div>
  );
}
