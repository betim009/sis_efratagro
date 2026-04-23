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
import clienteService from "../../services/clienteService";
import fornecedorService from "../../services/fornecedorService";
import produtoService from "../../services/produtoService";
import estoqueService from "../../services/estoqueService";

const TIPOS = [
  { value: "ENTRADA", label: "Entrada por compra" },
  { value: "SAIDA", label: "Saída por venda" },
  { value: "TRANSFERENCIA", label: "Transferência" },
  { value: "AJUSTE", label: "Ajuste" },
  { value: "DEVOLUCAO_FORNECEDOR", label: "Devolução para fornecedor" },
  { value: "DEVOLUCAO_CLIENTE", label: "Devolução de cliente" },
];

const formatProdutoOption = (option) =>
  option ? `#${option.public_id || "?"} • ${option.codigo} • ${option.nome}` : "";

const formatLocalOption = (option) =>
  option ? `#${option.public_id || "?"} • ${option.codigo} • ${option.nome}` : "";

const formatFornecedorOption = (option) =>
  option ? `#${option.public_id || "?"} • ${option.razao_social}` : "";

const formatClienteOption = (option) =>
  option ? `#${option.public_id || "?"} • ${option.nome_razao_social}` : "";

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
  const [custoUnitario, setCustoUnitario] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [localOrigemId, setLocalOrigemId] = useState("");
  const [localDestinoId, setLocalDestinoId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [locais, setLocais] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [clientes, setClientes] = useState([]);
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
        const [produtosResponse, locaisResponse, fornecedoresResponse, clientesResponse] = await Promise.all([
          produtoService.listar({ page: 1, limit: 100 }),
          estoqueService.listarLocais({ page: 1, limit: 100 }),
          fornecedorService.listar({ page: 1, limit: 100, status: "ATIVO" }),
          clienteService.listar({ page: 1, limit: 100 }),
        ]);

        setProdutos(produtosResponse.data?.items || []);
        setLocais(locaisResponse.data?.items || []);
        setFornecedores(fornecedoresResponse.data?.items || []);
        setClientes(clientesResponse.data?.items || []);
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
  const selectedFornecedor = useMemo(
    () => fornecedores.find((item) => item.id === fornecedorId) || null,
    [fornecedores, fornecedorId]
  );
  const selectedCliente = useMemo(
    () => clientes.find((item) => item.id === clienteId) || null,
    [clientes, clienteId]
  );

  const requiresFornecedor =
    tipoMovimentacao === "ENTRADA" || tipoMovimentacao === "DEVOLUCAO_FORNECEDOR";
  const usesCliente =
    tipoMovimentacao === "SAIDA" || tipoMovimentacao === "DEVOLUCAO_CLIENTE";
  const usesLocalOrigem =
    tipoMovimentacao === "SAIDA" ||
    tipoMovimentacao === "TRANSFERENCIA" ||
    tipoMovimentacao === "AJUSTE" ||
    tipoMovimentacao === "DEVOLUCAO_FORNECEDOR";
  const usesLocalDestino =
    tipoMovimentacao === "ENTRADA" ||
    tipoMovimentacao === "TRANSFERENCIA" ||
    tipoMovimentacao === "AJUSTE" ||
    tipoMovimentacao === "DEVOLUCAO_CLIENTE";

  const resetForm = () => {
    setTipoMovimentacao(tipo);
    setProdutoId("");
    setQuantidade("");
    setCustoUnitario("");
    setFornecedorId("");
    setClienteId("");
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

    if (requiresFornecedor) {
      data.fornecedor_id = fornecedorId || null;
    }

    if (usesCliente && clienteId) {
      data.cliente_id = clienteId;
    }

    if (tipoMovimentacao === "ENTRADA") {
      data.custo_unitario = parseFloat(custoUnitario) || 0;
    }

    if (usesLocalDestino) {
      data.local_destino_id = localDestinoId || null;
    }

    if (usesLocalOrigem) {
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

          {requiresFornecedor && (
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                options={fornecedores}
                loading={optionsLoading}
                value={selectedFornecedor}
                onChange={(_, option) => setFornecedorId(option?.id || "")}
                getOptionLabel={formatFornecedorOption}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={tipoMovimentacao === "ENTRADA" ? "Fornecedor da compra" : "Fornecedor destino"}
                    required
                    size="small"
                    helperText={
                      selectedFornecedor
                        ? `ID simples: ${selectedFornecedor.public_id}`
                        : "Selecione um fornecedor ativo"
                    }
                  />
                )}
              />
            </Grid>
          )}

          {usesCliente && (
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                options={clientes}
                loading={optionsLoading}
                value={selectedCliente}
                onChange={(_, option) => setClienteId(option?.id || "")}
                getOptionLabel={formatClienteOption}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cliente"
                    size="small"
                    helperText={
                      selectedCliente
                        ? `ID simples: ${selectedCliente.public_id}`
                        : "Opcional para rastrear o destino/origem cliente"
                    }
                  />
                )}
              />
            </Grid>
          )}

          {tipoMovimentacao === "ENTRADA" && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="custo_unitario"
                label="Custo unitário"
                type="number"
                value={custoUnitario}
                onChange={(event) => setCustoUnitario(event.target.value)}
                fullWidth
                required
                size="small"
                slotProps={{
                  input: { inputProps: { min: 0.01, step: "0.01" } },
                }}
              />
            </Grid>
          )}

          {usesLocalOrigem && (
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
                    required={tipoMovimentacao !== "AJUSTE"}
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

          {usesLocalDestino && (
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
                    required={tipoMovimentacao !== "AJUSTE"}
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
