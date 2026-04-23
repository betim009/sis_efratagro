import { Box, Grid, Paper, Typography } from "@mui/material";
import EmptyState from "../common/EmptyState";
import Loading from "../common/Loading";
import StatusBadge from "../common/StatusBadge";

export default function FornecedorProdutosTab({ loading = false, error = null, data }) {
  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <Typography variant="body2" color="error">
        {error}
      </Typography>
    );
  }

  if (!data?.items?.length) {
    return (
      <EmptyState
        title="Nenhum produto vinculado"
        description="Este fornecedor ainda não possui produtos vinculados na base atual."
      />
    );
  }

  return (
    <Grid container spacing={2}>
      {data.items.map((produto) => (
        <Grid key={produto.id} size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 1 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {produto.nome}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Código: {produto.codigo}
                </Typography>
              </Box>
              <StatusBadge status={produto.status} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Categoria: {produto.categoria || "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Preço de custo: {produto.preco_custo ?? "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vínculo principal: {produto.fornecedor_principal ? "Sim" : "Não"}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
