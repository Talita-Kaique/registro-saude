# Design: Site de Registro de Sinais Vitais

## Contexto e Objetivo

O usuário monitora a saúde de outra pessoa (familiar/paciente sob cuidado) e quer
um site simples para lançar medições ao longo do dia, que sejam gravadas
automaticamente em uma planilha do Google Sheets. O site precisa ser acessível
de qualquer lugar, incluindo pelo celular.

## Sinais monitorados

- Pressão Arterial (PA) — sistólica e diastólica
- Frequência Cardíaca (FC)
- Saturação de Oxigênio (SpO2)
- Glicemia
- Peso
- Ingesta de água (litros/dia)
- Diurese

## Estrutura da planilha (Google Sheets)

Uma aba única. Uma linha por lançamento (não por dia — os sinais podem ser
medidos várias vezes ao dia, cada medição vira uma linha própria com seu
horário). Colunas, nesta ordem:

| Coluna | Tipo | Observação |
|---|---|---|
| Data/Hora | datetime | Preenchido automaticamente pelo formulário, editável |
| PA Sistólica | número | mmHg |
| PA Diastólica | número | mmHg |
| FC (bpm) | número | |
| SpO2 (%) | número | |
| Glicemia (mg/dL) | número | |
| Peso (kg) | número | |
| Água (L) | número | litros/dia |
| Diurese (ml) | número | volume em mililitros |

Campos não preenchidos em um lançamento ficam em branco na linha — o
formulário tem um único conjunto de campos e o usuário preenche apenas os que
tiver na hora (não há obrigatoriedade de preencher os 7 sinais em todo envio).

## Arquitetura

**Frontend**: site estático (HTML/CSS/JS puro, sem framework/build step),
responsivo para uso confortável no celular. Hospedado via GitHub Pages.

**Backend**: Google Apps Script vinculado à planilha, publicado como Web App.
Não há servidor próprio nem credenciais de API para gerenciar — a autenticação
fica a cargo da conta Google do usuário no momento do deploy do script.

- `doPost(e)`: recebe os campos do formulário (JSON) e adiciona uma linha na
  planilha, com a data/hora enviada pelo formulário.
- `doGet(e)`: retorna em JSON os últimos N (10) lançamentos, ordenados do mais
  recente para o mais antigo, para o site exibir como histórico.

## Frontend — comportamento

Página única (`index.html`) com:

1. **Formulário de lançamento**
   - Campo de data/hora, pré-preenchido com o momento atual (`datetime-local`),
     editável para lançamentos retroativos
   - PA: dois campos numéricos lado a lado (Sistólica / Diastólica)
   - FC, SpO2, Glicemia, Peso, Água, Diurese: campos numéricos, cada um com a
     unidade exibida ao lado
   - Botão "Registrar"
   - Mensagem de sucesso ou erro exibida após o envio

2. **Histórico**
   - Lista abaixo do formulário com os últimos 10 lançamentos (data/hora +
     valores preenchidos), buscada do Apps Script via `doGet`
   - Atualizada automaticamente ao carregar a página e após cada envio

## Validação e tratamento de erros

- **No navegador, antes de enviar**: nenhum valor negativo; pelo menos um
  campo de sinal vital preenchido além da data/hora (não permite enviar linha
  totalmente vazia)
- **Falha de envio** (sem internet, URL do Apps Script incorreta/indisponível):
  mensagem de erro clara na tela; os valores digitados permanecem no
  formulário (não são limpos) para nova tentativa
- **Falha ao carregar histórico**: a seção de histórico mostra uma mensagem
  discreta de erro, sem bloquear o uso do formulário

## Configuração (passo a passo a ser entregue ao usuário)

1. Criar a planilha no Google Sheets com o cabeçalho definido acima
2. Colar o código do Apps Script (fornecido pronto) no editor de Apps Script
   da planilha
3. Publicar o Apps Script como Web App (acesso: qualquer pessoa com o link)
4. Copiar a URL do Web App gerada e colar na constante de configuração do
   `script.js` do site
5. Criar um repositório no GitHub, subir os arquivos do site, ativar GitHub
   Pages
6. Acessar a URL do GitHub Pages gerada a partir de qualquer dispositivo

## Fora de escopo (YAGNI)

- Múltiplos usuários/pacientes monitorados
- Edição ou exclusão de lançamentos pelo site (feita direto na planilha, se
  necessário)
- Gráficos ou análises de tendência dentro do site
- Autenticação/login no site (o link do GitHub Pages não é secreto; a
  segurança de escrita fica a cargo do link do Apps Script)
