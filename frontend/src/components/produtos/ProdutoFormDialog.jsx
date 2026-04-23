import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  FormControlLabel,
  Switch,
} from "@mui/material";
import FormDialog from "../../components/common/FormDialog";
import FormSection from "../../components/common/FormSection";
import produtoService from "../../services/produtoService";

const UNIDADES = ["UN", "KG", "LT", "CX", "PCT", "SC", "TON", "ML", "M", "M2", "M3"];

const COMMON_CATEGORIES = [
  "Alimentos",
  "Bebidas",
  "Higiene",
  "Limpeza",
  "Embalagens",
  "Insumos",
  "Grãos",
  "Fertilizantes",
  "Defensivos",
  "Ferramentas",
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function categoryPrefix(value) {
  const normalized = normalizeText(value);
  if (!normalized) return "";

  const words = normalized.split(" ").filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 3).padEnd(3, "X");
  }

  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .padEnd(3, "X");
}

function nameReference(value) {
  const normalized = normalizeText(value);
  if (!normalized) return "ITEM";

  return normalized
    .split(" ")
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => part.slice(0, 6))
    .join("-");
}

const CATEGORY_PREFIX_MAP = {
  ALIMENTOS: "ALI",
  BEBIDAS: "BEB",
  HIGIENE: "HIG",
  LIMPEZA: "LIM",
  EMBALAGENS: "EMB",
  INSUMOS: "INS",
  GRAOS: "GRA",
  FERTILIZANTES: "FER",
  DEFENSIVOS: "DEF",
  FERRAMENTAS: "FERA",
  PAPELARIA: "PAP",
  UTILIDADES: "UTE",
  HORTIFRUTI: "HOR",
};

function resolveCategoryPrefix(category, name) {
  const normalizedCategory = normalizeText(category);

  if (normalizedCategory && CATEGORY_PREFIX_MAP[normalizedCategory]) {
    return CATEGORY_PREFIX_MAP[normalizedCategory];
  }

  if (normalizedCategory) {
    return categoryPrefix(normalizedCategory);
  }

  return categoryPrefix(name);
}

function nextCodeNumber(products, prefix) {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const matches = products
    .map((item) => pattern.exec(String(item.codigo || "").toUpperCase()))
    .filter(Boolean)
    .map((match) => Number(match[1]));

  const next = matches.length ? Math.max(...matches) + 1 : 1;
  return String(next).padStart(4, "0");
}

function buildUniqueCode(products, prefix, excludeProductId = null) {
  const normalizedPrefix = String(prefix || "PRD").toUpperCase();
  const filteredProducts = products.filter((item) => item.id !== excludeProductId);
  const existingCodes = new Set(
    filteredProducts.map((item) => String(item.codigo || "").toUpperCase())
  );

  let sequence = Number(nextCodeNumber(filteredProducts, normalizedPrefix));
  let candidate = `${normalizedPrefix}-${String(sequence).padStart(4, "0")}`;

  while (existingCodes.has(candidate)) {
    sequence += 1;
    candidate = `${normalizedPrefix}-${String(sequence).padStart(4, "0")}`;
  }

  return candidate;
}

function barcodeHelper(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits.length) {
    return "Aceita leitor ou colagem. O campo remove caracteres não numéricos.";
  }

  const validLengths = [8, 12, 13, 14];
  return validLengths.includes(digits.length)
    ? `Código com ${digits.length} dígitos.`
    : `Código com ${digits.length} dígitos. Padrões comuns: 8, 12, 13 ou 14.`;
}

