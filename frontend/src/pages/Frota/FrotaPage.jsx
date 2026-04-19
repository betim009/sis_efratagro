import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { MdDirectionsCar } from "react-icons/md";

export default function FrotaPage() {
  return (
    <>
      <PageHeader title="Frota" subtitle="Gerenciamento de veículos e manutenções" />
      <EmptyState
        icon={MdDirectionsCar}
        title="Módulo de frota"
        description="Cadastro de veículos, manutenções e controle de frota serão implementados aqui."
      />
    </>
  );
}
