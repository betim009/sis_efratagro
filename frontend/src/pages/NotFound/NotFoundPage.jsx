import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { MdSearchOff } from "react-icons/md";

export default function NotFoundPage() {
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
      <MdSearchOff size={72} color="#9E9E9E" />
      <Typography variant="h4" sx={{ fontWeight: 600 }}>
        404
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Página não encontrada.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/dashboard")} sx={{ mt: 2 }}>
        Voltar ao Dashboard
      </Button>
    </Box>
  );
}
