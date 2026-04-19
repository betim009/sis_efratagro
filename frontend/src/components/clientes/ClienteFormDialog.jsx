import { Grid, TextField, MenuItem } from "@mui/material";
import FormDialog from "../../components/common/FormDialog";
import FormSection from "../../components/common/FormSection";

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function ClienteFormDialog({ open, onClose, onSubmit, cliente, loading }) {
  const isEdit = !!cliente?.id;

  const handleSubmit = () => {
    const form = document.getElementById("cliente-form");
    const formData = new FormData(form);

    const data = {
      nome_razao_social: formData.get("nome_razao_social"),
      cpf_cnpj: formData.get("cpf_cnpj"),
      email: formData.get("email") || null,
      telefone: formData.get("telefone") || null,
      tipo_cliente: formData.get("tipo_cliente") || "PF",
      limite_credito: parseFloat(formData.get("limite_credito")) || 0,
      observacoes: formData.get("observacoes") || null,
      endereco: {
        cep: formData.get("cep") || null,
        logradouro: formData.get("logradouro") || null,
        numero: formData.get("numero") || null,
        complemento: formData.get("complemento") || null,
        bairro: formData.get("bairro") || null,
        cidade: formData.get("cidade") || null,
        estado: formData.get("estado") || null,
      },
    };

    onSubmit(data);
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Cliente" : "Novo Cliente"}
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="md"
    >
      <form id="cliente-form">
        <FormSection title="Dados principais">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                name="nome_razao_social"
                label="Nome / Razão Social"
                defaultValue={cliente?.nome_razao_social || ""}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="tipo_cliente"
                label="Tipo"
                defaultValue={cliente?.tipo_cliente || "PF"}
                select
                fullWidth
                size="small"
              >
                <MenuItem value="PF">Pessoa Física</MenuItem>
                <MenuItem value="PJ">Pessoa Jurídica</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="cpf_cnpj"
                label="CPF / CNPJ"
                defaultValue={cliente?.cpf_cnpj || ""}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="email"
                label="E-mail"
                type="email"
                defaultValue={cliente?.email || ""}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="telefone"
                label="Telefone"
                defaultValue={cliente?.telefone || ""}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="limite_credito"
                label="Limite de crédito"
                type="number"
                defaultValue={cliente?.limite_credito || 0}
                fullWidth
                size="small"
                slotProps={{ input: { inputProps: { min: 0, step: "0.01" } } }}
              />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Endereço">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="cep" label="CEP" defaultValue={cliente?.endereco?.cep || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField name="logradouro" label="Logradouro" defaultValue={cliente?.endereco?.logradouro || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField name="numero" label="Número" defaultValue={cliente?.endereco?.numero || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="complemento" label="Complemento" defaultValue={cliente?.endereco?.complemento || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="bairro" label="Bairro" defaultValue={cliente?.endereco?.bairro || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField name="cidade" label="Cidade" defaultValue={cliente?.endereco?.cidade || ""} fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField name="estado" label="UF" defaultValue={cliente?.endereco?.estado || ""} select fullWidth size="small">
                <MenuItem value=""><em>—</em></MenuItem>
                {UFS.map((uf) => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Observações">
          <TextField
            name="observacoes"
            label="Observações"
            defaultValue={cliente?.observacoes || ""}
            fullWidth
            multiline
            rows={3}
            size="small"
          />
        </FormSection>
      </form>
    </FormDialog>
  );
}
