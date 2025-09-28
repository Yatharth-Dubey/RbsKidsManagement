import React, { useEffect, useRef, useState } from "react";
import "./Report.css";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import Swal from 'sweetalert2'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const Report = () => {
  const [view, setView] = useState("class"); // "class" | "student" | "fee" | "Monthfee"
  const [studentReport, setStudentReport] = useState([]);
  const [monthReport, setMonthReport] = useState([]);
  const [classReport, setClassReport] = useState([]);
  const [classes, setClasses] = useState([]);
  const [feeStatus, setFeeStatus] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const classref = useRef();
  const monthref = useRef();

  const months = [
    "january","february","march","april",
    "may","june","july","august",
    "september","october","november","december"
  ];

  useEffect(() => {
    let classsession = sessionStorage.getItem("sessionkey");
    const fetchClasses = async () => {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/StudentReg/fetch`,
          { classsession }, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},}
        );
        setClasses(response.data.result || []);
      } catch (error) {
        console.log("Error fetching classes:", error);
        setClasses([]);
      }
    };
    fetchClasses();
  }, []);

  const handleClass = async () => {
    let classsession = sessionStorage.getItem("sessionkey");
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/StudentReg/fetch`,
        { classsession }, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},}
      );
      if (response.data.status === "yes") {
        setClassReport(response.data.result);
        setView("class");
      } else {
        toast.error("⚠️ No Class Registered!");
        setClassReport([]);
      }
    } catch (error) {
      toast.error("⚠️ Server error, please try again later!");
      console.error("Error:", error);
    }
  };

  const handleFetchStudent = async (classid, classsession) => {
    setSelectedClass({ classid, classsession });
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/FetchStudents`,
        { classid, classsession }, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},}
      );
      if (response.data.status === "yes") {
        setStudentReport(response.data.result);
        setView("student");
      } else {
        toast.error("⚠️ No Registered Student Found!");
      }
    } catch (error) {
      toast.error("⚠️ Server error, please try again later!");
      console.error("Error:", error);
    }
  };

  const handleMonthFeeStatus = async () => {
    const classid = classref.current.value;
    const classsession = sessionStorage.getItem("sessionkey");
    const month_name = monthref.current.value;
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/FeeMonthStatus`,
        { classid, classsession, month_name }, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},}
      );
      setSelectedClass({ classid, classsession });
      if (response.data.status === "yes") {
        setMonthReport(response.data.result);
        setView("Monthfee");
      }
    } catch (error) {
      toast.error("⚠️ Server error, please try again later!");
    }
  };

  const handleReceipt = async (rollno, studentname, classid, classsession) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/FeesReceipt`,
        { rollno, studentname, classid, classsession }, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},}
      );
      if (response.data.status === "yes") {
        const { student, fees } = response.data;
        const paidFees = fees.filter((f) => f.status === "Paid");

        if (paidFees.length === 0) {
          toast.error("⚠️ No paid fees found for this student!");
          return;
        }

        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("RBS Public School", 105, 13, { align: "center" });
        doc.setFontSize(18);
        doc.text("Fee Receipt", 105, 22, { align: "center" });

        doc.setFontSize(12);
        doc.text(`Roll No: ${student.rollno}`, 20, 32);
        doc.text(`Student Name: ${student.studentname}`, 20, 40);
        doc.text(`Class: ${student.classid}`, 20, 50);
        doc.text(`Session: ${student.classsession}`, 20, 60);

        const tableData = paidFees.map((f) => [
          f.month_name,
          f.amount,
          f.status,
          f.timeRecord,
        ]);

        autoTable(doc, {
          startY: 70,
          head: [["Month", "Amount", "Status", "Date"]],
          body: tableData,
          theme: "grid",
          styles: { halign: "center" },
          headStyles: { fillColor: [41, 128, 185] },
          didParseCell: function (data) {
            if (data.column.index === 1 && data.cell.section === "body") {
              data.cell.styles.textColor = [0, 128, 0];
            }
          },
        });

        doc.setFontSize(10);
        doc.text(
          "This is a system-generated receipt. School stamp necessary.",
          105,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
        Swal.fire({icon: "success", title: "Receipt has be downloaded!"});
        doc.save(`FeeReceipt_${student.studentname}_${student.rollno}.pdf`);
      } else {
        toast.error("⚠️ " + response.data.message);
      }
    } catch (error) {
      toast.error("⚠️ Server error, please try again later!");
      console.log("Error:", error);
    }
  };

  const handleFeeStatus = async (rollno, studentname, classid, classsession) => {
    setSelectedStudent({ rollno, studentname, classid, classsession });
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/FeeStatusFetch`,
        { rollno, studentname, classid, classsession }, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},}
      );
      if (response.data.status === "yes") {
        setFeeStatus(response.data.result);
        setView("fee");
      } else {
        toast.error("⚠️ No fee records found!");
        setFeeStatus(null);
      }
    } catch (error) {
      toast.error("⚠️ Server error, please try again later!");
      console.error("Error:", error);
    }
  };
  const handleMonthRowReceipt = (rollno, studentname, classid, classsession, month_name, amount) => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("RBS Public School", 105, 13, { align: "center" });
  doc.setFontSize(18);
  doc.text("Fee Receipt", 105, 22, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Roll No: ${rollno}`, 20, 32);
  doc.text(`Student Name: ${studentname}`, 20, 40);
  doc.text(`Class: ${classid}`, 20, 50);
  doc.text(`Session: ${classsession}`, 20, 60);
  doc.text(`Month: ${month_name}`, 20, 70);
  doc.text(`Amount Paid: ${amount}`, 20, 80);

  doc.setFontSize(10);
  doc.text(
    "This is a system-generated receipt. School stamp necessary.",
    105,
    doc.internal.pageSize.height - 10,
    { align: "center" }
  );

  doc.save(`FeeReceipt_${studentname}_${month_name}.pdf`);
  Swal.fire({ icon: "success", title: "Receipt downloaded!" });
};

  return (
    <div>
      <ToastContainer position="top-right" autoClose={2000} />
      <div className="Reportslate">
        <div className="Reportbox">
          <h3 className="label">®️ View Registered Classes</h3>
          <br />
          <button className="regbtn" onClick={handleClass}>
            Show
          </button>
        </div>
        <div className="Reportbox">
          <h3 className="label">🔍 Fees Report</h3>
          <br />
          <select
            className="select_options"
            ref={classref}
            required
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls.classno} value={cls.class}>
                {cls.class}
              </option>
            ))}
          </select>
          <select
            className="select_options"
            ref={monthref}
            required
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">Select Month</option>
            {months.map((mth, idx) => (
              <option key={idx} value={mth}>
                {mth}
              </option>
            ))}
          </select>
          <button className="regbtn" onClick={handleMonthFeeStatus}>
            Check
          </button>
        </div>
      </div>

      <div className={`class-registered ${["Monthfee","fee"].includes(view) ? "large" : ""}`}>
        {view === "class" && classReport.length > 0 && (
          <>
            <br />
            <h3>📊 Registered Classes</h3>
            <br />
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Sr No.</th>
                    <th>Class</th>
                    <th>Session</th>
                  </tr>
                </thead>
                <tbody>
                  {classReport.map((student, idx) => (
                    <tr
                      key={idx}
                      onClick={() =>
                        handleFetchStudent(student.class, student.classsession)
                      }
                    >
                      <td>{student.classno}</td>
                      <td>{student.class}</td>
                      <td>{student.classsession}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view === "Monthfee" && (
          <>
            <br />
            <h3>
              📊 Month Fees Status ({selectedClass.classid} - {selectedClass.classsession})
            </h3>
            <br />
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Roll No.</th>
                    <th>Student Name</th>
                    <th>Month</th>
                    <th>Time and Date</th>
                    <th>Fees Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monthReport.map((mth, idx) => (
                    <tr key={idx}>
                      <td>{mth.rollno}</td>
                      <td>{mth.studentname}</td>
                      <td>{mth.month_name}</td>
                      <td>{mth.timeRecord}</td>
                      <td style={{ color: mth.status === "Paid" ? "green" : "red" }}>
                        {mth.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✅ Responsive Pie chart */}
            {monthReport.length > 0 && (() => {
              const paidCount = monthReport.filter((m) => m.status === "Paid").length;
              const unpaidCount = monthReport.filter((m) => m.status !== "Paid").length;
              const data = [
                { name: "Paid", value: paidCount },
                { name: "Unpaid", value: unpaidCount },
              ];
              const COLORS = ["#4caf50", "#f44336"];
              return (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label
                      >
                        {data.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </>
        )}

        {view === "student" && (
          <>
            <br />
            <button className="backbtn" onClick={() => setView("class")}>
              ⬅ Back to Classes
            </button>
            <br />
            <h3>
              📊 Registered Students ({selectedClass.classid} - {selectedClass.classsession})
            </h3>
            <br />
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Roll No.</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Session</th>
                  </tr>
                </thead>
                <tbody>
                  {studentReport.map((student, idx) => (
                    <tr
                      key={idx}
                      onClick={() =>
                        handleFeeStatus(
                          student.rollno,
                          student.studentname,
                          student.class,
                          student.classsession
                        )
                      }
                    >
                      <td>{student.rollno}</td>
                      <td>{student.studentname}</td>
                      <td>{student.class}</td>
                      <td>{student.classsession}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <br />
            </div>
          </>
        )}

        {view === "fee" && (
          <>
            <br />
            <button className="backbtn" onClick={() => setView("student")}>
              ⬅ Back to Students
            </button>
            <br />
            <button
              onClick={() =>
                handleReceipt(
                  selectedStudent.rollno,
                  selectedStudent.studentname,
                  selectedStudent.classid,
                  selectedStudent.classsession
                )
              }
              className="downloadbtn"
            >
              ⬇️ Get Fees Receipt
            </button>
            <br />
            <h3>
              📊 Fees Status for {selectedStudent.studentname} ({selectedStudent.rollno}) (
              {selectedStudent.classid} - {selectedStudent.classsession})
            </h3>
            <br />
            <div className="table-container">
              {Array.isArray(feeStatus) && feeStatus.length > 0 ? (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeStatus.map((student, idx) => (
                      <tr key={idx}>
                        <td>{student.month_name}</td>
                        <td>{student.amount}</td>
                        <td style={{color: student.status === "Paid" ? "green" : "red",}}>
                          {student.status}
                        </td>
                        <td>{student.status === "Paid" ? student.timeRecord : "⚠️ Not Available"}</td>
                        <td>
                          {student.status === "Paid" && (
                            <button
                              className="download-icon"
                              onClick={() =>
                                handleMonthRowReceipt(
                                  student.rollno,
                                  student.studentname,
                                  selectedClass.classid,
                                  selectedClass.classsession,
                                  student.month_name,
                                  student.amount )}
                             title="Download Fee Receipt">💾</button>)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: "red" }}>{feeStatus?.message}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
