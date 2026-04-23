import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";

const initialForm = {
  nome: "",
  descricao: "",
  status: "ATIVO",
  codigo: "",
  tipo_local: "DEPOSITO",
  endereco_referencia: "",
};

const getInitialForm = (local) => ({
  nome: local?.nome || "",
  descricao: local?.descricao || "",
  status: local?.status || "ATIVO",
  codigo: local?.codigo || "",
  tipo_local: local?.tipo_local || "DEPOSITO",
  endereco_referencia: local?.endereco_referencia || "",
});

function LocalEstoqueFormDialogContent({
  open,
  local,
  loading = false,
  error = null,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(() => (local ? getInitialForm(local) : initialForm));
  const [validationError, setValidationError] = useState(null);

  const isEdit = Boolean(local?.id);

  const handleChange = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.nome.trim()) {
      setValidationError("Informe o nome do local de estoque.");
      return;
    }

    setValidationError(null);
    onSubmit({
      ...form,
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
    });
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Editar local de estoque" : "Novo local de estoque"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} component="form" id="local-estoque-form" onSubmit={handleSubmit}>
          {(validationError || error) && (
            <Grid item xs={12}>
              <Alert severity="error">{validationError || error}</Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              label="Nome"
              value={form.nome}
              onChange={handleChange("nome")}
              fullWidth
              required
              autoFocus
              disabled={loading}
              placeholder="Ex.: Depósito Central"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Descrição"
              value={form.descricao}
              onChange={handleChange("descricao")}
              fullWidth
              multiline
              minRows={3}
              disabled={loading}
              placeholder="Detalhes operacionais, endereço interno ou finalidade do local"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={handleChange("status")}
              fullWidth
              disabled={loading}
            >
              <MenuItem value="ATIVO">Ativo</MenuItem>
              <MenuItem value="INATIVO">Inativo</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" form="local-estoque-form" variant="contained" disabled={loading}>
          {loading ? "Salvando..." : "Salvar local"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function LocalEstoqueFormDialog(props) {
  const key = `${props.open ? "open" : "closed"}-${props.local?.id || "new"}`;

  return <LocalEstoqueFormDialogContent key={key} {...props} />;
}
