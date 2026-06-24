# DishDash / Delivery System — Frontend

Frontend do **DishDash / Delivery System**, desenvolvido em **React** com **Vite**.  
A aplicação possui interfaces para cliente, empresa/restaurante e entregador, cobrindo catálogo, carrinho, pedidos, entrega, retirada, pagamentos, avaliações e acompanhamento em tempo real.

## Sumário

- [Principais funcionalidades](#principais-funcionalidades)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Rodando localmente](#rodando-localmente)
- [Build de produção](#build-de-produção)
- [Fluxos da aplicação](#fluxos-da-aplicação)
- [Integração Mercado Pago](#integração-mercado-pago)
- [Mapas e tempo real](#mapas-e-tempo-real)
- [Estrutura geral](#estrutura-geral)
- [Observações](#observações)

## Principais funcionalidades

### Cliente

- Login e cadastro.
- Visualização de restaurantes próximos.
- Visualização de catálogo/produtos.
- Carrinho de compras.
- Escolha entre delivery e retirada, conforme configuração da loja.
- Cálculo de subtotal, taxa de entrega, desconto de retirada e total.
- Pedido mínimo configurado pela empresa.
- Pagamento presencial/na entrega/na retirada.
- Pagamento Pix online via Mercado Pago.
- Tela de QR Code Pix com copia e cola.
- Confirmação de pagamento aprovado.
- Acompanhamento de pedidos.
- Código para confirmar entrega ou retirada.
- Avaliação do restaurante com estrelas de 1 a 5 e comentário.

### Empresa/restaurante

- Cadastro e edição de dados da empresa.
- Configuração de endereço.
- Gerenciamento de produtos.
- Configuração de delivery/retirada:
  - aceita delivery;
  - aceita retirada;
  - aceita ambos;
  - desconto para retirada;
  - pedido mínimo.
- Integração Mercado Pago via OAuth.
- Gestão de pedidos.
- Aceitar, recusar e cancelar pedidos.
- Reembolso automático em pedidos pagos pela plataforma, quando aplicável.
- Controle de status para delivery e retirada.
- Visualização de avaliações recebidas.

### Entregador

- Controle de disponibilidade.
- Visualização de entregas disponíveis.
- Aceite de entregas.
- Atualização de localização.
- Acompanhamento de entrega.
- Confirmação de entrega por código.

## Tecnologias utilizadas

- **React**
- **Vite**
- **Tailwind CSS**
- **React Router DOM**
- **Axios**
- **Zustand**
- **Lucide React**
- **React Toastify**
- **Leaflet / React Leaflet**
- **WebSocket nativo do navegador**

## APIs e recursos utilizados

- **Backend FastAPI**
  - autenticação;
  - empresas;
  - produtos;
  - pedidos;
  - pagamentos;
  - entregas;
  - avaliações.
- **WebSockets**
  - atualizações de pedidos da empresa;
  - entregas disponíveis;
  - rastreamento em tempo real.
- **Geolocation API**
  - compartilhamento de localização pelo entregador.
- **OpenStreetMap / Leaflet**
  - exibição de mapas.
- **Mercado Pago**, via backend
  - OAuth;
  - Pix online;
  - webhook;
  - reembolso.

## Pré-requisitos

- Node.js 18+
- npm
- Backend rodando em `http://localhost:8000`
- Redis/PostgreSQL configurados no backend
- Conta Mercado Pago conectada na empresa, caso queira testar Pix online

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do frontend:

```env
VITE_APP_NAME=DishDash
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
```

Explicação:

- `VITE_APP_NAME`: nome da aplicação exibido no frontend.
- `VITE_API_URL`: URL base da API backend.
- `VITE_WS_URL`: URL base para WebSockets.

Se o backend estiver exposto via ngrok, normalmente o frontend local continua usando `localhost` para chamadas diretas. Use ngrok principalmente para callback OAuth e webhook Mercado Pago no backend.

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

## Fluxos da aplicação

### Checkout delivery

1. Cliente acessa restaurante.
2. Adiciona produtos ao carrinho.
3. Escolhe delivery.
4. Sistema exige endereço ativo.
5. Backend calcula distância e taxa de entrega.
6. Cliente escolhe forma de pagamento:
   - presencial;
   - Pix online, se a loja tiver Mercado Pago conectado.
7. Pedido é criado.
8. Se Pix online:
   - cliente paga via QR Code;
   - após aprovação, pedido é enviado para a loja.
9. Depois da preparação, pedido pode seguir para motoboy.

### Checkout retirada

1. Cliente acessa restaurante.
2. Adiciona produtos ao carrinho.
3. Escolhe retirada.
4. Sistema não exige endereço.
5. Taxa de entrega é zerada.
6. Desconto de retirada é aplicado, se configurado.
7. Cliente escolhe pagamento:
   - presencial/na retirada;
   - Pix online, se a loja tiver Mercado Pago conectado.
8. Pedido é enviado para a loja após pagamento, quando aplicável.
9. Quando a loja marca como pronto, o cliente recebe um código.
10. A loja informa o código para finalizar como retirado.

### Pagamento Pix online

Após o Pix ser aprovado, o frontend deve mostrar uma tela de confirmação:

- pagamento recebido;
- pedido enviado para a loja;
- aviso de que a loja ainda precisa aceitar/preparar;
- aviso de reembolso caso a loja recuse;
- botão para ir para "Meus pedidos".

O frontend não deve redirecionar direto para mapa após o Pix aprovado, porque o pedido ainda pode não ter sido aceito/preparado.

### Avaliações

Depois que um pedido for finalizado:

- o cliente pode avaliar a empresa;
- a nota é selecionada visualmente por estrelas;
- comentário pode ser informado;
- avaliações aparecem no restaurante;
- empresa visualiza avaliações recebidas em uma tela própria.

## Integração Mercado Pago

A integração Mercado Pago é controlada pelo backend. O frontend apenas:

- abre o fluxo de conexão da empresa com Mercado Pago;
- consulta se a empresa tem Pix online disponível;
- chama o endpoint de criação de pedido Pix;
- exibe QR Code e Pix copia e cola;
- acompanha status de pagamento;
- mostra confirmação após pagamento aprovado.

Para testar Pix online:

1. Backend precisa estar com Mercado Pago configurado.
2. Empresa precisa conectar a conta Mercado Pago.
3. `MERCADO_PAGO_WEBHOOK_URL` precisa estar configurada no backend.
4. Portal Mercado Pago precisa apontar para o webhook correto.
5. Cliente cria pedido com Pix online.

## Mapas e tempo real

O mapa de acompanhamento só deve aparecer quando o pedido estiver em um fluxo real de entrega, por exemplo:

- pedido é delivery;
- loja aceitou/preparou;
- entrega foi criada;
- existe motoboy associado ou rota em andamento.

Pedidos de retirada nunca devem ir para tela de mapa/motoboy.

O frontend usa WebSockets para receber atualizações de pedidos e entregas. Para isso, `VITE_WS_URL` deve apontar para o backend.

## Estrutura geral

A organização pode variar conforme evolução do projeto, mas os principais pontos são:

```text
src/
  pages/
    customer/
    company/
    courier/
  services/
  stores/
  components/
  routes/
```

Arquivos comuns no fluxo:

- telas de cliente/restaurante/checkout;
- tela de Pix;
- tela de meus pedidos;
- telas de gestão da empresa;
- tela de avaliações da empresa;
- services de pedidos, empresas, pagamentos, entregas e avaliações.

## Observações

- O frontend espera que o backend esteja disponível em `http://localhost:8000/api`.
- O frontend não deve guardar tokens sensíveis do Mercado Pago.
- O Mercado Pago é integrado pelo backend.
- Para notificações sonoras, o navegador pode exigir interação do usuário antes de permitir áudio.
- Para localização do entregador, o navegador precisa conceder permissão de geolocalização.
- Pedidos de retirada não devem aparecer para motoboy.
- Pedidos Pix aprovados devem ir para confirmação/meus pedidos, não direto para mapa.
