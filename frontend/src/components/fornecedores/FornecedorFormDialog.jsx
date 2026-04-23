import { Alert, Grid, MenuItem, TextField } from "@mui/material";
import FormDialog from "../common/FormDialog";
import FormSection from "../common/FormSection";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function FornecedorFormDialog({
  open,
  fornecedor,
  loading = false,
  error = null,
  statusRouteEnabled = false,
  onClose,
  onSubmit,
}) {
  const isEdit = Boolean(fornecedor?.id);

  const handleSubmit = () => {
    const form = document.getElementById("fornecedor-form");
    const formData = new FormData(form);

    onSubmit({
      razao_social: formData.get("razao_social"),
      nome_fantasia: formData.get("nome_fantasia") || null,
      tipo_pessoa: formData.get("tipo_pessoa") || "PJ",
      cnpj_cpf: formData.get("cnpj_cpf"),
      inscricao_estadual: formData.get("inscricao_estadual") || null,
      email: formData.get("email") || null,
      telefone: formData.get("telefone") || null,
      contato_responsavel: formData.get("contato_responsavel") || null,
      observacoes: formData.get("observacoes") || null,
      status: formData.get("status") || "ATIVO",
      endereco: {
        cep: formData.get("cep") || null,
        logradouro: formData.get("logradouro") || null,
        numero: formData.get("numero") || null,
        complemento: formData.get("complemento") || null,
        bairro: formData.get("bairro") || null,
        cidade: formData.get("cidade") || null,
        estado: formData.get("estado") || null,
      },
    });
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar fornecedor" : "Novo fornecedor"}
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="md"
    >
      <form id="fornecedor-form">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormSection title="Dados principais">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                name="razao_social"
                label="Razão social"
                defaultValue={fornecedor?.razao_social || ""}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="tipo_pessoa"
                label="Tipo"
                defaultValue={fornecedor?.tipo_pessoa || "PJ"}
                select
                fullWidth
                size="small"
              >
                <MenuItem value="PJ">Pessoa jurídica</MenuItem>
                <MenuItem value="PF">Pessoa física</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="nome_fantasia"
                label="Nome fantasia"
                defaultValue={fornecedor?.nome_fantasia || ""}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="cnpj_cpf"
                label="CNPJ / CPF"
                defaultValue={fornecedor?.cnpj_cpf || ""}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="inscricao_estadual"
                label="Inscrição estadual"
                defaultValue={fornecedor?.inscricao_estadual || ""}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="telefone"
                label="Telefone"
                defaultValue={fornecedor?.telefone || ""}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="contato_responsavel"
                label="Contato responsável"
                defaultValue={fornecedor?.contato_responsavel || ""}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                name="email"
                label="E-mail"
                type="email"
                defaultValue={fornecedor?.email || ""}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="status"
                label="Status"
                defaultValue={fornecedor?.status || "ATIVO"}
                select
                fullWidth
                size="small"
              >
                <MenuItem value="ATIVO">Ativo</MenuItem>
                <MenuItem value="INATIVO">Inativo</MenuItem>
                {statusRouteEnabled && <MenuItem value="BLOQUEADO">Bloqueado</MenuItem>}
              </TextField>
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Endereço">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="cep" label="CEP" defaultValue={fornecedor?.endereco?.cep || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField name="logradouro" label="Logradouro" defaultValue={fornecedor?.endereco?.logradouro || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField name="numero" label="Número" defaultValue={fornecedor?.endereco?.numero || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="complemento" label="Complemento" defaultValue={fornecedor?.endereco?.complemento || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="bairro" label="Bairro" defaultValue={fornecedor?.endereco?.bairro || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="cidade" label="Cidade" defaultValue={fornecedor?.endereco?.cidade || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField name="estado" label="UF" defaultValue={fornecedor?.endereco?.estado || ""} select fullWidth size="small">
                <MenuItem value=""><em>—</em></MenuItem>
                {UFS.map((uf) => (
                  <MenuItem key={uf} value={uf}>
                    {uf}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Observações">
          <TextField
            name="observacoes"
            label="Observações"
            defaultValue={fornecedor?.observacoes || ""}
            fullWidth
            multiline
            rows={4}
            size="small"
          />
        </FormSection>
      </form>
    </FormDialog>
  );
}
