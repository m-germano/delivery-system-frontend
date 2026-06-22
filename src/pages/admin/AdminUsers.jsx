import FeaturePlaceholder from '../../components/ui/FeaturePlaceholder.jsx';

export default function AdminUsers() {
  return (
    <FeaturePlaceholder
      title="Usuários"
      description="Consulta administrativa de usuários cadastrados e seus perfis."
      endpoint="GET /users ou rota administrativa equivalente"
    />
  );
}
