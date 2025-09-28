import React from "react";
import "./About.css";

export const About=()=> {
  return (
    <div className="about-container">
      <div className="about-card">
        <h1><strong>Hi, I Am Yatharth Dubey</strong></h1>
        <p>
          I am currently pursuing my <strong>B.Tech in Computer Science & Engineering</strong>, 
          with a keen interest in <strong>software development, web technologies, and AI-powered solutions</strong>.
        </p>
        <p>
          This web application is one of my projects where I focused on solving a real-world 
          problem faced by institutions — <strong>efficiently managing student fee records</strong>.
        </p>
        <p>
          The platform allows schools/colleges to <strong>maintain a digital fee database</strong>, 
          generate <strong>instant digital receipts</strong>, and simplify the overall
          <strong> student fee management process</strong>.
        </p>
        <p>
          My goal is to keep learning and building impactful applications that can
          <strong> automate tasks, save time, and provide seamless user experiences</strong>.
        </p>
        <a href="https://www.linkedin.com/in/yatharth-dubey-34a532316" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </div>  
    </div>
  );
}