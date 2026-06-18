import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Chat from "./pages/Chat/Chat";
import AdminDashboard from "./pages/Admin/AdminDashboard";

import AuthLayout from "./layouts/AuthLayout";
import ChatLayout from "./layouts/ChatLayout";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ChatLayout />}>
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
