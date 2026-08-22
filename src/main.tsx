import React from "react";
import ReactDOM from "react-dom/client";

import IndexPage from "@/pages/index";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IndexPage />
  </React.StrictMode>,
);
