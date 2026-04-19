import { Grid, TextField, MenuItem } from "@mui/material";
import FormDialog from "../../components/common/FormDialog";
import FormSection from "../../components/common/FormSection";

const FORMAS = [
  { value: "PIX", label: "PIX" },
  { value: "BOLETO", label: "Boleto" },
  { value: "CARTAO", label: "Cartão" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "TRANSFERENCIA", label: "Transferência" },
];

export default function PagamentoDialog({ open, onClose, onSubmit, duplicata, loading }) {
  const handleSubmit = () => {
    const form = document.getElementById("pagamento-form");
    const formData = new FormData(form);

    const data = {
      forma_pagamento: formData.get("forma_pagamento"),
      valor: parseFloat(formData.get("valor")) || 0,
      referencia_externa: formData.get("referencia_externa") || null,
      observacoes: formData.get("observacoes") || null,
    };

    onSubmit(duplicata?.id, data);
  };

  const valorAberto = parseFloat(duplicata?.valor_aberto) || 0;

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={`Registrar Pagamento — ${duplicata?.numero || ""}`}
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="sm"
    >
      <form id="pagamento-form">
        <FormSection title="Dados do pagamento">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="forma_pagamento"
                label="Forma de pagamento"
                defaultValue="PIX"
                select
                fullWidth
                required
                size="small"
              >
                {FORMAS.map((f) => (
                  <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="valor"
                label="Valor"
                type="number"
                defaultValue={valorAberto}
                fullWidth
                required
                size="small"
                helperText={`Valor em aberto: R$ ${valorAberto.toFixed(2)}`}
                slotProps={{ input: { inputProps: { min: 0.01, max: valorAberto, step: "0.01" } } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="referencia_externa"
                label="Referência externa"
                fullWidth
                size="small"
                placeholder="Nº comprovante, ID transação..."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="observacoes"
                label="Observações"
                fullWidth
                multiline
                rows={2}
                size="small"
              />
            </Grid>
          </Grid>
        </FormSection>
      </form>
    </FormDialog>
  );
}
