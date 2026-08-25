import React from "react";
import ReactDOM from "react-dom/client";

import { ThemeProvider } from "@/context/theme-context";
import { TimerProvider } from "@/context/timer-context";
import { TodoProvider } from "@/context/todo-context";
import IndexPage from "@/pages/index";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <TimerProvider>
        <TodoProvider>
          <IndexPage />
        </TodoProvider>
      </TimerProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
