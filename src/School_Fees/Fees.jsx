import React, { useRef, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import "./Fees.css";
import axios from "axios";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
export const Fees = () => {
  const [schoolInfo, setSchoolInfo] = useState({
    schoolname: "",
    schooladd: "",
    mobno: "",
  });
  const [classes, setclasses] = useState([]);
  const [student, setstudent] = useState();
  const [MonthReport, setMonthReport] = useState([]);
  const [studentRelaxation, setStudentRelaxation] = useState([]);
  const [relaxationApplied, setRelaxationApplied] = useState(false);
  const [originalMonthReport, setOriginalMonthReport] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [submittedMonths, setsubmittedMonths] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [total, setTotal] = useState(0);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentDetail, setPaymentDetail] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const rollref = useRef();
  const studentref = useRef();
  const classref = useRef();
  const sessionref = useRef();
  const navi = useNavigate();
  const months = [
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
    "january",
    "february",
    "march",
  ];
  // Fetching Classes
  useEffect(() => {
    const classsession = sessionStorage.getItem("sessionkey");
    const fetchclasses = async () => {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}api.php?endpoint=StudentReg/fetch`,
          { classsession },
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );
        setclasses(response.data.result || []);
      } catch (error) {
        console.log("Error fetching classes:", error);
        setclasses([]);
      }
    };
    fetchclasses();
  }, []);
  // ✅ Fetching School Info
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}api.php?endpoint=getSchoolInfo`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
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
  // Fetch fee report and submitted months
  const handleCheck = async (e) => {
    e.preventDefault();
    let rollno = rollref.current.value;
    let studentname = studentref.current.value;
    let classid = classref.current.value;
    let classsession = sessionref.current.value;
    // Fetch already paid months
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}api.php?endpoint=Already-Submitted`,
        { rollno, studentname, classid, classsession },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      setsubmittedMonths(response.data.result || []);
    } catch (error) {
      console.log("Error fetching months:", error);
      setsubmittedMonths([]);
    }
    // Fetching fee report
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}api.php?endpoint=Check`,
        { rollno, studentname, classid: selectedClass, classsession },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.status) {
        console.log(response.data);
        setStudentRelaxation(response.data.student);
        setMonthReport(response.data.result);
        setOriginalMonthReport(response.data.result);
        toast.success("✅ Select the month(s) for the fees submission!");
      } else {
        setStudentRelaxation([]);
        setMonthReport([]);
        toast.error("❌ Invalid Access!");
      }
    } catch (error) {
      toast.error("⚠️ Server error, please try again later!");
      console.log("Error:", error);
    }
  };
  // Month selection & total
  const handleMonthSelect = (monthIndex) => {
    let newSelected = [...selectedMonths];
    if (selectedMonths.includes(monthIndex)) {
      if (monthIndex === selectedMonths[selectedMonths.length - 1]) {
        newSelected = selectedMonths.slice(0, -1);
      }
    } else {
      newSelected = [...selectedMonths, monthIndex];
    }
    setSelectedMonths(newSelected);
    if (MonthReport.length > 0) {
      const student = MonthReport[0];
      const sum = newSelected.reduce(
        (acc, idx) => acc + (parseFloat(student[months[idx]]) || 0),
        0
      );
      setTotal(sum);
    }
  };
  // Open payment popup
  const handleProceed = () => {
    if (selectedMonths.length === 0) {
      toast.warn("⚠️ Please select at least one month!");
      return;
    }
    setShowPaymentPopup(true);
  };
  // Submit payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receiverName) {
      toast.error("⚠️ Please Enter the Receiver's Name");
    }
    if (!paymentMode) {
      toast.error("⚠️ Please select a payment mode!");
      return;
    }
    if (
      (paymentMode === "UPI" || paymentMode === "Cheque") &&
      !paymentDetail.trim()
    ) {
      toast.error(
        `⚠️ Please enter ${paymentMode === "UPI" ? "UPI ID" : "Cheque No."}`
      );
      return;
    }
    const rollno = rollref.current.value;
    const studentname = studentref.current.value;
    const classid = classref.current.value;
    const classsession = sessionref.current.value;
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    const milliseconds = now.getMilliseconds().toString().padStart(3, "0");
    const timeStamp = `Date: ${date}, Time: ${time.replace(
      /(AM|PM)/,
      `.${milliseconds} $1`
    )}`;
    // Map selected months for PHP
    const selectedMonthsData = selectedMonths.map((idx) => {
      const monthRow = MonthReport[0]; // directly from your visible table
      console.log(monthRow.month)
      return {
        month_no: idx + 1,
        month_name: monthRow.month,
        classid: monthRow.class,
        classsession: monthRow.session,
        amount: parseFloat(monthRow[months[idx]]) || 0, // 👈 exact same amount shown in table
      };
    });

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}api.php?endpoint=Submitted`,
        {
          rollno,
          studentname,
          classid,
          classsession,
          months: selectedMonthsData,
          timeRecord: timeStamp,
          paymentMode,
          paymentDetail,
          receiverName,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.status) {
        const receiptNo = response.data.receipt_no;
        const totalAmount = response.data.total_amount;
        const submittedRecords = response.data.submitted_records;
        console.log(submittedRecords);
        Swal.fire({
          icon: "success",
          title: `✅ Fees Submitted Successfully. Total: ₹${totalAmount}`,
        });
        // Use backend data for PDF generation
        generatePDF(submittedRecords, totalAmount, receiptNo);
        // Reset UI
        setShowPaymentPopup(false);
        setPaymentMode("");
        setPaymentDetail("");
        setSelectedMonths([]);
        setTotal(0);
        handleCheck(e);
      } else {
        toast.error(`❌ ${response.data.message || "Submission failed"}`);
      }
    } catch (error) {
      console.log("Error details:", error);
      if (error.response) {
        toast.error(
          `❌ Server error: ${
            error.response.data.message || error.response.statusText
          }`
        );
      } else if (error.request) {
        toast.error("❌ No response from server. Check network connection.");
      } else {
        toast.error("❌ Request setup error");
      }
    }
  };
  // PDF generation with all backend data
  const generatePDF = (submittedRecords, totalAmount, receiptNo) => {
    if (!submittedRecords || submittedRecords.length === 0) {
      console.error("No submitted records found");
      return;
    }
    // Get the first record for student details (they are same for all months)
    const firstRecord = submittedRecords[0];
    console.log(firstRecord);
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(schoolInfo.schoolname || "Your School Name", pageWidth / 2, 20, {
      align: "center",
    });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(schoolInfo.schooladd || "School Address", pageWidth / 2, 27, {
      align: "center",
    });
    doc.text(
      `Mob: ${schoolInfo.mobno || "0000000000"} | www.${
        schoolInfo.schoolname
      }.in`,
      pageWidth / 2,
      32,
      { align: "center" }
    );
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      `FEE RECEIPT FOR ACADEMIC SESSION : ${firstRecord.classsession}`,
      pageWidth / 2,
      42,
      { align: "center" }
    );
    // Receipt Info
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Receipt No : ${receiptNo}`, 15, 52);
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
      `₹${record.amount.toFixed(2)}`,
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
    doc.text(`Total Rs. ${totalAmount.toFixed(2)}`, 15, finalY + 8);
    // Amount in Words
    doc.setFont("helvetica", "normal");
    doc.text(
      `Amount in Words: ${numToWords(totalAmount)} Only`,
      15,
      finalY + 15
    );
    // Payment Details Table
    autoTable(doc, {
      startY: finalY + 25,
      head: [["Pay Mode", "Ref. / UPI / Cheque No.", "Date", "Amount"]],
      body: [
        [
          firstRecord.pay_mode,
          firstRecord.payment_ref || "-",
          new Date().toLocaleDateString(),
          `₹${totalAmount.toFixed(2)}`,
        ],
      ],
      theme: "grid",
      styles: { halign: "center", fontSize: 10 },
      headStyles: { fillColor: [0, 123, 255] },
    });
    let endY = doc.lastAutoTable.finalY + 10;
    doc.text(`Received By : ${firstRecord.receivername || "-"}`, 15, endY + 5);
    // Footer
    doc.setFontSize(10);
    doc.text(`For ${schoolInfo.schoolname}`, pageWidth - 70, endY + 10);
    doc.setFontSize(8);
    doc.text(
      "This is a computer-generated receipt and does not require any signature.",
      pageWidth / 2,
      endY + 20,
      { align: "center" }
    );
    // Saving PDF
    doc.save(`fees_${firstRecord.rollno}_receipt_${receiptNo}.pdf`);
  };
  // Convert number to words
  const numToWords = (num) => {
    const a = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    if ((num = num.toString()).length > 9) return "Overflow";
    let n = ("000000000" + num)
      .substr(-9)
      .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = "";
    str +=
      n[1] != 0
        ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + " Crore "
        : "";
    str +=
      n[2] != 0
        ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + " Lakh "
        : "";
    str +=
      n[3] != 0
        ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + " Thousand "
        : "";
    str +=
      n[4] != 0
        ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + " Hundred "
        : "";
    str +=
      n[5] != 0
        ? (str != "" ? "and " : "") +
          (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) +
          ""
        : "";
    return str.trim();
  };

  // Fetching student
  const handleFetchStudent = async () => {
    toast.info("ℹ️ Fetching Student...");
    const rollno = rollref.current.value;
    const classid = classref.current.value;
    const classsession = sessionref.current.value;
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}api.php?endpoint=fetchStudent`,
        { rollno, classid, classsession },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.result && response.data.result.length > 0) {
        setstudent(response.data.result[0].studentname);
      } else {
        Swal.fire({
          icon: "warning",
          title: "No such student is registered. Please Register the Student.",
        });
        navi("/StudentReg/Reg");
      }
    } catch (error) {
      toast.error("⚠️ Server error, please try again later!");
    }
  };
  return (
    <div className="fees-container">
      <ToastContainer position="top-right" autoClose={500} />
      <h2>Fees Submission</h2>
      <form className="reg-form">
        <div className="form-section">
          <h3>Student Info</h3>
          <div className="form-grid">
            <div>
              <label>Class</label>
              <select
                ref={classref}
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.classno} value={cls.classid}>
                    {cls.class}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Session</label>
              <input
                type="text"
                ref={sessionref}
                value={sessionStorage.getItem("sessionkey")}
                readOnly
                required
              />
            </div>
            <div>
              <label>Roll No.</label>
              <input
                type="text"
                disabled={!selectedClass}
                ref={rollref}
                placeholder="Enter Roll No."
                required
                onBlur={handleFetchStudent}
              />
            </div>
            <div>
              <label>Student's Name</label>
              <input
                type="text"
                ref={studentref}
                value={student || ""}
                placeholder="Enter Student's Name"
                readOnly
                required
              />
            </div>
          </div>
          <button type="button" className="submit-btn" onClick={handleCheck}>
            Check Fees
          </button>
        </div>

        {MonthReport.length > 0 && (
          <div className="report-results">
            <h3>📊 Fees Table</h3>
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Select</th>
                    <th>Class</th>
                    <th>Session</th>
                    <th>Fees</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m, i) => {
                    const student = MonthReport[0];
                    const isPaid = submittedMonths.some(
                      (sm) => sm.month_no === i + 1 && sm.status === "Paid"
                    );
                    const prevMonthPaid =
                      i === 0
                        ? true
                        : submittedMonths.some(
                            (sm) => sm.month_no === i && sm.status === "Paid"
                          ) || selectedMonths.includes(i - 1);
                    return (
                      <tr key={i}>
                        <td>{m.charAt(0).toUpperCase() + m.slice(1)}</td>
                        <td>
                          {isPaid ? (
                            <span
                              style={{ color: "green", fontWeight: "bold" }}
                            >
                              ✅ Paid
                            </span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={selectedMonths.includes(i)}
                              onChange={() => handleMonthSelect(i)}
                              disabled={!prevMonthPaid}
                            />
                          )}
                        </td>
                        <td>{student.class}</td>
                        <td>{student.classsession}</td>
                        <td>{student[m]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ✅ Show Relaxation Info */}
            {studentRelaxation && studentRelaxation.relaxation && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  background: "#f9f9f9",
                  width: "fit-content",
                }}
              >
                <h4>
                  🎯 Relaxation Applied:{" "}
                  <span style={{ color: "green", fontWeight: "bold" }}>
                    {studentRelaxation.relaxation}%
                  </span>
                </h4>
                <button
                  type="button"
                  className="downloadbtn"
                  onClick={() => {
                    const relaxationPercent =
                      parseFloat(studentRelaxation.relaxation) || 0;

                    if (!relaxationPercent || relaxationPercent <= 0) {
                      toast.info(
                        "ℹ️ No relaxation percentage set for this student."
                      );
                      return;
                    }

                    if (!relaxationApplied) {
                      // Apply relaxation
                      const updatedReport = MonthReport.map((student) => {
                        const updated = { ...student };
                        months.forEach((m) => {
                          const originalFee = parseFloat(student[m]) || 0;
                          const discountedFee =
                            originalFee -
                            (originalFee * relaxationPercent) / 100;
                          updated[m] = discountedFee.toFixed(2);
                        });
                        return updated;
                      });

                      setMonthReport(updatedReport);
                      if (selectedMonths.length > 0) {
                        const totalDiscounted = selectedMonths.reduce(
                          (acc, idx) => {
                            const fee =
                              parseFloat(updatedReport[0][months[idx]]) || 0;
                            return acc + fee;
                          },
                          0
                        );
                        setTotal(totalDiscounted);
                      }
                      setRelaxationApplied(true);
                      toast.success(
                        `✅ ${relaxationPercent}% relaxation applied.`
                      );
                    } else {
                      // Remove relaxation (restore original)
                      setMonthReport(originalMonthReport);
                      if (selectedMonths.length > 0) {
                        const totalOriginal = selectedMonths.reduce(
                          (acc, idx) => {
                            const fee =
                              parseFloat(originalMonthReport[0][months[idx]]) ||
                              0;
                            return acc + fee;
                          },
                          0
                        );
                        setTotal(totalOriginal);
                      }
                      setRelaxationApplied(false);
                      toast.info("❎ Relaxation removed.");
                    }
                  }}
                >
                  {relaxationApplied ? "Remove Relaxation" : "Apply Relaxation"}
                </button>
              </div>
            )}
            {/* ✅ Show Total and Proceed */}
            {selectedMonths.length > 0 && (
              <div className="total-section">
                <h3>Total Fees: ₹{total}</h3>
                <button
                  className="downloadbtn"
                  type="button"
                  onClick={handleProceed}
                >
                  Proceed to Payment
                </button>
              </div>
            )}
          </div>
        )}
      </form>

      {/* Payment Popup */}
      {showPaymentPopup && (
        <div className="payment-popup">
          <h3>Payment Details</h3>
          <div className="payment-fields">
            <label>Payment Mode:</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="">Select Mode</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
            </select>
            {(paymentMode === "UPI" || paymentMode === "Cheque") && (
              <input
                type="text"
                placeholder={
                  paymentMode === "UPI" ? "Enter UPI ID" : "Enter Cheque No."
                }
                value={paymentDetail}
                onChange={(e) => setPaymentDetail(e.target.value)}
              />
            )}
            {(paymentMode === "Cheque" || paymentMode === "Cash") && (
              <input
                type="text"
                placeholder="Enter Receiver Name"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                required
              />
            )}
          </div>
          <div className="popup-actions">
            <button className="downloadbtn" onClick={handleSubmit}>
              Submit Payment
            </button>
            <button
              className="backbtn"
              onClick={() => setShowPaymentPopup(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
