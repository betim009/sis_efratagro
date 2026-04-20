import { useState } from "react";
import { Grid, TextField, MenuItem, Typography, IconButton, Box, Divider } from "@mui/material";
import { MdAdd, MdDelete } from "react-icons/md";
import FormDialog from "../../components/common/FormDialog";
import FormSection from "../../components/common/FormSection";

const TIPOS_VENDA = [
  { value: "NORMAL", label: "Normal" },
  { value: "FUTURA", label: "Futura" },
  { value: "DIRETA", label: "Direta" },
];

const FORMAS_PAGAMENTO = [
  { value: "A_VISTA", label: "À vista" },
  { value: "A_PRAZO", label: "A prazo" },
  { value: "PIX", label: "PIX" },
  { value: "CARTAO", label: "Cartão" },
  { value: "BOLETO", label: "Boleto" },
  { value: "DINHEIRO", label: "Dinheiro" },
];

const emptyItem = { produto_id: "", quantidade: "", preco_unitario: "", desconto_valor: "0" };

export default function VendaFormDialog({ open, onClose, onSubmit, loading }) {
  const [itens, setItens] = useState([{ ...emptyItem }]);

  const addItem = () => setItens([...itens, { ...emptyItem }]);

  const removeItem = (index) => {
    if (itens.length <= 1) return;
    setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...itens];
    updated[index] = { ...updated[index], [field]: value };
    setItens(updated);
  };

  const handleSubmit = () => {
    const form = document.getElementById("venda-form");
    const formData = new FormData(form);

    const data = {
      cliente_id: formData.get("cliente_id"),
      tipo_venda: formData.get("tipo_venda"),
      forma_pagamento: formData.get("forma_pagamento"),
      condicao_pagamento: formData.get("condicao_pagamento") || null,
      data_entrega_prevista: formData.get("data_entrega_prevista") || null,
      observacoes: formData.get("observacoes") || null,
      itens: itens
        .filter((item) => item.produto_id && item.quantidade)
        .map((item, i) => ({
          produto_id: item.produto_id,
          sequencia: i + 1,
          quantidade: parseFloat(item.quantidade) || 0,
          preco_unitario: parseFloat(item.preco_unitario) || 0,
          desconto_valor: parseFloat(item.desconto_valor) || 0,
        })),
    };

    onSubmit(data);
  };

  const handleClose = () => {
    setItens([{ ...emptyItem }]);
    onClose();
  };

  const calcTotal = () => {
    return itens.reduce((sum, item) => {
      const qty = parseFloat(item.quantidade) || 0;
      const price = parseFloat(item.preco_unitario) || 0;
      const desc = parseFloat(item.desconto_valor) || 0;
      return sum + (qty * price - desc);
    }, 0);
  };

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title="Nova Venda"
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="md"
    >
      <form id="venda-form">
        <FormSection title="Dados da venda">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="cliente_id"
                label="ID do Cliente"
                fullWidth
                required
                size="small"
                placeholder="UUID do cliente"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="tipo_venda" label="Tipo" defaultValue="NORMAL" select fullWidth required size="small">
                {TIPOS_VENDA.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="forma_pagamento" label="Pagamento" defaultValue="A_VISTA" select fullWidth required size="small">
                {FORMAS_PAGAMENTO.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField name="condicao_pagamento" label="Condição de pagamento" fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField name="data_entrega_prevista" label="Entrega prevista" type="date" fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Itens da venda">
          {itens.map((item, index) => (
            <Box key={index}>
              <Grid container spacing={1} sx={{ alignItems: "center" }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Produto ID"
                    value={item.produto_id}
                    onChange={(e) => updateItem(index, "produto_id", e.target.value)}
                    fullWidth
                    required
                    size="small"
                    placeholder="UUID"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField
                    label="Qtd."
                    type="number"
                    value={item.quantidade}
                    onChange={(e) => updateItem(index, "quantidade", e.target.value)}
                    fullWidth
                    required
                    size="small"
                    slotProps={{ input: { inputProps: { min: 0.001, step: "0.001" } } }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField
                    label="Preço unit."
                    type="number"
                    value={item.preco_unitario}
                    onChange={(e) => updateItem(index, "preco_unitario", e.target.value)}
                    fullWidth
                    required
                    size="small"
                    slotProps={{ input: { inputProps: { min: 0, step: "0.01" } } }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField
                    label="Desconto"
                    type="number"
                    value={item.desconto_valor}
                    onChange={(e) => updateItem(index, "desconto_valor", e.target.value)}
                    fullWidth
                    size="small"
                    slotProps={{ input: { inputProps: { min: 0, step: "0.01" } } }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }} sx={{ display: "flex", justifyContent: "center" }}>
                  <IconButton size="small" color="error" onClick={() => removeItem(index)} disabled={itens.length <= 1}>
                    <MdDelete size={18} />
                  </IconButton>
                </Grid>
              </Grid>
              {index < itens.length - 1 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
            <IconButton size="small" color="primary" onClick={addItem}>
              <MdAdd size={20} />
            </IconButton>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Total estimado:{" "}
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(calcTotal())}
            </Typography>
          </Box>
        </FormSection>

        <FormSection title="Observações">
          <TextField name="observacoes" label="Observações" fullWidth multiline rows={2} size="small" />
        </FormSection>
      </form>
    </FormDialog>
  );
}
