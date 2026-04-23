import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";
import FormDialog from "../../components/common/FormDialog";
import FormSection from "../../components/common/FormSection";
import produtoService from "../../services/produtoService";
import estoqueService from "../../services/estoqueService";

const TIPOS = [
  { value: "ENTRADA", label: "Entrada" },
  { value: "SAIDA", label: "Saída" },
  { value: "TRANSFERENCIA", label: "Transferência" },
];

const formatProdutoOption = (option) =>
  option ? `#${option.public_id || "?"} • ${option.codigo} • ${option.nome}` : "";

const formatLocalOption = (option) =>
  option ? `#${option.public_id || "?"} • ${option.codigo} • ${option.nome}` : "";

export default function MovimentacaoDialog({
  open,
  onClose,
  onSubmit,
  tipo = "ENTRADA",
  loading,
}) {
  const [tipoMovimentacao, setTipoMovimentacao] = useState(tipo);
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [localOrigemId, setLocalOrigemId] = useState("");
  const [localDestinoId, setLocalDestinoId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [locais, setLocais] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = setTimeout(() => {
      setTipoMovimentacao(tipo);
    }, 0);

    return () => clearTimeout(timer);
  }, [open, tipo]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadOptions = async () => {
      setOptionsLoading(true);

      try {
        const [produtosResponse, locaisResponse] = await Promise.all([
          produtoService.listar({ page: 1, limit: 100 }),
          estoqueService.listarLocais({ page: 1, limit: 100 }),
        ]);

        setProdutos(produtosResponse.data?.items || []);
        setLocais(locaisResponse.data?.items || []);
      } finally {
        setOptionsLoading(false);
      }
    };

    void loadOptions();
  }, [open]);

  const selectedProduto = useMemo(
    () => produtos.find((item) => item.id === produtoId) || null,
    [produtos, produtoId]
  );
  const selectedLocalOrigem = useMemo(
    () => locais.find((item) => item.id === localOrigemId) || null,
    [locais, localOrigemId]
  );
  const selectedLocalDestino = useMemo(
    () => locais.find((item) => item.id === localDestinoId) || null,
    [locais, localDestinoId]
  );

  const resetForm = () => {
    setTipoMovimentacao(tipo);
    setProdutoId("");
    setQuantidade("");
    setLocalOrigemId("");
    setLocalDestinoId("");
    setMotivo("");
    setObservacoes("");
  };

  const closeDialog = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    const data = {
      tipo_movimentacao: tipoMovimentacao,
      produto_id: produtoId,
      quantidade: parseFloat(quantidade) || 0,
      motivo,
      observacoes: observacoes || null,
    };

    if (tipoMovimentacao === "ENTRADA" || tipoMovimentacao === "TRANSFERENCIA") {
      data.local_destino_id = localDestinoId || null;
    }

    if (tipoMovimentacao === "SAIDA" || tipoMovimentacao === "TRANSFERENCIA") {
      data.local_origem_id = localOrigemId || null;
    }

    onSubmit(data);
  };

  return (
    <FormDialog
      open={open}
      onClose={closeDialog}
      title="Nova Movimentação de Estoque"
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="sm"
    >
      <FormSection title="Dados da movimentação">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              name="tipo_movimentacao"
              label="Tipo"
              value={tipoMovimentacao}
              onChange={(event) => setTipoMovimentacao(event.target.value)}
              select
              fullWidth
              required
              size="small"
            >
              {TIPOS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Autocomplete
              options={produtos}
              loading={optionsLoading}
              value={selectedProduto}
              onChange={(_, option) => setProdutoId(option?.id || "")}
              getOptionLabel={formatProdutoOption}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Produto"
                  required
                  size="small"
                  helperText={
                    selectedProduto
                      ? `ID simples: ${selectedProduto.public_id}`
                      : "Busque por nome, código ou ID simples"
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {optionsLoading ? (
                          <CircularProgress color="inherit" size={16} />
                        ) : null}
                        {params.InputProps?.endAdornment || null}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="quantidade"
              label="Quantidade"
              type="number"
              value={quantidade}
              onChange={(event) => setQuantidade(event.target.value)}
              fullWidth
              required
              size="small"
              slotProps={{
                input: { inputProps: { min: 0.001, step: "0.001" } },
              }}
            />
          </Grid>

          {(tipoMovimentacao === "SAIDA" ||
            tipoMovimentacao === "TRANSFERENCIA") && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={locais}
                loading={optionsLoading}
                value={selectedLocalOrigem}
                onChange={(_, option) => setLocalOrigemId(option?.id || "")}
                getOptionLabel={formatLocalOption}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Local de origem"
                    required
                    size="small"
                    helperText={
                      selectedLocalOrigem
                        ? `ID simples: ${selectedLocalOrigem.public_id}`
                        : "Selecione o local de saída"
                    }
                  />
                )}
              />
            </Grid>
          )}

          {(tipoMovimentacao === "ENTRADA" ||
            tipoMovimentacao === "TRANSFERENCIA") && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={locais}
                loading={optionsLoading}
                value={selectedLocalDestino}
                onChange={(_, option) => setLocalDestinoId(option?.id || "")}
                getOptionLabel={formatLocalOption}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Local de destino"
                    required
                    size="small"
                    helperText={
                      selectedLocalDestino
                        ? `ID simples: ${selectedLocalDestino.public_id}`
                        : "Selecione o local de entrada"
                    }
                  />
                )}
              />
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <TextField
              name="motivo"
              label="Motivo"
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              fullWidth
              required
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              name="observacoes"
              label="Observações"
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
            />
          </Grid>
        </Grid>
      </FormSection>
    </FormDialog>
  );
}
