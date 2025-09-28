const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());
const corsOptions = {
  origin: ['http://localhost', 'capacitor://localhost', 'http://192.168.29.32:8081'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));


const Secret_key = "YatharthDubey";

const data = mysql.createPool({
    host:"localhost",
    user:"root",
    password:"YATdub147@",
    database:"rbs",
    multipleStatements: true
});

app.post("/FeesReceipt", verifyToken, (req, res) => {
  const { rollno, studentname, classid, classsession } = req.body;

  // Required field validation
  const required = ["rollno", "studentname", "classid", "classsession"];
  for (let field of required) {
    if (!req.body[field]) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  const checkSql = `
    SELECT * 
    FROM submitted_months 
    WHERE rollno = ? AND studentname = ? AND classid = ? AND classsession = ?
  `;

  data.query(checkSql, [rollno, studentname, classid, classsession], (err, result) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database query failed" });
    }

    if (result.length > 0) {
      return res.json({
        status: "yes",
        student: { rollno, studentname, classid, classsession },
        fees: result
      });
    } else {
      return res.json({
        status: "no",
        message: "No fee records found for this student."
      });
    }
  });
});

app.post("/StudentReg/resetDatabase", verifyToken, (req, res) => {
  const tables = ["students", "fees", "classes", "submitted_months"];
  // Create one big SQL string with semicolons
  const delquery = tables.map(table => `TRUNCATE TABLE ${table}`).join("; ");
  data.query(delquery, (err, result) => {
    if (err) {
      console.error("Error resetting database:", err);
      return res
        .status(500)
        .json({ status: false, message: "Database reset failed!" });
    }
    return res.json({
      status: true,
      message: "Database reset successful!",
    });
  });
});


