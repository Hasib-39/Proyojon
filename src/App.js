import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import AuthProvider from "./context/auth";
import PrivateRoute from "./components/PrivateRoute";
import Sell from "./pages/Sell";
import MyFavorites from "./pages/MyFavorites";
import Ad from "./pages/Ad";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Chat from "./pages/Chat";
import { LoadScript } from "@react-google-maps/api";

const libraries = ["geometry"]; // Define libraries to be used with Google Maps


function App() {
  return (
    <AuthProvider>
      <LoadScript googleMapsApiKey={process.env.REACT_APP_MAPS_APIKEY} libraries={libraries}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/sell" element={<Sell />} />
            <Route path="/favorites" element={<MyFavorites />} />
            <Route path="/Chat" element={<Chat />} />
          </Route>
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/:category/:id" element={<Ad />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
      </LoadScript>
    </AuthProvider>
  );
}

export default App;