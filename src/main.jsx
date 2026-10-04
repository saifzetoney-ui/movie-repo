import React from "react";
import ReactDom from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

// GitHub Pages hosts this repository below /movie-repo; custom domains and
// local development serve from the root path instead.
const routerBase = window.location.hostname.endsWith("github.io")
  ? "/movie-repo"
  : undefined;

ReactDom.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={routerBase}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
