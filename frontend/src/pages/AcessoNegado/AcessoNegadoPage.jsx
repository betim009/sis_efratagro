import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { MdBlock } from "react-icons/md";

export default function AcessoNegadoPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 2,
        textAlign: "center",
      }}
    >
      <MdBlock size={72} color="#D32F2F" />
      <Typography variant="h4" sx={{ fontWeight: 600 }}>
        Acesso Negado
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Você não tem permissão para acessar esta página.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/dashboard")} sx={{ mt: 2 }}>
        Voltar ao Dashboard
      </Button>
    </Box>
  );
}
