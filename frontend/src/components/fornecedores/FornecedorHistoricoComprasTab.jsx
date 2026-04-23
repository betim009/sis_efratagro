import { Box, Grid, Paper, Typography } from "@mui/material";
import EmptyState from "../common/EmptyState";
import Loading from "../common/Loading";

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";

export default function FornecedorHistoricoComprasTab({
  loading = false,
  error = null,
  data,
}) {
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Total de compras
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {data?.summary?.total_compras || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Quantidade comprada
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {Number(data?.summary?.quantidade_total_comprada || 0)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Valor total
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {formatCurrency(data?.summary?.valor_total_compras)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Última compra
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {formatDateTime(data?.summary?.ultima_compra_em)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {data?.historico_compras?.length ? (
        <Grid container spacing={2}>
          {data.historico_compras.map((compra) => (
            <Grid key={compra.id} size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {compra.produto_nome}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Compra: {compra.compra_numero || compra.compra_public_id || compra.public_id || "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quantidade: {Number(compra.quantidade || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Custo unitário: {formatCurrency(compra.custo_unitario)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Valor total: {formatCurrency(compra.valor_total)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Local: {compra.local_destino_nome || "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Data: {formatDateTime(compra.data_movimentacao)}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <EmptyState
          title="Sem histórico de compras"
          description="Nenhuma compra vinculada a este fornecedor foi encontrada."
        />
      )}
    </Box>
  );
}
