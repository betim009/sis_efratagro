import { useEffect, useState } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { MdClose } from "react-icons/md";
import StatusBadge from "../common/StatusBadge";
import Loading from "../common/Loading";
import FornecedorProdutosTab from "./FornecedorProdutosTab";
import FornecedorHistoricoComprasTab from "./FornecedorHistoricoComprasTab";
import fornecedorService from "../../services/fornecedorService";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

function DadosGeraisTab({ fornecedor }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
      {[
        ["Razão social", fornecedor?.razao_social],
        ["Nome fantasia", fornecedor?.nome_fantasia],
        ["CNPJ / CPF", fornecedor?.cnpj_cpf],
        ["Inscrição estadual", fornecedor?.inscricao_estadual],
        ["Telefone", fornecedor?.telefone],
        ["E-mail", fornecedor?.email],
        ["Contato responsável", fornecedor?.contato_responsavel],
        ["Cidade", fornecedor?.endereco?.cidade],
        ["Estado", fornecedor?.endereco?.estado],
        ["CEP", fornecedor?.endereco?.cep],
        ["Logradouro", fornecedor?.endereco?.logradouro],
        ["Número", fornecedor?.endereco?.numero],
        ["Complemento", fornecedor?.endereco?.complemento],
        ["Bairro", fornecedor?.endereco?.bairro],
      ].map(([label, value]) => (
        <Box key={label}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2">{value || "—"}</Typography>
        </Box>
      ))}

      <Box sx={{ gridColumn: { md: "1 / -1" } }}>
        <Typography variant="caption" color="text.secondary">
          Observações
        </Typography>
        <Typography variant="body2">{fornecedor?.observacoes || "—"}</Typography>
      </Box>
    </Box>
  );
}

export default function FornecedorDetailsDialog({
  open,
  fornecedorId,
  onClose,
}) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fornecedor, setFornecedor] = useState(null);
  const [produtosData, setProdutosData] = useState(null);
  const [historicoData, setHistoricoData] = useState(null);

  useEffect(() => {
    if (!open || !fornecedorId) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [fornecedorResponse, produtosResponse, historicoResponse] = await Promise.all([
          fornecedorService.buscarPorId(fornecedorId),
          fornecedorService.listarProdutos(fornecedorId),
          fornecedorService.buscarHistoricoCompras(fornecedorId),
        ]);

        setFornecedor(fornecedorResponse.data || null);
        setProdutosData(produtosResponse.data || null);
        setHistoricoData(historicoResponse.data || null);
      } catch (err) {
        setError(getErrorMessage(err, "Erro ao carregar detalhes do fornecedor."));
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timer);
  }, [fornecedorId, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {fornecedor?.razao_social || "Fornecedor"}
          </Typography>
          {fornecedor?.status && <StatusBadge status={fornecedor.status} />}
        </Box>
        <IconButton onClick={onClose}>
          <MdClose size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Loading />
        ) : error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : (
          <>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
              <Tab label="Dados gerais" />
              <Tab label="Produtos vinculados" />
              <Tab label="Histórico de compras" />
            </Tabs>

            {tab === 0 && <DadosGeraisTab fornecedor={fornecedor} />}
            {tab === 1 && <FornecedorProdutosTab data={produtosData} />}
            {tab === 2 && <FornecedorHistoricoComprasTab data={historicoData} />}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
