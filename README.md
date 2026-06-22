# Delivery System — Frontend

Frontend do DishDash/Delivery System, desenvolvido em React com Vite. A aplicação possui telas para cliente, empresa, entregador e administrador, com autenticação, catálogo, carrinho, pedidos, entregas e acompanhamento em tempo real.

## Principais tecnologias

- **React** para construção da interface
- **Vite** como ambiente de desenvolvimento e build
- **Tailwind CSS** para estilização
- **React Router DOM** para rotas
- **Axios** para chamadas HTTP
- **Zustand** para estado global e sessão
- **Lucide React** para ícones
- **React Toastify** para notificações
- **Leaflet / React Leaflet** para mapas
- **WebSocket nativo do navegador** para atualizações em tempo real

## APIs e recursos utilizados

- **Backend FastAPI**: autenticação, empresas, produtos, pedidos e entregas
- **WebSockets**: pedidos da empresa, entregas disponíveis e rastreamento em tempo real
- **Geolocation API do navegador**: compartilhamento de localização pelo entregador
- **OpenStreetMap / Leaflet**: exibição de mapas no frontend
- **OSRM**, via backend: cálculo de rota e distância real por ruas

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do frontend:

```env
VITE_APP_NAME=DishDash
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
```

`VITE_WS_URL` pode ser omitido se o frontend conseguir derivar o endereço WebSocket a partir de `VITE_API_URL`, mas deixá-lo explícito facilita o desenvolvimento.

## Rodando localmente

Instale as dependências:

```bash
npm install
```

Suba o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:5173
```

## Build de produção

```bash
npm run build
```

## Preview do build

```bash
npm run preview
```

## Observações

- O frontend espera que o backend esteja disponível em `http://localhost:8000/api`.
- Para o mapa de acompanhamento funcionar, o pedido precisa estar em entrega e o entregador precisa estar compartilhando localização.
- Para notificações sonoras, o navegador pode exigir uma interação do usuário antes de permitir áudio.
