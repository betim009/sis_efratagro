import { Grid, TextField, MenuItem, FormControlLabel, Switch } from "@mui/material";
import FormDialog from "../../components/common/FormDialog";
import FormSection from "../../components/common/FormSection";

const UNIDADES = ["UN", "KG", "LT", "CX", "PCT", "SC", "TON", "ML", "M", "M2", "M3"];

export default function ProdutoFormDialog({ open, onClose, onSubmit, produto, loading }) {
  const isEdit = !!produto?.id;

  const handleSubmit = () => {
    const form = document.getElementById("produto-form");
    const formData = new FormData(form);

    const data = {
      codigo: formData.get("codigo"),
      nome: formData.get("nome"),
      descricao: formData.get("descricao") || null,
      unidade_medida: formData.get("unidade_medida") || null,
      categoria: formData.get("categoria") || null,
      preco_custo: parseFloat(formData.get("preco_custo")) || 0,
      preco_venda: parseFloat(formData.get("preco_venda")) || 0,
      peso: parseFloat(formData.get("peso")) || 0,
      codigo_barras: formData.get("codigo_barras") || null,
      referencia_interna: formData.get("referencia_interna") || null,
      estoque_minimo: parseFloat(formData.get("estoque_minimo")) || 0,
      ponto_reposicao: parseFloat(formData.get("ponto_reposicao")) || 0,
      permite_venda_sem_estoque: formData.get("permite_venda_sem_estoque") === "on",
    };

    onSubmit(data);
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Produto" : "Novo Produto"}
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="md"
    >
      <form id="produto-form">
        <FormSection title="Identificação">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="codigo" label="Código" defaultValue={produto?.codigo || ""} fullWidth required size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 9 }}>
              <TextField name="nome" label="Nome" defaultValue={produto?.nome || ""} fullWidth required size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="codigo_barras" label="Código de barras" defaultValue={produto?.codigo_barras || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="referencia_interna" label="Referência interna" defaultValue={produto?.referencia_interna || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="categoria" label="Categoria" defaultValue={produto?.categoria || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField name="descricao" label="Descrição" defaultValue={produto?.descricao || ""} fullWidth multiline rows={2} size="small" />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Preços e medidas">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="unidade_medida" label="Unidade" defaultValue={produto?.unidade_medida || ""} select fullWidth size="small">
                <MenuItem value=""><em>—</em></MenuItem>
                {UNIDADES.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="preco_custo" label="Preço custo" type="number" defaultValue={produto?.preco_custo || 0} fullWidth size="small" slotProps={{ input: { inputProps: { min: 0, step: "0.01" } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="preco_venda" label="Preço venda" type="number" defaultValue={produto?.preco_venda || 0} fullWidth size="small" slotProps={{ input: { inputProps: { min: 0, step: "0.01" } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="peso" label="Peso (kg)" type="number" defaultValue={produto?.peso || 0} fullWidth size="small" slotProps={{ input: { inputProps: { min: 0, step: "0.001" } } }} />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Estoque">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="estoque_minimo" label="Estoque mínimo" type="number" defaultValue={produto?.estoque_minimo || 0} fullWidth size="small" slotProps={{ input: { inputProps: { min: 0, step: "0.001" } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="ponto_reposicao" label="Ponto de reposição" type="number" defaultValue={produto?.ponto_reposicao || 0} fullWidth size="small" slotProps={{ input: { inputProps: { min: 0, step: "0.001" } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={<Switch name="permite_venda_sem_estoque" defaultChecked={produto?.permite_venda_sem_estoque || false} />}
                label="Venda sem estoque"
              />
            </Grid>
          </Grid>
        </FormSection>
      </form>
    </FormDialog>
  );
}
