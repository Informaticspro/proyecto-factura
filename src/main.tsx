import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";

import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { Toaster } from "react-hot-toast";

// 🧠 Render principal
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      {/* 🌐 Proveedor global de metadatos */}
      <AppWrapper>
        <App />
      </AppWrapper>

      {/* 🔔 Toaster global de notificaciones */}
      <Toaster position="top-right" />
    </ThemeProvider>
  </StrictMode>
);
