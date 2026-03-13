import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';

import Dashboard from './pages/Dashboard';
import Distribute from './pages/Distribute';
import Students from './pages/Students';
import Books from './pages/Books';
import History from './pages/History';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Index rotası Dashboard */}
        <Route index element={<Dashboard />} />

        {/* Diğer sayfalar */}
        <Route path="distribute" element={<Distribute />} />
        <Route path="students" element={<Students />} />
        <Route path="books" element={<Books />} />
        <Route path="history" element={<History />} />
        <Route path="settings" element={<Settings />} />

        {/* 404 - Bulunamadı */}
        <Route path="*" element={
          <div className="flex h-full items-center justify-center text-slate-500">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">404 - Sayfa Bulunamadı</h2>
              <p>Aradığınız sayfa mevcut değil.</p>
            </div>
          </div>
        } />
      </Route>
    </Routes>
  );
}

export default App;
