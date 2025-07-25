import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Credentials from './pages/Credentials';
import Templates from './pages/Templates';
import TemplateFill from './pages/templates/TemplateFill';
import GenerateProof from './pages/GenerateProof';
import VerifyProof from './pages/VerifyProof';
import VerifyIndex from './pages/verify/index';
import UseCaseVerify from './pages/verify/UseCase';
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
            <Route path="credentials" element={<Credentials />} />
            <Route path="templates" element={<Templates />} />
            <Route path="templates/:templateId/fill" element={<TemplateFill />} />
            <Route path="generate" element={<GenerateProof />} />
            <Route path="verify" element={<VerifyIndex />} />
            <Route path="verify/:useCase" element={<UseCaseVerify />} />
            <Route path="verify-proof" element={<VerifyProof />} />
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