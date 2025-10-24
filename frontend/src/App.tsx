import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme/theme';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import CreateTask from './pages/CreateTask';
import MyTasks from './pages/MyTasks';
import EditTask from './pages/EditTask';
import TaskDetail from './pages/TaskDetail';
import TaskDetailReadOnly from './pages/TaskDetailReadOnly';
import TaskDiscovery from './pages/TaskDiscovery';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/create"
                element={
                  <ProtectedRoute>
                    <CreateTask />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-tasks"
                element={
                  <ProtectedRoute>
                    <MyTasks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/discover"
                element={
                  <ProtectedRoute>
                    <TaskDiscovery />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/task/:taskId"
                element={
                  <ProtectedRoute>
                    <TaskDetailReadOnly />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
              <Route
  path="/tasks/:taskId"
  element={
    <ProtectedRoute>
      <TaskDetail />
    </ProtectedRoute>
  }
/>
<Route
  path="/tasks/:taskId/edit"
  element={
    <ProtectedRoute>
      <EditTask />
    </ProtectedRoute>
  }
/>
            </Routes>
          </Layout>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;