import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import MainLayout from "../components/layout/MainLayout";
import MobileLayout from "../layouts/mobile/MobileLayout";
import ProtectedRoute from "./ProtectedRoute";
import Loading from "../components/common/Loading";

const LoginPage = lazy(() => import("../pages/Login/LoginPage"));
const DashboardPage = lazy(() => import("../pages/Dashboard/DashboardPage"));
const ClientesPage = lazy(() => import("../pages/Clientes/ClientesPage"));
const FornecedoresPage = lazy(() => import("../pages/Fornecedores/FornecedoresPage"));
const ProdutosPage = lazy(() => import("../pages/Produtos/ProdutosPage"));
const EstoquePage = lazy(() => import("../pages/Estoque/EstoquePage"));
const LocaisEstoquePage = lazy(() => import("../pages/Estoque/LocaisEstoquePage"));
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
const DashboardMobilePage = lazy(() => import("../mobile/pages/DashboardMobilePage"));
const ClientesMobilePage = lazy(() => import("../mobile/pages/ClientesMobilePage"));
const ProdutosMobilePage = lazy(() => import("../mobile/pages/ProdutosMobilePage"));
const EstoqueMobilePage = lazy(() => import("../mobile/pages/EstoqueMobilePage"));
const VendasMobilePage = lazy(() => import("../mobile/pages/VendasMobilePage"));
const FinanceiroMobilePage = lazy(() => import("../mobile/pages/FinanceiroMobilePage"));
const MenuMobilePage = lazy(() => import("../mobile/pages/MenuMobilePage"));

const adaptiveRoutes = [
  {
    path: "dashboard",
    desktopElement: <DashboardPage />,
    mobileElement: <DashboardMobilePage />,
    permission: "dashboard.read",
  },
  {
    path: "clientes",
    desktopElement: <ClientesPage />,
    mobileElement: <ClientesMobilePage />,
    permission: "clientes.read",
  },
  {
    path: "produtos",
    desktopElement: <ProdutosPage />,
    mobileElement: <ProdutosMobilePage />,
    permission: "produtos.read",
  },
  {
    path: "estoque",
    desktopElement: <EstoquePage />,
    mobileElement: <EstoqueMobilePage />,
    permission: "estoque.read",
  },
  {
    path: "vendas",
    desktopElement: <VendasPage />,
    mobileElement: <VendasMobilePage />,
    permission: "vendas.read",
  },
  {
    path: "financeiro",
    desktopElement: <FinanceiroPage />,
    mobileElement: <FinanceiroMobilePage />,
    permission: "financeiro.read",
  },
];

const desktopOnlyRoutes = [
  { path: "fornecedores", element: <FornecedoresPage />, permission: "fornecedores.read" },
  { path: "estoque/locais", element: <LocaisEstoquePage />, permission: "estoque.read" },
  { path: "frota", element: <FrotaPage />, permission: "frota.read" },
  { path: "entregas", element: <EntregasPage />, permission: "entregas.read" },
  { path: "relatorios", element: <RelatoriosPage />, permission: "relatorios.read" },
  { path: "fretes", element: <FretesPage />, permission: "fretes.read" },
  { path: "auditoria", element: <AuditoriaPage />, permission: "auditoria.read" },
  { path: "notificacoes", element: <NotificacoesPage />, permission: "notificacoes.read" },
];

export default function AppRoutes() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const ActiveLayout = isMobile ? MobileLayout : MainLayout;

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <ActiveLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {adaptiveRoutes.map(({ path, desktopElement, mobileElement, permission }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute permission={permission}>
                {isMobile ? mobileElement : desktopElement}
              </ProtectedRoute>
            }
          />
        ))}

        {desktopOnlyRoutes.map(({ path, element, permission }) => (
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

        <Route
          path="menu"
          element={
            isMobile ? (
              <MenuMobilePage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        <Route path="acesso-negado" element={<AcessoNegadoPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
