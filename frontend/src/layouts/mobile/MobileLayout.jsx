import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Fab,
  Paper,
  SpeedDial,
  SpeedDialAction,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  MdDashboard,
  MdAttachMoney,
  MdInventory2,
  MdMenu,
  MdPerson,
  MdPointOfSale,
  MdAdd,
  MdShoppingCart,
  MdPeople,
  MdStorefront,
  MdPayments,
} from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";

const NAV_ITEMS = [
  { value: "/dashboard", label: "Dashboard", icon: <MdDashboard size={22} /> },
  { value: "/vendas", label: "Vendas", icon: <MdPointOfSale size={22} /> },
  { value: "/estoque", label: "Estoque", icon: <MdInventory2 size={22} /> },
  { value: "/financeiro", label: "Financeiro", icon: <MdAttachMoney size={22} /> },
  { value: "/menu", label: "Menu", icon: <MdMenu size={22} /> },
];

const SPEED_DIAL_ACTIONS = [
  { icon: <MdShoppingCart size={20} />, name: "Nova venda", path: "/vendas" },
  { icon: <MdPeople size={20} />, name: "Novo cliente", path: "/clientes" },
  { icon: <MdStorefront size={20} />, name: "Novo produto", path: "/produtos" },
  { icon: <MdPayments size={20} />, name: "Financeiro", path: "/financeiro" },
];

export default function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentNav = useMemo(() => {
    const matched = NAV_ITEMS.find((item) => location.pathname.startsWith(item.value));
    return matched?.value || "/menu";
  }, [location.pathname]);

  const title = useMemo(() => {
    const item = NAV_ITEMS.find((nav) => nav.value === currentNav);
    return item?.label || "Mobile ERP";
  }, [currentNav]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #F3F7F2 0%, #F8FAFC 18%, #EEF3F7 100%)",
        pb: 11,
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          backdropFilter: "blur(16px)",
          backgroundColor: "rgba(245, 248, 245, 0.88)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ minHeight: 68, px: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
              ERP MOBILE
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
              {title}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: "primary.main", width: 38, height: 38 }}>
            {user?.nome?.[0] || user?.name?.[0] || <MdPerson size={18} />}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ px: 2, py: 2.5 }}>
        <Outlet />
      </Box>

      {location.pathname !== "/menu" && (
        <>
          {location.pathname === "/dashboard" ? (
            <Fab
              color="secondary"
              aria-label="Nova venda"
              onClick={() => navigate("/vendas")}
              sx={{ position: "fixed", right: 20, bottom: 92, width: 60, height: 60 }}
            >
              <MdAdd size={28} />
            </Fab>
          ) : (
            <SpeedDial
              ariaLabel="Ações rápidas"
              icon={<MdAdd size={26} />}
              FabProps={{
                color: "secondary",
                sx: { width: 60, height: 60 },
              }}
              sx={{ position: "fixed", right: 20, bottom: 92 }}
            >
              {SPEED_DIAL_ACTIONS.map((action) => (
                <SpeedDialAction
                  key={action.name}
                  icon={action.icon}
                  tooltipTitle={action.name}
                  onClick={() => navigate(action.path)}
                />
              ))}
            </SpeedDial>
          )}
        </>
      )}

      <Paper
        elevation={10}
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          overflow: "hidden",
        }}
      >
        <BottomNavigation value={currentNav} onChange={(_, value) => navigate(value)} showLabels>
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction key={item.value} value={item.value} label={item.label} icon={item.icon} />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
