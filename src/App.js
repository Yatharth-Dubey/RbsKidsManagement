import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Admin } from "./School_Fees/admin";
import StudentReg from "./School_Fees/StudentReg";
import { Reg } from "./School_Fees/Reg";
import { Fees } from "./School_Fees/Fees";
import { Report } from "./School_Fees/Report";
import { Structure } from "./School_Fees/Structure";
import { ViewStructure } from "./School_Fees/ViewStructure";
import { About } from "./School_Fees/About";


function App() {
  return (
    <Router>
      <Routes>
        {/* Main Admin/Login route */}
        <Route path="/" element={<Admin />} />

        {/* Parent route with nested children */}
        <Route path="/StudentReg" element={<StudentReg />}>
          <Route path="About" element={<About/>}/>
          <Route path="Reg" element={<Reg />} />
          <Route path="Fees" element={<Fees />} />
          <Route path="Report" element={<Report />} />
          <Route path="Structure" element={<Structure />} />
          <Route path="ViewStructure" element={<ViewStructure />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
