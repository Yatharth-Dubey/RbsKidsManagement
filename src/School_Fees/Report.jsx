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
  const [schoolInfo, setSchoolInfo] = useState({
      schoolname: "",
      schooladd: "",
      mobno: ""
    });
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
    "april", "may","june","july","august","september","october","november",
    "december","january","february","march"
  ];
  //school info fetching
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
          console.warn("No school info found");
        }
      } catch (error) {
        console.error("Error fetching school info:", error);
      }
    };
    fetchSchoolInfo();
  }, []);
  //class selector option fetchin
  useEffect(() => {
    let classsession = sessionStorage.getItem("sessionkey");
    const fetchClasses = async () => {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}api.php?endpoint=StudentReg/fetch`,
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
  //single month fees status fetching
  const handleMonthFeeStatus = async () => {
    const classid = classref.current.value;
    const classsession = sessionStorage.getItem("sessionkey");
    const month_name = monthref.current.value;
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}api.php?endpoint=FeeMonthStatus`,
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
  //fetching classes with show btn
  const handleClass = async () => {
    let classsession = sessionStorage.getItem("sessionkey");
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}api.php?endpoint=StudentReg/fetch`,
        { classsession }, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},}
      );
      if (response.data.status === true) {
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
  //student details fetching on class click
  const handleFetchStudent = async (classid, classsession) => {
    setSelectedClass({ classid, classsession });
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}api.php?endpoint=FetchStudents`,
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
  //fetching paid month on student click
  const handleFeeStatus = async (rollno, studentname, classid, classsession) => {
    setSelectedStudent({ rollno, studentname, classid, classsession });
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}api.php?endpoint=FeeStatusFetch`,
        { rollno, studentname, classid, classsession }, {headers:{Authorization: `Bearer ${sessionStorage.getItem("token")}`},}
      );
      if (response.data.status === true) {
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
  // Number to words function
  const numToWords = (num) => {
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    if ((num = num.toString()).length > 9) return "Overflow";
    let n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = "";
    str += n[1] != 0 ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + " Crore " : "";
    str += n[2] != 0 ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + " Lakh " : "";
    str += n[3] != 0 ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + " Thousand " : "";
    str += n[4] != 0 ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + " Hundred " : "";
    str += n[5] != 0 ? (str != "" ? "and " : "") + (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) + "" : "";
    return str.trim() + " Rupees";
  };
  //generating fees slip
  const generatePDF = async (receipt_no) => {
    try{
      const response = await axios.post(`${process.env.REACT_APP_API_URL}api.php?endpoint=FeesFetchSlip`, {receipt_no}, {headers:{Authorization:`Bearer ${sessionStorage.getItem("token")}`}});
      if(response.data.status){
        const {submittedRecords, totalAmount, receipt_no} = response.data;
        console.log({ submittedRecords, totalAmount, receipt_no });
        if (!submittedRecords || submittedRecords.length === 0) {
          toast.error("No submitted records found");
          return;
        }
        // ✅ Calculate total automatically from months
        const calculatedTotal = submittedRecords.reduce(
          (sum, record) => sum + parseFloat(record.amount || 0),
          0
        );
        const finalTotal = totalAmount ? parseFloat(totalAmount) : calculatedTotal;

        const firstRecord = submittedRecords[0];
        const doc = new jsPDF("p", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        // Header

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text(schoolInfo.schoolname || "Your School Name", pageWidth / 2, 20, { align: "center" });
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(schoolInfo.schooladd || "School Address", pageWidth / 2, 27, { align: "center" });
        doc.text(`Mob: ${schoolInfo.mobno || "0000000000"} | www.${schoolInfo.schoolname}.in`, pageWidth / 2, 32, { align: "center" });
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`FEE RECEIPT FOR ACADEMIC SESSION : ${firstRecord.classsession}`, pageWidth / 2, 42, { align: "center" });
        // Receipt Info
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Receipt No : ${receipt_no}`, 15, 52);
        doc.text(`Date : ${new Date().toLocaleDateString()}`, pageWidth - 70, 52);
        doc.text(`Name : ${firstRecord.studentname}`, 15, 60);
        doc.text(`Father's Name : ${firstRecord.fathername}`, 15, 68);
        doc.text(`Class : ${firstRecord.classid}`, 15, 76);
        doc.text(`Roll No : ${firstRecord.rollno}`, pageWidth - 70, 76);
        // Fee Details Table
        let tableBody = submittedRecords.map((record, index) => [
          `${index + 1}`,
          `${record.month_name.toUpperCase()}`,
          `Tuition Fee`,
          `₹${record.amount.toFixed(2)}`
        ]);
        autoTable(doc, {
          startY: 85,
          head: [["S.No", "Month", "Fee Head", "Amount"]],
          body: tableBody,
          theme: "grid",
          styles: { halign: "center", fontSize: 10 },
          headStyles: { fillColor: [0, 123, 255] },
        });
        let finalY = doc.lastAutoTable.finalY + 5;
        // Total Amount
        doc.setFont("helvetica", "bold");
        doc.text(`Total Rs. ${finalTotal.toFixed(2)}`, 15, finalY + 8);

        // ✅ Amount in Words
        doc.setFont("helvetica", "normal");
        doc.text(`Amount in Words: ${numToWords(finalTotal)} Only`, 15, finalY + 15);
        // Payment Details Table
        autoTable(doc, {
          startY: finalY + 25,
          head: [["Pay Mode", "Ref. / UPI / Cheque No.", "Date", "Amount"]],
          body: [[
            firstRecord.pay_mode,
            firstRecord.payment_ref || "-",
            new Date().toLocaleDateString(),
            `₹${finalTotal.toFixed(2)}`
          ]],
          theme: "grid",
          styles: { halign: "center", fontSize: 10 },
          headStyles: { fillColor: [0, 123, 255] },
        });
        let endY = doc.lastAutoTable.finalY + 10;
        // Footer
        doc.setFontSize(10);
        doc.text(`For ${schoolInfo.schoolname}`, pageWidth - 70, endY + 10);
        doc.setFontSize(8);
        doc.text("This is a computer-generated receipt and does not require any signature.", pageWidth / 2, endY + 20, { align: "center" });
        // Save PDF
        doc.save(`fees_${firstRecord.rollno}_receipt_${receipt_no}.pdf`);
      }
    }catch(error){
      toast.error("⚠️ Server error, please try again later!");
      console.error("Error:", error);
    }
    // Get the first record for student details (they are same for all months)
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
                    <th>Amount</th>
                    <th>Fees Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monthReport.map((mth, idx) => (
                    <tr key={idx}>
                      <td>{mth.rollno}</td>
                      <td>{mth.studentname}</td>
                      <td>{mth.month_name}</td>
                      <td>₹{mth.amount}</td>
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
                      <th>Receipt No.</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeStatus.map((student, idx) => (
                      <tr key={idx}>
                        <td>{student.month_name}</td>
                        <td>₹{student.amount}</td>
                        <td style={{color: student.status === "Paid" ? "green" : "red",}}>
                          {student.status}
                        </td>
                        <td>{student.status === "Paid" ? student.timeRecord : "⚠️ Not Available"}</td>
                        <td>{student.receipt_no}</td>
                        <td>
                          {student.status === "Paid" && (
                            <button
                              className="download-icon"
                              onClick={() => generatePDF(student.receipt_no)}
                              title="Download Monthly Receipt"
                            >
                              💾
                            </button>
                          )}
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