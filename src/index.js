import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// import CompleteForm from './CompleteForm';
import reportWebVitals from './reportWebVitals';
import StudentReg from './School_Fees/StudentReg';
import Admin from './School_Fees/admin';
// import Registration from './Registration';
// import Dashboard from './Dashboard';
// import { Login } from './Login';
// import Stegano from './Steganography/Stegano';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* <StudentReg/> */}
    {/* <Admin/> */}
    <App />
    {/* <Dashboard/> */}
    {/* <Login/> */}
    {/* <Registration/> */}
    {/* <Stegano/> */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
