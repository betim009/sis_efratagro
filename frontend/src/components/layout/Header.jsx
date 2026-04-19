import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Avatar,
} from "@mui/material";
import {
  MdMenu,
  MdNotifications,
  MdLogout,
  MdPerson,
} from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";
import notificacaoService from "../../services/notificacaoService";

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchNaoLidas = async () => {
      try {
        const response = await notificacaoService.contarNaoLidas();
        if (mounted) {
          setNaoLidas(response.data?.total || 0);
        }
      } catch {
        // silencioso
      }
    };

    fetchNaoLidas();
    const interval = setInterval(fetchNaoLidas, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar>
        <IconButton
          onClick={onToggleSidebar}
          edge="start"
          sx={{ mr: 2, color: "text.primary" }}
        >
          <MdMenu size={24} />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton
          onClick={() => navigate("/notificacoes")}
          sx={{ color: "text.secondary", mr: 1 }}
        >
          <Badge badgeContent={naoLidas} color="error" max={99}>
            <MdNotifications size={22} />
          </Badge>
        </IconButton>

        <Box
          onClick={handleMenuOpen}
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            gap: 1,
            ml: 1,
          }}
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              fontSize: "0.85rem",
              bgcolor: "primary.main",
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}>
              {user?.name || "Usuário"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1 }}>
              {user?.profile?.name || ""}
            </Typography>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{
            paper: {
              sx: { mt: 1, minWidth: 180 },
            },
          }}
        >
          <MenuItem disabled>
            <MdPerson size={18} style={{ marginRight: 8 }} />
            {user?.email || ""}
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <MdLogout size={18} style={{ marginRight: 8 }} />
            Sair
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
