import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OverviewPage } from './pages/OverviewPage';
import { TargetsPage } from './pages/TargetsPage';
import { AddTargetPage } from './pages/AddTargetPage';
import { TargetDetailPage } from './pages/TargetDetailPage';
import { CreateAssessmentPage } from './pages/CreateAssessmentPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { AssessmentDetailPage } from './pages/AssessmentDetailPage';
import { AttackSurfacePage } from './pages/AttackSurfacePage';
import { FindingsPage } from './pages/FindingsPage';
import { FindingDetailPage } from './pages/FindingDetailPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { InvestigationsPage } from './pages/InvestigationsPage';
import { ForensicsPage } from './pages/ForensicsPage';
import { ForensicDetailPage } from './pages/ForensicDetailPage';
import { AiAnalystPage } from './pages/AiAnalystPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { DefenseOverviewPage } from './pages/DefenseOverviewPage';
import { RemediationWorkspacePage } from './pages/RemediationWorkspacePage';
import { RetestWorkspacePage } from './pages/RetestWorkspacePage';
import { AuditPage } from './pages/AuditPage';
import { SystemPage } from './pages/SystemPage';
import { NotFoundPage } from './pages/NotFoundPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-dark)',
          color: 'var(--text-muted)',
        }}
      >
        Initializing AEGIS Platform...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="targets" element={<TargetsPage />} />
            <Route path="targets/new" element={<AddTargetPage />} />
            <Route path="targets/:id" element={<TargetDetailPage />} />
            <Route path="assessments" element={<AssessmentsPage />} />
            <Route path="assessments/new" element={<CreateAssessmentPage />} />
            <Route path="assessments/:id" element={<AssessmentDetailPage />} />
            <Route path="attack-surface" element={<AttackSurfacePage />} />
            <Route path="findings" element={<FindingsPage />} />
            <Route path="findings/:id" element={<FindingDetailPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="incidents/:id" element={<IncidentDetailPage />} />
            <Route path="investigations" element={<InvestigationsPage />} />
            <Route path="investigations/:id" element={<InvestigationsPage />} />
            <Route path="forensics" element={<ForensicsPage />} />
            <Route path="forensics/:id" element={<ForensicDetailPage />} />
            <Route path="ai" element={<AiAnalystPage />} />
            <Route path="ai/investigations" element={<AiAnalystPage />} />
            <Route path="ai/investigations/:id" element={<AiAnalystPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="defense" element={<DefenseOverviewPage />} />
            <Route path="remediation" element={<RemediationWorkspacePage />} />
            <Route path="retests" element={<RetestWorkspacePage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="system" element={<SystemPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
