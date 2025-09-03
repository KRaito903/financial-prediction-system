import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apollo-client';
import { SocketProvider } from './context/SocketContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <SocketProvider>
        {/* <AuthProvider> */}
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/dashboard"
                element={
                  // <ProtectedRoute>
                    <Dashboard />
                  // {/* </ProtectedRoute> */}
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        {/* </AuthProvider> */}
      </SocketProvider>
    </ApolloProvider>
  );
}

export default App;
