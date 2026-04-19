import { Grid, TextField, MenuItem } from "@mui/material";
import FormDialog from "../../components/common/FormDialog";
import FormSection from "../../components/common/FormSection";

const TIPOS = [
  { value: "ENTRADA", label: "Entrada" },
  { value: "SAIDA", label: "Saída" },
  { value: "TRANSFERENCIA", label: "Transferência" },
];

export default function MovimentacaoDialog({ open, onClose, onSubmit, tipo = "ENTRADA", loading }) {
  const handleSubmit = () => {
    const form = document.getElementById("movimentacao-form");
    const formData = new FormData(form);

    const data = {
      tipo_movimentacao: formData.get("tipo_movimentacao"),
      produto_id: formData.get("produto_id"),
      quantidade: parseFloat(formData.get("quantidade")) || 0,
      motivo: formData.get("motivo"),
      observacoes: formData.get("observacoes") || null,
    };

    const tipoMov = data.tipo_movimentacao;
    if (tipoMov === "ENTRADA" || tipoMov === "TRANSFERENCIA") {
      data.local_destino_id = formData.get("local_destino_id") || null;
    }
    if (tipoMov === "SAIDA" || tipoMov === "TRANSFERENCIA") {
      data.local_origem_id = formData.get("local_origem_id") || null;
    }

    onSubmit(data);
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Nova Movimentação de Estoque"
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="sm"
    >
      <form id="movimentacao-form">
        <FormSection title="Dados da movimentação">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="tipo_movimentacao"
                label="Tipo"
                defaultValue={tipo}
                select
                fullWidth
                required
                size="small"
              >
                {TIPOS.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="produto_id"
                label="ID do Produto"
                fullWidth
                required
                size="small"
                placeholder="UUID do produto"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="quantidade"
                label="Quantidade"
                type="number"
                fullWidth
                required
                size="small"
                slotProps={{ input: { inputProps: { min: 0.001, step: "0.001" } } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="local_origem_id"
                label="Local de origem"
                fullWidth
                size="small"
                placeholder="UUID do local"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="local_destino_id"
                label="Local de destino"
                fullWidth
                size="small"
                placeholder="UUID do local"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField name="motivo" label="Motivo" fullWidth required size="small" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField name="observacoes" label="Observações" fullWidth multiline rows={2} size="small" />
            </Grid>
          </Grid>
        </FormSection>
      </form>
    </FormDialog>
  );
}
