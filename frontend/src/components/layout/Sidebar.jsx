import { useLocation, useNavigate } from "react-router-dom";
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import {
  MdDashboard,
  MdPeople,
  MdStore,
  MdInventory,
  MdWarehouse,
  MdPointOfSale,
  MdAttachMoney,
  MdLocalShipping,
  MdDirectionsCar,
  MdAssessment,
  MdReceipt,
  MdSecurity,
  MdNotifications,
} from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";

const menuItems = [
  { text: "Dashboard", icon: MdDashboard, path: "/dashboard", permission: "dashboard.read" },
  { divider: true, label: "Cadastros" },
  { text: "Clientes", icon: MdPeople, path: "/clientes", permission: "clientes.read" },
  { text: "Fornecedores", icon: MdStore, path: "/fornecedores", permission: "fornecedores.read" },
  { text: "Produtos", icon: MdInventory, path: "/produtos", permission: "produtos.read" },
  { divider: true, label: "Operações" },
  { text: "Estoque", icon: MdWarehouse, path: "/estoque", permission: "estoque.read" },
  { text: "Vendas", icon: MdPointOfSale, path: "/vendas", permission: "vendas.read" },
  { text: "Financeiro", icon: MdAttachMoney, path: "/financeiro", permission: "financeiro.read" },
  { divider: true, label: "Logística" },
  { text: "Frota", icon: MdDirectionsCar, path: "/frota", permission: "frota.read" },
  { text: "Entregas", icon: MdLocalShipping, path: "/entregas", permission: "entregas.read" },
  { text: "Fretes", icon: MdReceipt, path: "/fretes", permission: "fretes.read" },
  { divider: true, label: "Sistema" },
  { text: "Relatórios", icon: MdAssessment, path: "/relatorios", permission: "relatorios.read" },
  { text: "Auditoria", icon: MdSecurity, path: "/auditoria", permission: "auditoria.read" },
  { text: "Notificações", icon: MdNotifications, path: "/notificacoes", permission: "notificacoes.read" },
];

export default function Sidebar({ open, drawerWidth }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#1B3A1B",
          color: "#FFFFFF",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 2.5,
          px: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#F9A825" }}>
          ERP Efrat Agro
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

      <List sx={{ px: 1, pt: 1 }}>
        {menuItems.map((item, index) => {
          if (item.divider) {
            return (
              <Box key={`divider-${index}`}>
                {index > 0 && (
                  <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 1 }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    py: 0.5,
                    display: "block",
                    color: "rgba(255,255,255,0.5)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontSize: "0.68rem",
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            );
          }

          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }

          const isActive = location.pathname === item.path
            || location.pathname.startsWith(item.path + "/");

          const Icon = item.icon;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.3 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1.5,
                  py: 1,
                  backgroundColor: isActive
                    ? "rgba(249, 168, 37, 0.15)"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: isActive
                      ? "rgba(249, 168, 37, 0.25)"
                      : "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? "#F9A825" : "rgba(255,255,255,0.7)",
                    minWidth: 40,
                  }}
                >
                  <Icon size={20} />
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{
                    primary: {
                      fontSize: "0.875rem",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#F9A825" : "rgba(255,255,255,0.9)",
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}
