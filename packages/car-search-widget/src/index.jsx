import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Missing #root element for the car search widget.");
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