export default function ProdutoFormDialog({ open, onClose, onSubmit, produto, loading }) {
  const isEdit = !!produto?.id;
  const [existingProducts, setExistingProducts] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precoCusto, setPrecoCusto] = useState(0);
  const [precoVenda, setPrecoVenda] = useState(0);
  const [peso, setPeso] = useState(0);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [referenciaInterna, setReferenciaInterna] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState(0);
  const [pontoReposicao, setPontoReposicao] = useState(0);
  const [permiteVendaSemEstoque, setPermiteVendaSemEstoque] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = setTimeout(() => {
      setCodigo(produto?.codigo || "");
      setNome(produto?.nome || "");
      setDescricao(produto?.descricao || "");
      setUnidadeMedida(produto?.unidade_medida || "");
      setCategoria(produto?.categoria || "");
      setPrecoCusto(produto?.preco_custo || 0);
      setPrecoVenda(produto?.preco_venda || 0);
      setPeso(produto?.peso || 0);
      setCodigoBarras(produto?.codigo_barras || "");
      setReferenciaInterna(produto?.referencia_interna || "");
      setEstoqueMinimo(produto?.estoque_minimo || 0);
      setPontoReposicao(produto?.ponto_reposicao || 0);
      setPermiteVendaSemEstoque(produto?.permite_venda_sem_estoque || false);
    }, 0);

    return () => clearTimeout(timer);
  }, [open, produto]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadSuggestions = async () => {
      setLoadingSuggestions(true);

      try {
        const allItems = [];
        let currentPage = 1;
        let totalPages = 1;

        do {
          const response = await produtoService.listar({
            page: currentPage,
            limit: 100,
            include_inativos: "true",
          });

          const items = response.data?.items || [];
          const pagination = response.data?.pagination || {};

          allItems.push(...items);
          totalPages = pagination.total_pages || 1;
          currentPage += 1;
        } while (currentPage <= totalPages && currentPage <= 10);

        setExistingProducts(allItems);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    void loadSuggestions();
  }, [open]);

  const categoryOptions = useMemo(() => {
    const dynamicCategories = existingProducts
      .map((item) => item.categoria)
      .filter(Boolean);

    return [...new Set([...COMMON_CATEGORIES, ...dynamicCategories])].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [existingProducts]);

  const generatedCodeSuggestion = useMemo(() => {
    const prefix = resolveCategoryPrefix(categoria, nome);

    if (!prefix) {
      return "";
    }

    return buildUniqueCode(existingProducts, prefix, produto?.id || null);
  }, [categoria, nome, existingProducts, produto?.id]);

  const generatedReferenceSuggestion = useMemo(() => {
    const categoryPart = resolveCategoryPrefix(categoria, nome) || "ITEM";
    const namePart = nameReference(nome || "ITEM");
    return `${categoryPart}-${namePart}`;
  }, [categoria, nome]);

  const similarCodes = useMemo(() => {
    const prefix = resolveCategoryPrefix(categoria, nome);

    if (!prefix) {
      return [];
    }

    return existingProducts
      .filter((item) => item.id !== produto?.id)
      .filter((item) => String(item.codigo || "").toUpperCase().startsWith(prefix))
      .slice(0, 4)
      .map((item) => item.codigo);
  }, [categoria, nome, existingProducts, produto?.id]);

  const codigoJaExiste = useMemo(() => {
    const normalizedCodigo = String(codigo || "").trim().toUpperCase();
    if (!normalizedCodigo) {
      return false;
    }

    return existingProducts.some(
      (item) =>
        item.id !== produto?.id &&
        String(item.codigo || "").trim().toUpperCase() === normalizedCodigo
    );
  }, [codigo, existingProducts, produto?.id]);

  const handleSubmit = () => {
    const data = {
      codigo,
      nome,
      descricao: descricao || null,
      unidade_medida: unidadeMedida || null,
      categoria: categoria || null,
      preco_custo: parseFloat(precoCusto) || 0,
      preco_venda: parseFloat(precoVenda) || 0,
      peso: parseFloat(peso) || 0,
      codigo_barras: codigoBarras || null,
      referencia_interna: referenciaInterna || null,
      estoque_minimo: parseFloat(estoqueMinimo) || 0,
      ponto_reposicao: parseFloat(pontoReposicao) || 0,
      permite_venda_sem_estoque: permiteVendaSemEstoque,
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
      <FormSection title="Identificação">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Autocomplete
              freeSolo
              options={categoryOptions}
              value={categoria}
              onInputChange={(_, value) => setCategoria(value)}
              onChange={(_, value) => setCategoria(value || "")}
              loading={loadingSuggestions}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="categoria"
                  label="Categoria"
                  fullWidth
                  required
                  size="small"
                  helperText="Primeiro passo: escolha a categoria para orientar o código."
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              name="codigo"
              label="Código"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value.toUpperCase())}
              fullWidth
              required
              size="small"
              error={codigoJaExiste}
              helperText={
                codigoJaExiste
                  ? "Esse código já existe. Use a sugestão ou ajuste o final."
                  : categoria
                    ? "Código curto para busca rápida."
                    : "Preencha a categoria para gerar uma sugestão melhor."
              }
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={() => setCodigo(generatedCodeSuggestion)}
                        disabled={!generatedCodeSuggestion || loadingSuggestions}
                      >
                        Sugerir
                      </Button>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              name="nome"
              label="Nome"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              fullWidth
              required
              size="small"
              helperText="Use o nome comercial que o usuário reconhece no dia a dia."
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              name="codigo_barras"
              label="Código de barras"
              value={codigoBarras}
              onChange={(event) => setCodigoBarras(event.target.value.replace(/\D/g, ""))}
              fullWidth
              size="small"
              helperText={barcodeHelper(codigoBarras)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              name="referencia_interna"
              label="Referência interna"
              value={referenciaInterna}
              onChange={(event) =>
                setReferenciaInterna(
                  event.target.value.toUpperCase().replace(/\s+/g, "-")
                )
              }
              fullWidth
              size="small"
              helperText="Útil para catálogo interno, etiqueta e estoque."
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={() => setReferenciaInterna(generatedReferenceSuggestion)}
                        disabled={!generatedReferenceSuggestion}
                      >
                        Gerar
                      </Button>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          {(generatedCodeSuggestion || generatedReferenceSuggestion || similarCodes.length > 0) && (
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {generatedCodeSuggestion && (
                  <Chip
                    label={`Código sugerido: ${generatedCodeSuggestion}`}
                    color="primary"
                    variant="outlined"
                    onClick={() => setCodigo(generatedCodeSuggestion)}
                  />
                )}
                {generatedReferenceSuggestion && (
                  <Chip
                    label={`Referência sugerida: ${generatedReferenceSuggestion}`}
                    color="default"
                    variant="outlined"
                    onClick={() => setReferenciaInterna(generatedReferenceSuggestion)}
                  />
                )}
                {similarCodes.map((item) => (
                  <Chip
                    key={item}
                    label={`Parecido já usado: ${item}`}
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <TextField
              name="descricao"
              label="Descrição"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection title="Preços e medidas">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              name="unidade_medida"
              label="Unidade"
              value={unidadeMedida}
              onChange={(event) => setUnidadeMedida(event.target.value)}
              select
              fullWidth
              size="small"
            >
              <MenuItem value="">
                <em>—</em>
              </MenuItem>
              {UNIDADES.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unit}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              name="preco_custo"
              label="Preço custo"
              type="number"
              value={precoCusto}
              onChange={(event) => setPrecoCusto(event.target.value)}
              fullWidth
              size="small"
              slotProps={{ input: { inputProps: { min: 0, step: "0.01" } } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              name="preco_venda"
              label="Preço venda"
              type="number"
              value={precoVenda}
              onChange={(event) => setPrecoVenda(event.target.value)}
              fullWidth
              size="small"
              slotProps={{ input: { inputProps: { min: 0, step: "0.01" } } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              name="peso"
              label="Peso (kg)"
              type="number"
              value={peso}
              onChange={(event) => setPeso(event.target.value)}
              fullWidth
              size="small"
              slotProps={{ input: { inputProps: { min: 0, step: "0.001" } } }}
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection title="Estoque">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              name="estoque_minimo"
              label="Estoque mínimo"
              type="number"
              value={estoqueMinimo}
              onChange={(event) => setEstoqueMinimo(event.target.value)}
              fullWidth
              size="small"
              slotProps={{ input: { inputProps: { min: 0, step: "0.001" } } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              name="ponto_reposicao"
              label="Ponto de reposição"
              type="number"
              value={pontoReposicao}
              onChange={(event) => setPontoReposicao(event.target.value)}
              fullWidth
              size="small"
              slotProps={{ input: { inputProps: { min: 0, step: "0.001" } } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={
                <Switch
                  name="permite_venda_sem_estoque"
                  checked={permiteVendaSemEstoque}
                  onChange={(event) => setPermiteVendaSemEstoque(event.target.checked)}
                />
              }
              label="Venda sem estoque"
            />
          </Grid>
        </Grid>
      </FormSection>

      <Box
        sx={{
          mt: 1,
          px: 0.5,
          color: "text.secondary",
          fontSize: 12,
        }}
      >
        Dica: comece pelo nome e categoria. O formulário sugere código e referência com base no padrão já usado no cadastro.
      </Box>
    </FormDialog>
  );
}
