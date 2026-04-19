import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import Loading from "../components/common/Loading";

const LoginPage = lazy(() => import("../pages/Login/LoginPage"));
const DashboardPage = lazy(() => import("../pages/Dashboard/DashboardPage"));
const ClientesPage = lazy(() => import("../pages/Clientes/ClientesPage"));
const FornecedoresPage = lazy(() => import("../pages/Fornecedores/FornecedoresPage"));
const ProdutosPage = lazy(() => import("../pages/Produtos/ProdutosPage"));
const EstoquePage = lazy(() => import("../pages/Estoque/EstoquePage"));
const VendasPage = lazy(() => import("../pages/Vendas/VendasPage"));
const FinanceiroPage = lazy(() => import("../pages/Financeiro/FinanceiroPage"));
const FrotaPage = lazy(() => import("../pages/Frota/FrotaPage"));
const EntregasPage = lazy(() => import("../pages/Entregas/EntregasPage"));
const RelatoriosPage = lazy(() => import("../pages/Relatorios/RelatoriosPage"));
const FretesPage = lazy(() => import("../pages/Fretes/FretesPage"));
const AuditoriaPage = lazy(() => import("../pages/Auditoria/AuditoriaPage"));
const NotificacoesPage = lazy(() => import("../pages/Notificacoes/NotificacoesPage"));
const AcessoNegadoPage = lazy(() => import("../pages/AcessoNegado/AcessoNegadoPage"));
const NotFoundPage = lazy(() => import("../pages/NotFound/NotFoundPage"));

const privateRoutes = [
  { path: "dashboard", element: <DashboardPage />, permission: "dashboard.read" },
  { path: "clientes", element: <ClientesPage />, permission: "clientes.read" },
  { path: "fornecedores", element: <FornecedoresPage />, permission: "fornecedores.read" },
  { path: "produtos", element: <ProdutosPage />, permission: "produtos.read" },
  { path: "estoque", element: <EstoquePage />, permission: "estoque.read" },
  { path: "vendas", element: <VendasPage />, permission: "vendas.read" },
  { path: "financeiro", element: <FinanceiroPage />, permission: "financeiro.read" },
  { path: "frota", element: <FrotaPage />, permission: "frota.read" },
  { path: "entregas", element: <EntregasPage />, permission: "entregas.read" },
  { path: "relatorios", element: <RelatoriosPage />, permission: "relatorios.read" },
  { path: "fretes", element: <FretesPage />, permission: "fretes.read" },
  { path: "auditoria", element: <AuditoriaPage />, permission: "auditoria.read" },
  { path: "notificacoes", element: <NotificacoesPage />, permission: "notificacoes.read" },
];

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<LoginPage />} />

      {/* Rotas privadas com layout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {privateRoutes.map(({ path, element, permission }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute permission={permission}>
                {element}
              </ProtectedRoute>
            }
          />
        ))}

        <Route path="acesso-negado" element={<AcessoNegadoPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
