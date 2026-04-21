import { Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { MdAnalytics, MdLogout, MdPeople, MdStorefront } from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";
import MobileCard from "../components/MobileCard";
import MobilePageShell from "../components/MobilePageShell";

export default function MenuMobilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <MobilePageShell title="Menu" subtitle="Acessos complementares da operação mobile">
      <MobileCard>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {user?.nome || user?.name || "Usuário"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.email || "Sessão autenticada"}
        </Typography>
      </MobileCard>

      <Stack spacing={1.25}>
        <Button fullWidth variant="outlined" startIcon={<MdPeople size={18} />} onClick={() => navigate("/clientes")} sx={{ minHeight: 48 }}>
          Clientes
        </Button>
        <Button fullWidth variant="outlined" startIcon={<MdStorefront size={18} />} onClick={() => navigate("/produtos")} sx={{ minHeight: 48 }}>
          Produtos
        </Button>
        <Button fullWidth variant="outlined" startIcon={<MdAnalytics size={18} />} onClick={() => navigate("/dashboard")} sx={{ minHeight: 48 }}>
          Dashboard
        </Button>
        <Button fullWidth color="error" variant="contained" startIcon={<MdLogout size={18} />} onClick={logout} sx={{ minHeight: 48 }}>
          Sair
        </Button>
      </Stack>
    </MobilePageShell>
  );
}
