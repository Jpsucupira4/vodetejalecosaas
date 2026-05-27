# Vodete Jalecos — Sistema de Gestão ERP

Sistema completo para gestão de vendas, estoque, clientes e despesas.
Construído com **React + TypeScript + Vite + Supabase**.

---

## Estrutura do Projeto

```
vodete-jalecos/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── schema.sql                  ← SQL para aplicar no Supabase
└── src/
    ├── main.tsx
    ├── App.tsx                 ← Root: auth + navegação
    ├── styles/
    │   └── global.css
    ├── types/
    │   └── index.ts            ← Profile, Product, Sale, Customer, Expense
    ├── lib/
    │   ├── supabase.ts         ← Cliente Supabase
    │   ├── constants.ts        ← Categorias, pagamentos, frete
    │   ├── helpers.ts          ← fmt, fmtDate, toCamel, toSnake
    │   └── storage.ts          ← Todas as operações de banco
    ├── hooks/
    │   └── useToast.ts
    ├── components/
    │   ├── Modal.tsx
    │   ├── InputGroup.tsx
    │   ├── StockBadge.tsx
    │   ├── EmptyState.tsx
    │   └── StatCard.tsx
    └── pages/
        ├── PageDashboard.tsx
        ├── PageEstoque.tsx
        ├── PageVendas.tsx
        ├── PageHistorico.tsx
        ├── PageClientes.tsx
        ├── PageVendedoras.tsx
        ├── PageDespesas.tsx
        └── PageRelatorios.tsx
```

---

## Instalação e Execução

### Pré-requisitos
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Passos

```bash
# 1. Entrar na pasta do projeto
cd vodete-jalecos

# 2. Instalar dependências
pnpm install

# 3. Rodar em modo desenvolvimento
pnpm dev
```

O app abre em `http://localhost:5173`

### Build de produção

```bash
pnpm build
pnpm preview    # prévia local do build
```

---

## Configuração do Supabase

O banco já está configurado em `https://becipbicizqgexlpkjzb.supabase.co`.

Se precisar recriar o schema em outro projeto:
1. Abra o **SQL Editor** no painel do Supabase
2. Cole e execute o conteúdo de `schema.sql`
3. Crie o primeiro admin:
   - Vá em **Authentication → Users → Add User**
   - Crie o usuário e copie o UUID gerado
   - Execute no SQL Editor:
     ```sql
     INSERT INTO profiles (id, name, email, role)
     VALUES ('COLE_O_UUID_AQUI', 'Administradora', 'admin@vodete.com', 'admin');
     ```

---

## Funcionalidades

| Módulo | Vendedora | Admin |
|---|---|---|
| Dashboard | ✅ (próprias vendas) | ✅ (visão completa + lucro líquido) |
| Estoque | 👁️ leitura | ✅ CRUD completo |
| Registrar Venda | ✅ | ✅ |
| Histórico | 👁️ próprias vendas | ✅ todas + filtro por vendedora |
| Clientes | ✅ | ✅ |
| Vendedoras | ✗ | ✅ |
| Despesas | ✗ | ✅ |
| Relatórios | ✗ | ✅ |

### Regras de negócio
- **Precificação dupla**: cada produto tem preço Varejo e Atacado
- **Tipo de venda**: Varejo ou Atacado selecionável no PDV
- **Fretes**: Excursão (R$10 fixo), Motoboy (R$15 fixo), Correios (valor livre)
- **Pagamentos**: PIX, Dinheiro, Cartão Crédito, Cartão Débito, Link de Pagamento
- **Estoque**: decrementado automaticamente ao registrar venda; alertas de estoque baixo
- **RLS**: cada vendedora vê apenas suas próprias vendas
