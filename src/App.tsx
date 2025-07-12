import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import IssueCredential from './pages/IssueCredential';
import GenerateProof from './pages/GenerateProof';
import VerifyProof from './pages/VerifyProof';
import ShowProof from './pages/ShowProof';
import ScanVerify from './pages/ScanVerify';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="issue" element={<IssueCredential />} />
            <Route path="generate" element={<GenerateProof />} />
            <Route path="verify" element={<VerifyProof />} />
            <Route path="show-proof" element={<ShowProof />} />
            <Route path="scan-verify" element={<ScanVerify />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;