# Registro de Sinais Vitais

Site para lançar Pressão Arterial, Frequência Cardíaca, SpO2, Glicemia, Peso,
Ingesta de água e Diurese, gravando cada lançamento em uma planilha do Google
Sheets.

## Configuração

### 1. Criar a planilha

1. Crie uma planilha nova no Google Sheets.
2. Renomeie a primeira aba para `Registros`.
3. Na linha 1, adicione o cabeçalho, uma coluna por célula:
   `Data/Hora | PA Sistólica | PA Diastólica | FC (bpm) | SpO2 (%) | Glicemia (mg/dL) | Peso (kg) | Água (L) | Diurese (ml)`

### 2. Publicar o Apps Script

1. Na planilha, vá em **Extensões > Apps Script**.
2. Apague o conteúdo padrão e cole o conteúdo de `apps-script/Code.gs` deste
   repositório.
3. Salve o projeto.
4. Clique em **Implantar > Nova implantação**.
5. Tipo: **App da Web**. Executar como: **Eu**. Quem tem acesso:
   **Qualquer pessoa**.
6. Clique em **Implantar** e autorize as permissões solicitadas (é a sua
   própria conta Google acessando a sua própria planilha).
7. Copie a **URL do app da Web** gerada.

### 3. Ligar o site à planilha

1. Abra `config.js` neste repositório.
2. Substitua `COLE_AQUI_A_URL_DO_SEU_APPS_SCRIPT` pela URL copiada no passo
   anterior.

### 4. Publicar no GitHub Pages

1. Crie um repositório novo no GitHub e suba os arquivos deste projeto.
2. Vá em **Settings > Pages**.
3. Em **Source**, selecione a branch principal e a pasta raiz (`/`).
4. Salve. Após alguns instantes, o GitHub mostra a URL pública do site
   (formato `https://<seu-usuario>.github.io/<repositorio>/`).
5. Acesse essa URL de qualquer dispositivo, incluindo o celular.

## Testes

Rodar os testes de validação:

```bash
node tests/validation.test.js
```

Testar o formulário localmente sem depender da planilha real: suba o
servidor mock e aponte temporariamente `config.js` para
`http://localhost:8787` (lembre de reverter para o placeholder depois).

```bash
node mock-server.js
```

## Observações de segurança

O link do Apps Script e a URL do GitHub Pages não são secretos — qualquer
pessoa com a URL do site consegue enviar lançamentos. Não compartilhe essas
URLs publicamente.
