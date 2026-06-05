import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import AuthLayout from './layouts/AuthLayout.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'

import Home from './pages/Home.jsx'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Chat from './pages/Chat.jsx'
import Journal from './pages/Journal.jsx'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/journal" element={<Journal />} />
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/auth" element={<Auth />} />
      </Route>
    </Routes>
  )
}

export default App
