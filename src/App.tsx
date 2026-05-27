import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { toCamel } from "./lib/helpers";
import { useToast } from "./hooks/useToast";
import type { Profile } from "./types";
import type { Session } from "@supabase/supabase-js";

// Pages
import PageDashboard  from "./pages/PageDashboard";
import PageEstoque    from "./pages/PageEstoque";
import PageVendas     from "./pages/PageVendas";
import PageHistorico  from "./pages/PageHistorico";
import PageClientes   from "./pages/PageClientes";
import PageVendedoras from "./pages/PageVendedoras";
import PageDespesas   from "./pages/PageDespesas";
import PageRelatorios from "./pages/PageRelatorios";

type PageId =
  | "dashboard" | "estoque" | "vendas" | "historico"
  | "clientes"  | "vendedoras" | "despesas" | "relatorios";

const NAV_ITEMS: { id: PageId; label: string; adminOnly: boolean }[] = [
  { id: "dashboard",  label: "Dashboard",          adminOnly: false },
  { id: "estoque",    label: "Estoque",             adminOnly: false },
  { id: "vendas",     label: "Registrar Venda",     adminOnly: false },
  { id: "historico",  label: "Histórico de Vendas", adminOnly: false },
  { id: "clientes",   label: "Clientes",            adminOnly: false },
  { id: "vendedoras", label: "Vendedoras",          adminOnly: true  },
  { id: "despesas",   label: "Despesas",            adminOnly: true  },
  { id: "relatorios", label: "Relatórios",          adminOnly: true  },
];

export default function App() {
  const [session,     setSession]     = useState<Session | null>(null);
  const [profile,     setProfile]     = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page,        setPage]        = useState<PageId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginForm,   setLoginForm]   = useState({ email: "", password: "" });
  const [loginError,  setLoginError]  = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) loadProfile(s.user.id);
      else   setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      if (s) loadProfile(s.user.id);
      else { setProfile(null); setAuthLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(toCamel<Profile>(data));
    setAuthLoading(false);
  };

  const doLogin = async () => {
    setLoginError(""); setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email, password: loginForm.password,
    });
    setLoginLoading(false);
    if (error) setLoginError("E-mail ou senha incorretos.");
  };

  const doLogout = async () => {
    await supabase.auth.signOut();
    setPage("dashboard");
  };

  const isAdmin = profile?.role === "admin";
  const navigate = (p: PageId) => { setPage(p); setSidebarOpen(false); };

  // ── Loading screen ─────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream)" }}>
        <div style={{ textAlign: "center" }}>
          <span className="logo-icon" style={{ fontSize: 36, display: "block", marginBottom: 12 }}>✦</span>
          <p style={{ color: "var(--text-soft)" }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // ── Login screen ───────────────────────────────────────────────────
  if (!session || !profile) {
    return (
      <div className="login-screen">
        <div className="login-decoration" />
        <div className="login-card">
          <div className="login-logo">
            <span className="logo-icon">✦</span>
            <h1>Vodete <em>Jalecos</em></h1>
            <p>Sistema de Gestão</p>
          </div>
          <div className="login-form">
            <div className="input-group">
              <label>E-mail</label>
              <input
                type="email"
                className="input-field"
                value={loginForm.email}
                placeholder="seu@email.com"
                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                onKeyDown={e => e.key === "Enter" && doLogin()}
              />
            </div>
            <div className="input-group">
              <label>Senha</label>
              <input
                type="password"
                className="input-field"
                value={loginForm.password}
                placeholder="••••••••"
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                onKeyDown={e => e.key === "Enter" && doLogin()}
              />
            </div>
            {loginError && <div className="alert alert-error">{loginError}</div>}
            <button className="btn btn-primary btn-full" onClick={doLogin} disabled={loginLoading}>
              {loginLoading ? "Entrando..." : "Entrar"}
            </button>
          </div>
          <p className="login-hint">Vodete Jalecos © 2025</p>
        </div>
      </div>
    );
  }

  // ── Page renderer ──────────────────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      case "dashboard":  return <PageDashboard  isAdmin={isAdmin} userId={profile.id} />;
      case "estoque":    return <PageEstoque    isAdmin={isAdmin} showToast={showToast} />;
      case "vendas":     return <PageVendas     userId={profile.id} userName={profile.name} showToast={showToast} />;
      case "historico":  return <PageHistorico  isAdmin={isAdmin} userId={profile.id} showToast={showToast} />;
      case "clientes":   return <PageClientes   showToast={showToast} />;
      case "vendedoras": return isAdmin ? <PageVendedoras showToast={showToast} /> : null;
      case "despesas":   return isAdmin ? <PageDespesas   showToast={showToast} /> : null;
      case "relatorios": return isAdmin ? <PageRelatorios showToast={showToast} /> : null;
      default: return null;
    }
  };

  // ── Authenticated shell ────────────────────────────────────────────
  return (
    <>
      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sidebar-header">
          <span className="logo-icon" style={{ fontSize: 22 }}>✦</span>
          <div><h2>Vodete</h2><small>Jalecos</small></div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS
            .filter(n => !n.adminOnly || isAdmin)
            .map(n => (
              <a
                key={n.id}
                href="#"
                className={`nav-item${page === n.id ? " active" : ""}`}
                onClick={e => { e.preventDefault(); navigate(n.id); }}
              >
                <span className="nav-icon">◈</span> {n.label}
              </a>
            ))
          }
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{profile.name.charAt(0).toUpperCase()}</div>
            <div>
              <p>{profile.name}</p>
              <small>{isAdmin ? "Administradora" : "Vendedora"}</small>
            </div>
          </div>
          <button className="btn-logout" onClick={doLogout} title="Sair">↩</button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay active" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile top bar */}
      <header className="mobile-header">
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <span className="mobile-logo">✦ Vodete Jalecos</span>
        <button className="btn-logout-mobile" onClick={doLogout}>↩</button>
      </header>

      {/* Main content */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* Toast notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </>
  );
}
