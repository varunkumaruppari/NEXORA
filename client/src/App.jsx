import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import MarketplacePage from './pages/MarketplacePage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import CustomerChatPage from './pages/CustomerChatPage';
import ServiceDashboardPage from './pages/ServiceDashboardPage';
import CaseDetailsPage from './pages/CaseDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Marketplace & E-Commerce Customer Experience */}
              <Route path="/" element={<MarketplacePage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/orders" element={<MyOrdersPage />} />
              <Route path="/orders/:orderId" element={<OrderDetailsPage />} />

              {/* RESOLV AI Core Resolution Systems */}
              <Route path="/chat" element={<CustomerChatPage />} />
              <Route path="/dashboard" element={<ServiceDashboardPage />} />
              <Route path="/cases/:id" element={<CaseDetailsPage />} />

              {/* Authentication & Fallback */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
