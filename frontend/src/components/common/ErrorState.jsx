import { Box, Typography, Button } from "@mui/material";
import { MdErrorOutline } from "react-icons/md";

export default function ErrorState({
  message = "Ocorreu um erro ao carregar os dados.",
  onRetry,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        gap: 2,
      }}
    >
      <MdErrorOutline size={56} color="#D32F2F" />
      <Typography variant="h6" color="error" sx={{ fontWeight: 500 }}>
        Erro
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", maxWidth: 400 }}>
        {message}
      </Typography>
      {onRetry && (
        <Button variant="outlined" onClick={onRetry} sx={{ mt: 1 }}>
          Tentar novamente
        </Button>
      )}
    </Box>
  );
}
