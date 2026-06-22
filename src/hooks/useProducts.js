import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../services/api.js';
import { productService } from '../services/productService.js';

export function useProducts(params = {}, options = { enabled: false }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(Boolean(options.enabled));
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await productService.list(params);
      setProducts(Array.isArray(data) ? data : data?.items ?? []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível carregar os produtos.'));
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    if (options.enabled) {
      fetchProducts();
    }
  }, [fetchProducts, options.enabled]);

  return { products, loading, error, refetch: fetchProducts };
}
