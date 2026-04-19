import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { MdStore } from "react-icons/md";

export default function FornecedoresPage() {
  return (
    <>
      <PageHeader title="Fornecedores" subtitle="Gerenciamento de fornecedores" />
      <EmptyState
        icon={MdStore}
        title="Módulo de fornecedores"
        description="Listagem, cadastro e edição de fornecedores serão implementados aqui."
      />
    </>
  );
}
