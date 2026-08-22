import React from "react";
import ReactDOM from "react-dom/client";

import { TimerProvider } from "@/context/timer-context";
import IndexPage from "@/pages/index";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TimerProvider>
      <IndexPage />
    </TimerProvider>
  </React.StrictMode>,
);
