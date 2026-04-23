import { useState } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";

const DEV_ADMIN_LOGIN = {
  email: "admin@sisefratagro.local",
  password: "Adm@12345",
};

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sessionExpired = location.state?.sessionExpired;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Credenciais inválidas. Tente novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const applyAdminSuggestion = () => {
    setEmail(DEV_ADMIN_LOGIN.email);
    setPassword(DEV_ADMIN_LOGIN.password);
    setError("");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1B5E20",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: "primary.main" }}
            >
              ERP Efrat Agro
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Acesse sua conta para continuar
            </Typography>
          </Box>

          {sessionExpired && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Sua sessão expirou. Faça login novamente.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="E-mail"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              autoFocus
              autoComplete="email"
            />

            <TextField
              label="Senha"
              type={showPassword ? "text" : "password"}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              autoComplete="current-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? (
                          <MdVisibilityOff size={20} />
                        ) : (
                          <MdVisibility size={20} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <Divider sx={{ my: 2 }} />

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "grey.50",
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Acesso rápido de desenvolvimento
              </Typography>
              <Typography variant="body2">
                <strong>E-mail:</strong> {DEV_ADMIN_LOGIN.email}
              </Typography>
              <Typography variant="body2">
                <strong>Senha:</strong> {DEV_ADMIN_LOGIN.password}
              </Typography>
              <Button
                type="button"
                variant="outlined"
                size="small"
                onClick={applyAdminSuggestion}
                disabled={loading}
                sx={{ alignSelf: "flex-start", mt: 0.5 }}
              >
                Usar sugestão de login
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
