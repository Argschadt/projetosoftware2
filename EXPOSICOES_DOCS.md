# Sistema de Exposições - Documentação

## 📋 Visão Geral

O sistema de exposições permite que administradores criem e publiquem exposições 3D baseadas em arquivos JSON gerados pela ferramenta de visualização Unity.

## 🏗️ Arquitetura

### Estrutura de Pastas

```
/public/exposicoes/          # Armazena os arquivos JSON das exposições
    ├── Mapa1.json
    ├── Mapa2.json
    └── ...

/src/pages/
    ├── Admin.tsx            # Painel de administração (PROTEGIDO)
    ├── Admin.css
    ├── Exposicoes.tsx       # Lista pública de exposições
    ├── Exposicoes.css
    ├── ExposicaoVisor.tsx   # Visualizador de exposição individual
    └── ExposicaoVisor.css

/src/types/
    └── exposicao.ts         # Tipos TypeScript

/src/utils/
    └── exposicaoUtils.ts    # Funções utilitárias para gerenciar exposições

/src/context/
    └── AuthContext.tsx      # Contexto de autenticação (usado para proteger Admin)
```

## 🔄 Fluxo de Funcionamento

### 1. Admin Criando uma Exposição
```
Admin → Painel Admin → Formulário → Upload JSON → Salvo em /public/exposicoes/
```

### 2. Usuário Visualizando Exposições
```
Usuário → Navbar (Exposições) → Lista de Exposições → Clica em uma → Visualizador
```

## 📁 Estrutura do JSON de Exposição

O arquivo JSON deve conter:

```json
{
  "schemaVersion": 2,
  "appVersion": "0.1.0",
  "sceneBaseId": "DefaultScene",
  "name": "Mapa1",
  "createdAtIso": "2025-11-18T02:02:46.777Z",
  "objects": [...],
  "artworks": [],
  "skyboxMaterialName": "",
  "skyboxPreset": {...}
}
```

## 🛡️ Autenticação

- **Login Admin**: `admin` / `admin123` (configurável em `src/context/AuthContext.tsx`)
- Acesso protegido via `ProtectedRoute` component
- Autenticação mantida em `localStorage`

## 📝 Tipos TypeScript

### Exposicao
```typescript
interface Exposicao {
  id: string;                    // ID único (slug)
  name: string;                  // Nome da exposição
  description: string;           // Descrição
  fileName: string;              // Nome do arquivo JSON
  createdAt: string;             // Data ISO
  author?: string;               // Autor (opcional)
  status: 'published' | 'draft';  // Status de publicação
}
```

### ExposicaoSceneData
Contém a estrutura completa do JSON salvo

### ExposicaoMetadata
Combina `Exposicao` + `ExposicaoSceneData`

## 🔗 Rotas

- `/exposicoes` - Lista pública de exposições (GET)
- `/exposicoes/:id` - Visualizador de exposição específica (GET)
- `/admin` - Painel de administração (PROTEGIDO)

## ⚙️ Como Usar

### Para o Admin:
1. Acesse `/admin` com credenciais (admin/admin123)
2. Clique em "+ Nova Exposição"
3. Preencha os dados da exposição
4. Selecione o arquivo JSON do visualizador
5. Escolha o status (Rascunho ou Publicado)
6. Clique em "Salvar Exposição"

### Para Usuários:
1. Acesse "Exposições" no navbar
2. Veja a lista de exposições publicadas
3. Clique em "Visualizar" para entrar na exposição
4. Explore a cena 3D

## 🚀 Próximos Passos

1. Implementar backend API para gerenciar exposições
2. Integrar com componente Unity existente no `ExposicaoVisor`
3. Adicionar edição e exclusão de exposições
4. Implementar autenticação com backend real
5. Adicionar suporte a múltiplos formatos de arquivo

## 📝 Notas

- As exposições são armazenadas em `/public/exposicoes/` (acesso estático)
- O arquivo `Mapa1.json` está incluído como exemplo
- Sistema pronto para integração com backend real

Nota sobre desenvolvimento local:
- O Vite dev server não executa automaticamente os arquivos `api/*` da mesma forma que o Vercel em produção. Para facilitar o desenvolvimento aqui criamos:
    - `public/exposicoes/index.json` — um índice estático com as exposições públicas.
    - Fallback em `src/utils/exposicaoUtils.ts` para carregar `index.json` se a API `/api/exposicoes?action=list` não estiver disponível.
    - Ao salvar uma exposição no painel Admin, se a API não estiver disponível, a exposição será salva localmente em `localStorage` (chave `localExposicoes`) para teste local e aparecerá na listagem.

Isso permite testar o fluxo Admin → Exposições sem backend em dev. Em produção, a API `/api/exposicoes/*` será responsável por salvar os arquivos JSON em `/public/exposicoes/` e gerenciar o índice.
