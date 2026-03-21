import axios from "axios";

const API = axios.create({
  //baseURL: "https://esdm-study-platform.onrender.com/api",
baseURL: "https://esdm-study-platform-backend.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
