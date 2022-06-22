import React from 'react'
import { Routes, Route } from 'react-router-dom'

import './App.css'

import Auth from './pages/auth'
import Challenge from './pages/challenge'
import NotFound from './pages/notfound'

const App = () => (
  <div className="app">
    <main className="content">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/challenge/:challengeId" element={<Challenge />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  </div>
)

export default App
