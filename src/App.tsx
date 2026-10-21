import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { AppShell } from "@/components/layout/AppShell";
import { Spinner } from "@/components/ui/Misc";
import { LoginPage } from "@/pages/LoginPage";
import { SetupScreen } from "@/pages/SetupScreen";
import { DashboardPage } from "@/pages/DashboardPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { CashierPage } from "@/pages/CashierPage";
import { ImportPage } from "@/pages/ImportPage";
import { CampaignsPage } from "@/pages/CampaignsPage";

export default function App() {
  const auth = useAuth();

  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Spinner size={32} label="جارٍ تحميل التطبيق" />
      </div>
    );
  }

  if (!auth.session) {
    return (
      <LoginPage
        onSignIn={auth.signIn}
        error={auth.error}
        onClearError={auth.clearError}
        loading={auth.loading}
      />
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/cashier" element={<CashierPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
