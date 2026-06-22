import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CheckCircle2, Pencil, Plus, RefreshCw, Save, Search, Tag, Trash2, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import InputField from '../../components/ui/InputField.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { productService } from '../../services/productService.js';
import { formatCurrency } from '../../utils/formatters.js';

const emptyProductForm = {
  id: null,
  name: '',
  description: '',
  price: '',
  image_url: '',
  category_id: '',
  is_active: true,
};

const emptyCategoryForm = {
  name: '',
  description: '',
  display_order: 0,
};

function toNullableString(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

function productToForm(product) {
  return {
    id: product.id,
    name: product.name ?? '',
    description: product.description ?? '',
    price: product.price ?? '',
    image_url: product.image_url ?? '',
    category_id: product.category_id ? String(product.category_id) : '',
    is_active: Boolean(product.is_active),
  };
}

function ProductCard({ product, onEdit, onDeactivate }) {
  return (
    <article className="app-card overflow-hidden">
      <div className="aspect-[16/9] bg-slate-100">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">Sem imagem</div>
        )}
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-950">{product.name}</h3>
            <p className="mt-1 text-sm font-bold text-orange-600">{formatCurrency(product.price)}</p>
          </div>
          <Badge variant={product.is_active ? 'green' : 'red'}>{product.is_active ? 'Ativo' : 'Inativo'}</Badge>
        </div>

        {product.category?.name ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <Tag className="h-3.5 w-3.5" />
            {product.category.name}
          </div>
        ) : null}

        {product.description ? <p className="line-clamp-3 text-sm leading-6 text-slate-500">{product.description}</p> : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="secondary" onClick={() => onEdit(product)}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          {product.is_active ? (
            <Button variant="danger" onClick={() => onDeactivate(product)}>
              <Trash2 className="h-4 w-4" />
              Desativar
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ProductForm({ form, categories, saving, onChange, onSubmit }) {
  const activeCategories = categories.filter((category) => category.is_active);

  return (
    <form id="product-form" className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          id="product-name"
          label="Nome"
          placeholder="Ex: Pizza margherita"
          value={form.name}
          onChange={(event) => onChange('name', event.target.value)}
          required
        />
        <InputField
          id="product-price"
          label="Preço"
          placeholder="39.90"
          inputMode="decimal"
          value={form.price}
          onChange={(event) => onChange('price', event.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="app-label" htmlFor="product-category">
            Categoria
          </label>
          <select
            id="product-category"
            className="app-input"
            value={form.category_id}
            onChange={(event) => onChange('category_id', event.target.value)}
          >
            <option value="">Sem categoria</option>
            {activeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <InputField
          id="product-image"
          label="URL da imagem"
          placeholder="https://..."
          value={form.image_url}
          onChange={(event) => onChange('image_url', event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="app-label" htmlFor="product-description">
          Descrição
        </label>
        <textarea
          id="product-description"
          className="app-input min-h-28 resize-y"
          placeholder="Ingredientes, tamanho ou observações do produto."
          value={form.description}
          onChange={(event) => onChange('description', event.target.value)}
        />
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(event) => onChange('is_active', event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
        />
        Produto ativo
      </label>

      {saving ? <p className="text-sm font-semibold text-slate-500">Salvando produto...</p> : null}
    </form>
  );
}

function CategoryForm({ form, saving, onChange, onSubmit }) {
  return (
    <form id="category-form" className="space-y-5" onSubmit={onSubmit}>
      <InputField
        id="category-name"
        label="Nome da categoria"
        placeholder="Ex: Pizzas"
        value={form.name}
        onChange={(event) => onChange('name', event.target.value)}
        required
      />
      <InputField
        id="category-order"
        label="Ordem"
        type="number"
        min="0"
        value={form.display_order}
        onChange={(event) => onChange('display_order', event.target.value)}
      />
      <div className="space-y-2">
        <label className="app-label" htmlFor="category-description">
          Descrição
        </label>
        <textarea
          id="category-description"
          className="app-input min-h-20 resize-y"
          value={form.description}
          onChange={(event) => onChange('description', event.target.value)}
        />
      </div>

      {saving ? <p className="text-sm font-semibold text-slate-500">Salvando categoria...</p> : null}
    </form>
  );
}

export default function CompanyProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [error, setError] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const isEditingProduct = Boolean(productForm.id);
  const activeCategories = useMemo(() => categories.filter((category) => category.is_active), [categories]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        productService.list({ include_inactive: true, search: search || undefined }),
        productService.listMyCategories(),
      ]);
      setProducts(productsResponse?.items ?? []);
      setCategories(categoriesResponse ?? []);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Não foi possível carregar os produtos.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateProductField(field, value) {
    setProductForm((current) => ({ ...current, [field]: value }));
  }

  function updateCategoryField(field, value) {
    setCategoryForm((current) => ({ ...current, [field]: value }));
  }

  function openNewProductModal() {
    setProductForm(emptyProductForm);
    setProductModalOpen(true);
  }

  function openEditProductModal(product) {
    setProductForm(productToForm(product));
    setProductModalOpen(true);
  }

  function buildProductPayload() {
    return {
      name: productForm.name.trim(),
      description: toNullableString(productForm.description),
      price: String(productForm.price).replace(',', '.'),
      image_url: toNullableString(productForm.image_url),
      category_id: productForm.category_id ? Number(productForm.category_id) : null,
      is_active: Boolean(productForm.is_active),
    };
  }

  async function handleProductSubmit(event) {
    event.preventDefault();

    if (!productForm.name.trim()) {
      toast.error('Informe o nome do produto.');
      return;
    }

    if (!productForm.price || Number(String(productForm.price).replace(',', '.')) <= 0) {
      toast.error('Informe um preço maior que zero.');
      return;
    }

    setSavingProduct(true);

    try {
      const payload = buildProductPayload();
      if (isEditingProduct) {
        await productService.update(productForm.id, payload);
        toast.success('Produto atualizado com sucesso.');
      } else {
        await productService.create(payload);
        toast.success('Produto cadastrado com sucesso.');
      }

      setProductModalOpen(false);
      setProductForm(emptyProductForm);
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível salvar o produto.'));
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeactivate(product) {
    const confirmDeactivate = window.confirm(`Deseja desativar o produto "${product.name}"?`);
    if (!confirmDeactivate) return;

    try {
      await productService.remove(product.id);
      toast.success('Produto desativado com sucesso.');
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível desativar o produto.'));
    }
  }

  async function handleCategorySubmit(event) {
    event.preventDefault();

    if (!categoryForm.name.trim()) {
      toast.error('Informe o nome da categoria.');
      return;
    }

    setSavingCategory(true);

    try {
      await productService.createCategory({
        name: categoryForm.name.trim(),
        description: toNullableString(categoryForm.description),
        display_order: Number(categoryForm.display_order || 0),
      });
      setCategoryForm(emptyCategoryForm);
      setCategoryModalOpen(false);
      toast.success('Categoria cadastrada com sucesso.');
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível salvar a categoria.'));
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadData();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Cadastre categorias e mantenha os produtos do cardápio atualizados."
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => setCategoryModalOpen(true)}>
              <Tag className="h-4 w-4" />
              Nova categoria
            </Button>
            <Button type="button" onClick={openNewProductModal}>
              <Plus className="h-4 w-4" />
              Novo produto
            </Button>
            <Button type="button" variant="secondary" onClick={loadData} disabled={loading}>
              <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Atualizar
            </Button>
          </>
        }
      />

      {error ? (
        <Alert variant="error" title="Atenção">
          {error.includes('empresa') || error.includes('endereço') || error.includes('latitude') ? (
            <>
              {error}{' '}
              <Link to="/company/settings" className="font-bold underline">
                Configurar empresa
              </Link>
            </>
          ) : (
            error
          )}
        </Alert>
      ) : null}

      <section className="app-card p-4">
        <form className="flex flex-col gap-3 md:flex-row md:items-end" onSubmit={handleSearch}>
          <InputField
            id="product-search"
            label="Buscar produto"
            placeholder="Digite o nome do produto"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button type="submit" variant="secondary" disabled={loading}>
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {activeCategories.length === 0 ? <p className="text-sm text-slate-500">Nenhuma categoria ativa cadastrada.</p> : null}
          {activeCategories.map((category) => (
            <Badge key={category.id} variant="orange">
              {category.name}
            </Badge>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="app-card flex items-center gap-3 p-6 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando produtos...
        </div>
      ) : null}

      {!loading && products.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Nenhum produto cadastrado"
          description="Clique em Novo produto para cadastrar o primeiro item do cardápio."
        />
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onEdit={openEditProductModal} onDeactivate={handleDeactivate} />
        ))}
      </div>

      <Modal
        open={productModalOpen}
        title={isEditingProduct ? 'Editar produto' : 'Novo produto'}
        description="Preencha os dados do produto que será exibido no cardápio."
        onClose={() => setProductModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setProductModalOpen(false)}>
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" form="product-form" disabled={savingProduct || loading}>
              {savingProduct ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditingProduct ? 'Salvar produto' : 'Cadastrar produto'}
            </Button>
          </>
        }
      >
        <ProductForm form={productForm} categories={categories} saving={savingProduct} onChange={updateProductField} onSubmit={handleProductSubmit} />
      </Modal>

      <Modal
        open={categoryModalOpen}
        title="Nova categoria"
        description="Crie uma categoria para organizar os produtos do cardápio."
        onClose={() => setCategoryModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setCategoryModalOpen(false)}>
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" form="category-form" disabled={savingCategory || loading}>
              {savingCategory ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Cadastrar categoria
            </Button>
          </>
        }
      >
        <CategoryForm form={categoryForm} saving={savingCategory} onChange={updateCategoryField} onSubmit={handleCategorySubmit} />
      </Modal>
    </div>
  );
}
