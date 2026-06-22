import FeaturePlaceholder from '../../components/ui/FeaturePlaceholder.jsx';

export default function AdminCompanies() {
  return (
    <FeaturePlaceholder
      title="Empresas"
      description="Acompanhamento dos restaurantes parceiros cadastrados na plataforma."
      endpoint="GET /companies"
    />
  );
}