app.post("/Submitted", verifyToken, (req, res) => {
  const { rollno, studentname, classid, classsession, selectedMonths, total, timeRecord } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (!rollno || !studentname || !classid || !classsession) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const checksql = `SELECT COUNT(*) as count 
                    FROM submitted_months 
                    WHERE rollno=? AND studentname=? AND classid=? AND classsession=?`;
  data.query(checksql, [rollno, studentname, classid, classsession], (err, result) => {
    if (err) {
      console.error("❌ DB Error:", err);
      return res.status(500).json({ error: "Database Error" });
    }
    const months = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    if (result[0].count === 0) {
      // 👉 First submission, insert all 12 months with Paid/Pending
      const feesql = "SELECT * FROM fees WHERE class = ? AND classsession = ?";
      data.query(feesql, [classid, classsession], (errFee, feeResult) => {
        if (errFee || feeResult.length === 0) {
          console.error("❌ Fee Lookup Error:", errFee);
          return res.status(500).json({ error: "Fees not found" });
        }
        const feeRow = feeResult[0]; // contains january, february...
        const values = months.map((m, idx) => {
          const monthNo = idx + 1;
          const feeAmount = parseFloat(feeRow[m.toLowerCase()]) || 0;
          const status = selectedMonths.includes(monthNo) ? "Paid" : "Pending";
          return [
            rollno, studentname, classid, classsession,
            monthNo, m, feeAmount, status, timeRecord, ip
          ];
        });
        const sql = `INSERT INTO submitted_months 
          (rollno, studentname, classid, classsession, month_no, month_name, amount, status, timeRecord, ipAddress) 
          VALUES ?`;
        data.query(sql, [values], (err2) => {
          if (err2) {
            console.error("❌ Insert Error:", err2);
            return res.status(500).json({ error: "Database insert error" });
          }
          res.json({ status: true, message: "✅ First submission done", total });
        });
      });
    } else {
      // 👉 Update only the newly selected months
      const updatesql = `UPDATE submitted_months 
                         SET status = 'Paid', timeRecord = ?, ipAddress = ? 
                         WHERE rollno = ? AND studentname = ? AND classid = ? AND classsession = ? 
                         AND month_no IN (?)`;
      data.query(updatesql, [timeRecord, ip, rollno, studentname, classid, classsession, selectedMonths], (err3) => {
        if (err3) {
          console.error("❌ Update Error:", err3);
          return res.status(500).json({ error: "Database update error" });
        }
        res.json({ status: true, message: "✅ Fees updated successfully", total });
      });
    }
  });
});
app.post("/fees-structure", verifyToken, (req, res) => {
    const {
        classno, classid, classsession,
        january, february, march, april, may, june,
        july, august, september, october, november, december,
        timeRecord
    } = req.body;

    const ip = req.headers['x-forwarded-for'] || req.socket.localAddress;

    // First check if the class + session already exists
    const checkQuery = "SELECT * FROM fees WHERE class = ? AND classsession = ?";
    data.query(checkQuery, [classid, classsession], (err, rows) => {
        if (err) {
            console.log("DB Error", err);
            return res.status(500).send({ status: false, message: "Database Error" });
        }
        if (rows.length > 0) {
            return res.status(200).send({
                status: false,
                message: "Fees structure already exists for this class and session"
            });
        }else{
          const insertQuery = `
            INSERT INTO fees 
            (classno, class, classsession, january, february, march, april, may, june,
             july, august, september, october, november, december, timeRecord, ipAddress) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            data.query(insertQuery, [
                classno, classid, classsession,
                january, february, march, april, may, june,
                july, august, september, october, november, december,
                timeRecord, ip
            ], (err, result) => {
                if (err) {
                    console.log("DB Error", err);
                    return res.status(500).send({ status: false, message: "Database Error" });
                }
                console.log("DB Result:", result);
                res.send({
                    status: true,
                    message: "Fees Structure registered successfully",
                    id: result.insertId
                });
            });
        }
    });
});

app.post("/view-structure", verifyToken, (req, res) => {
    const {classid, classsession} = req.body;
    const my = "select * from fees where class = ? and classsession = ?";
    data.query(my, [classid, classsession], function(err, result){
        if(err){
            console.log("DB Error", err);
            return res.status(500).send({status: "False", message: "Database Error"});
        }
        console.log("DB Result:", result);
        if (result.length > 0) {
        res.send({
            status: "yes",
            result: result   // ✅ send full array
        });
        } else {
        res.send({
            status: "no",
            result: []       // ✅ empty array instead of undefined
            });
        }
    });
});

app.post("/Already-Submitted", verifyToken, (req, res) => {
  const { rollno, studentname, classid, classsession } = req.body;
  const sql = `select month_no, month_name, amount, status from submitted_months where rollno = ? and studentname = ? and classid = ? and classsession = ? order by month_no asc`;
  data.query(sql, [rollno, studentname, classid, classsession], function (err, result) {
    if (err) {
      console.log("❌ DB Error:", err.sqlMessage);
      return res.status(500).send({ status: "False", message: "Database Error" });
    }
    if (result.length === 0) {
      return res.send({ status: "empty", result: [] });
    }
    res.send({ status: "yes", result });
  });
});
app.post("/FetchStudents", verifyToken, (req, res) => {
  const {classid, classsession} = req.body;
  const my = "select * from students where class = ? and classsession = ?";
  data.query(my, [classid, classsession], function(err, result){
    if(err){
      console.log("DB Error", err);
      return res.status(500).send({status: "False", message: "Database Error"});
    }
    console.log("DB Result:", result);
    if (result.length === 0) {
      return res.send({
        status: "no",
        message: "⚠️ No Registered Student Found!"
      });
    }
    res.send({
      status: "yes",
      result: result
    });
  });
});
app.post("/FeeMonthStatus", verifyToken, (req, res) => {
  const { classid, classsession, month_name } = req.body;
  const studentQuery = "SELECT rollno, studentname FROM students WHERE class = ? AND classsession = ?";
  data.query(studentQuery, [classid, classsession], function (err, students) {
    if (err) {
      console.log("DB Error (students):", err);
      return res.status(500).send({ status: "False", message: "Database Error" });
    }
    if (students.length === 0) {
      return res.send({ status: "no", message: "No students found for this class/session" });
    }
    const monthQuery = "SELECT rollno, studentname, month_name, status, timeRecord FROM submitted_months WHERE classid = ? AND classsession = ? AND month_name = ?";
    data.query(monthQuery, [classid, classsession, month_name], function (err, months) {
      if (err) {
        console.log("DB Error (months):", err);
        return res.status(500).send({ status: "False", message: "Database Error" });
      }
      let result = students.map((stu) => {
        let submitted = months.find((m) => m.rollno == stu.rollno);
        if (submitted) {
          return {
            rollno: stu.rollno,
            studentname: stu.studentname,
            month_name: submitted.month_name,
            status: submitted.status,
            timeRecord: submitted.timeRecord
          };
        } else {
          return {
            rollno: stu.rollno,
            studentname: stu.studentname,
            month_name: month_name,
            status: "Pending",
            timeRecord: "⚠️ Not Available"
          };
        }
      });
      console.log("Final Result:", result);
      return res.send({
        status: "yes",
        result: result,
      });
    });
  });
});
app.post("/FeeStatusFetch", verifyToken, (req, res) => {
  const {rollno, studentname, classid, classsession} = req.body;
  const my = "select * from submitted_months where rollno = ? and studentname = ? and classid = ? and classsession = ?";
  data.query(my, [rollno, studentname, classid, classsession], function(err, result){
    if(err){
      console.log("DB Error", err);
      return res.status(500).send({status: "False", message: "Database Error"});
    }
    console.log("DB Result:", result);
    if (result.length === 0) {
      return res.send({
        status: "no",
        message: "⚠️ No fee records found!"
      });
    }
    res.send({
      status: "yes",
      result: result
    });
  });
});
app.post("/fetchStudent", verifyToken, (req, res) => {
  const {rollno, classid, classsession} = req.body;
  const my = "select studentname from students where rollno = ? and class = ? and classsession = ?";
  data.query(my, [rollno, classid, classsession], function(err, result){
    if(err){
      console.log("DB Error", err);
      return res.status(500).send({status: "False", message: "Database Error"});
    }
    console.log("DB Result:", result);
      res.send({
        status: "yes",
        result: result
      });
  });
});
app.post("/StudentReg/fetch", verifyToken, (req, res) => {
    const classsession = req.body.classsession;
    const my = "select * from classes where classsession = ?";
    data.query(my, [classsession], function(err, result){
        if(err){
          console.log("DB Error", err);
          return res.status(500).send({status: "False", message: "Database Error"});
        }
        console.log("DB Result:", result);
        res.send({
            status: "yes",
            result: result
        });
    });
});
app.post("/reg/bulk", verifyToken, async (req, res) => {
  const { students } = req.body;
  try {
    for (let stu of students) {
      let now = new Date();
      let time = now.toLocaleTimeString();
      let date = now.toLocaleDateString();
      let milliseconds = now.getMilliseconds().toString().padStart(3, "0");
      let timeStamp = `Date: ${date}, Time: ${time}.${milliseconds}`;
      let ipAddr = req.ip || "127.0.0.1";
      // First check if duplicate exists
      const duplicate = await new Promise((resolve, reject) => {
        data.query(
          `SELECT * FROM students WHERE rollno = ? AND studentname = ? AND class = ? AND classsession = ?`,
          [stu.rollno, stu.studentname, stu.class, stu.classsession],
          (err, results) => {
            if (err) return reject(err);
            resolve(results);
          }
        );
      });
      if (duplicate.length > 0) {
        console.log(`❌ Duplicate skipped: ${stu.rollno} - ${stu.studentname}`);
        continue; // Skip this student, do not insert
      }
      // Insert if no duplicate
      const studentData = {
        rollno: stu.rollno,
        studentname: stu.studentname,
        motherName: stu.mothername,
        fatherName: stu.fathername,
        class: stu.class,
        classsession: stu.classsession,
        residence: stu.address,
        phone: stu.phone,
        timeRecord: timeStamp,
        ipAddress: ipAddr,
      };
      await new Promise((resolve, reject) => {
        data.query("INSERT INTO students SET ?", studentData, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    }
    res.json({ status: true, message: "✅ Bulk Upload Completed (Duplicates Skipped)" });
  } catch (err) {
    console.error("Bulk upload error:", err);
    res.status(500).json({ status: false, error: err.message });
  }
});
app.post("/StudentReg/register", verifyToken, (req, res) => {
    const { classid, classsession, timeRecord } = req.body;
    console.log(classid, classsession, timeRecord);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // First check if class + session already exists
    const checkQuery = "SELECT * FROM classes WHERE class = ? AND classsession = ?";
    data.query(checkQuery, [classid, classsession], (err, results) => {
        if (err) {
            console.log("DB Error", err);
            return res.status(500).send({ status: false, message: "Database Error" });
        }
        if (results.length > 0) {
            // Duplicate found
            return res.status(200).send({
                status: false,
                message: "This class with the given session is already registered"
            });
        }
        // Insert new class
        const insertQuery = "INSERT INTO classes (class, classsession, timeRecord, ipAddress) VALUES (?, ?, ?, ?)";
        data.query(insertQuery, [classid, classsession, timeRecord, ip], (err, result) => {
            if (err) {
                console.log("DB Error", err);
                return res.status(500).send({ status: false, message: "Database Error" });
            }
            console.log("DB Result:", result);

            res.send({
                status: true,
                message: "Class registered successfully",
                id: result.insertId   // use insertId for MySQL auto increment primary key
            });
        });
    });
});

app.post("/Check", verifyToken, (req, res) => {
  const { rollno, studentname, classid, classsession } = req.body;
  console.log(rollno, studentname, classid, classsession);
  // First check student
  const studentQuery = "SELECT * FROM students WHERE rollno = ? AND studentname = ?";
  data.query(studentQuery, [rollno, studentname], function (err, studentResult) {
    if (err) {
      console.log("DB Error (student)", err);
      return res.status(500).send({ status: false, message: "Database Error" });
    }
    if (studentResult.length === 0) {
      // ❌ No student found
      return res.send({
        status: false,
        message: "Invalid student details",
        result: [],
      });
    }
    // ✅ Student found → Now check fees
    const feesQuery = "SELECT * FROM fees WHERE class = ? AND classsession = ?";
    data.query(feesQuery, [classid, classsession], function (err, feesResult) {
      if (err) {
        console.log("DB Error (fees)", err);
        return res.status(500).send({ status: false, message: "Database Error" });
      }
      if (feesResult.length === 0) {
        // ❌ No fees record found for class/session
        return res.send({
          status: false,
          message: "Invalid class or session",
          result: [],
        });
      }
      // ✅ Both queries returned results → send fees result (for months)
      return res.send({
        status: true,
        message: "Fees Fetched Successfully",
        result: feesResult,
      });
    });
  });
});
app.post("/Report", verifyToken, (req, res) => {
    const {studentname, rollno, classid, session} = req.body;
    if(!studentname && !rollno){
        console.log(classid, session);
        const my = "select * from submitted where classid = ? and classsession = ?";
        data.query(my, [classid, session], function(err, result){
        if(err){
            console.log("DB Error", err);
            return res.status(500).send({status: "False", message: "Database Error"});
        }
        console.log("DB Result:", result);
        if (result.length === 0) {
            return res.status(404).send({
                status: "no",
                message: "No students found"
            });
        }
        return res.send({
            status: "yes",
            result: result
        });
        });   
    }
    else{
        console.log(studentname, rollno);
        const my = "select * from submitted where studentname = ? and rollno = ?";
        data.query(my, [studentname, rollno], function(err, result){
        if(err){
            console.log("DB Error", err);
            return res.status(500).send({status: "False", message: "Database Error"});
        }
        console.log("DB Result:", result);
        if (result.length === 0) {
            return res.status(404).send({
                status: "no",
                message: "No students found"
            });
        }
        return res.send({
            status: "yes",
            result: result
        });
        });
    }
});
app.post("/Reg", verifyToken, (req, res) => {
  const {
    rollno,
    studentname,
    mothername,
    fathername,
    classid,
    classsession,
    address,
    phone,
    timeRecord
  } = req.body;
  console.log(rollno, studentname, mothername, fathername, classid, classsession, address, phone, timeRecord);
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  // ✅ Step 1: Check for duplicate
  const checkDuplicate = `
    SELECT * FROM students 
    WHERE rollno = ? AND studentname = ? AND class = ? AND classsession = ?
  `;
  data.query(checkDuplicate, [rollno, studentname, classid, classsession], (err, results) => {
    if (err) {
      console.log("DB Error", err);
      return res.status(500).send({ status: false, message: "Database Error" });
    }
    if (results.length > 0) {
      // ✅ Duplicate found
      return res.status(200).send({
        status: false,
        message: "❌ Student already registered with same Roll No, Name, Class and Session"
      });
    }
    // ✅ Step 2: Insert if not duplicate
    const my = `
      INSERT INTO students
      (rollno, studentname, mothername, fathername, class, classsession, residence, phone, timeRecord, ipAddress) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    data.query(my, [rollno, studentname, mothername, fathername, classid, classsession, address, phone, timeRecord, ip], function (err, result) {
      if (err) {
        console.log("DB Error", err);
        return res.status(500).send({ status: false, message: "Database Error" });
      }
      console.log("DB Result:", result);
      res.send({
        status: true,
        message: "✅ User registered successfully",
        id: result.insertId // use insertId for new record
      });
    });
  });
});

app.post("/admin", (req, res) => {
    const {logkey} = req.body;
    console.log(logkey);
    const my = "select * from adminlog where logkey = (?)";
    data.query(my, [logkey], (err, result) =>{
        if(err){
            console.log("DB Error: ", err);
            return res.status(500).send({ status: "False", message: "Database Error"});
        }
        if(result.length == 0){
            return res.status(401).send
            ({status: "False", message: "Invalid Key"});
        }
        const user = result[0];
        if(logkey === user.logkey){
            console.log("welcome Admin");
        }
        const token = jwt.sign({name: logkey}, Secret_key, {expiresIn: '1h'});
        console.log(token);
        return res.status(200).json({status: true,token: token});
    });
});

function verifyToken(req, res, next){
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log(token);
  if(!token){
    return res.status(403).send("NO/Wrong token provided");
  }
  jwt.verify(token, Secret_key, (err, user)=>{
    if(err) return res.status(403).send("error");
    req.user = user;
    next();
  });
};

app.get("/ping", (req, res) => {
  res.send({ status: "ok", message: "Server is reachable!" });
});

app.listen(8081, "0.0.0.0", () => {
    console.log("StudentFees Server Started");
});