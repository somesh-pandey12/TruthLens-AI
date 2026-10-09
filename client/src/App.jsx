import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Analyze from './pages/Analyze.jsx';
import History from './pages/History.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-20 pt-7">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<div className="card text-center"><h2 className="text-xl font-bold">404 — Page not found</h2></div>} />
        </Routes>
      </main>
    </>
  );
}