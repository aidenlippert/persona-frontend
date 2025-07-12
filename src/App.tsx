import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import IssueCredential from './pages/IssueCredential';
import GenerateProof from './pages/GenerateProof';
import VerifyProof from './pages/VerifyProof';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="issue" element={<IssueCredential />} />
            <Route path="proof" element={<GenerateProof />} />
            <Route path="verify" element={<VerifyProof />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;