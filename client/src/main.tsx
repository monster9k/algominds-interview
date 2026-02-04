/**
 * Application Entry Point
 * Initializes the React application with providers and global styles
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/app/index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
