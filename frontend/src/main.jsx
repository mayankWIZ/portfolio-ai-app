import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// No <StrictMode>: its dev-only double mount races drei's <Html> label roots in the 3D town.
createRoot(document.getElementById("root")).render(<App />);
