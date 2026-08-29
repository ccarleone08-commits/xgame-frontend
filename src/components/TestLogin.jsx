// src/components/TestLogin.jsx
import React from "react";
import axios from "axios";
import { buildApiAbsoluteUrl } from "./../config/api";

export default function TestLogin() {
  // API URL-i özünə uyğun deyiş:
  const API_URL = buildApiAbsoluteUrl("/api/Auths/Login");

  const handleTestLogin = async () => {
    try {
      // buraya test üçün həqiqi user adı/email və şifrə yaz
      const payload = {
        userNameOrEmail: "resad",
        password: "Resad123!",
      };

      console.log("Sending login request:", payload);

      const res = await axios.post(API_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("Server response (res.data):", res.data);

      // əgər token varsa ayrıca göstərici
      if (res.data?.token) {
        console.log("Token:", res.data.token);
      } else {
        console.warn("Token tapılmadı. Full response:", res.data);
      }
    } catch (err) {
      console.error("Request failed:", err.response?.data || err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Test Login (axios)</h3>
      <p>Click to send test credentials to the backend and print the response to console.</p>
      <button onClick={handleTestLogin}>Send Test Login</button>
    </div>
  );
}
