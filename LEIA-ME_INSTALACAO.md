# O CAMINHO — Sistema de Estudo da Bíblia Sagrada

**Criado e desenvolvido por Cleilton Nascimento — todos os direitos reservados.**

Este manual foi escrito para quem **nunca instalou um sistema**. Siga na ordem, sem pular passos.

---

## O que o sistema tem

- Tela de login responsiva (celular, tablet e computador)
- Tema **claro/escuro** pelo botão de **sol e lua** em 3D
- Leitura da Bíblia por livro e capítulo, com letra ajustável
- **Áudio MP3** por capítulo (ou livro inteiro) e **PDF** por capítulo (ou livro inteiro), além de “Ouvir com voz do aparelho” e “PDF / Imprimir” do capítulo
- Estudo detalhado: contexto, resumo, aplicação e perguntas por capítulo
- Favoritos, anotações, busca e progresso de leitura
- Aba **Minuto de Sabedoria**: uma passagem por dia (rodízio automático ou data fixa), pronta para enviar
- **WhatsApp**: envio de capítulo, versículos e Minuto de Sabedoria para um contato, para uma lista do sistema ou para uma lista de transmissão do próprio WhatsApp
- Administração: usuários, PDF/MP3, importação da Bíblia, estudos e Minuto de Sabedoria
- Acessibilidade: navegação por teclado, leitor de tela, alto contraste e letra maior

---

## PARTE 1 — Instalar no seu computador (Windows)

### Passo 1 — Instalar o XAMPP
O XAMPP é um programa gratuito que cria um “servidor” dentro do seu computador.

1. Abra o navegador e pesquise por **XAMPP download**. Entre no site oficial **apachefriends.org**.
2. Baixe a versão para **Windows** e instale clicando em **Next** até o fim (pode deixar tudo como está).
3. Ao terminar, abra o programa **XAMPP Control Panel**.

### Passo 2 — Ligar o servidor
No XAMPP Control Panel, clique em **Start** ao lado de **Apache** e de **MySQL**. Os dois nomes ficam com fundo **verde**.

### Passo 3 — Colocar o sistema no lugar certo
1. Extraia o arquivo **ocaminho.zip** (botão direito → *Extrair tudo*).
2. Copie a pasta **ocaminho** inteira.
3. Cole dentro de **C:\xampp\htdocs**.
   No final deve existir: `C:\xampp\htdocs\ocaminho\index.html`

### Passo 4 — Criar o banco de dados
1. No navegador, abra: **http://localhost/phpmyadmin**
2. Clique na aba **Importar** (no topo).
3. Clique em **Escolher arquivo** e selecione: `C:\xampp\htdocs\ocaminho\sql\ocaminho.sql`
4. Role até o final e clique em **Importar** (ou *Executar*).
5. Aparece uma mensagem verde. À esquerda surge o banco **ocaminho**.

### Passo 5 — Entrar no sistema
1. Abra: **http://localhost/ocaminho/**
2. Usuário: **admin**  Senha: **caminho123**
3. **Troque a senha agora:** menu **Conta → Trocar senha**.

Pronto! Se aparecer a tela inicial com o Minuto de Sabedoria, está funcionando.

---

## PARTE 2 — Colocar o texto completo da Bíblia

O sistema vem só com **alguns capítulos de exemplo** (Gênesis 1:1-5, Salmo 1, Salmo 23 e João 1:1-5). O texto completo você carrega uma vez:

1. Consiga o texto da Bíblia em um arquivo **.csv, .txt ou .json**, de uma tradução que você **tenha direito de usar** (por exemplo, uma edição de domínio público, como a Almeida Revista e Corrigida de 1898 — confira sempre a licença da edição).
2. No sistema, entre em **Admin → Importar Bíblia**.
3. Escolha o arquivo e clique em **Importar**. Uma barra mostra o andamento.

**Formato aceito (uma linha por versículo):**

```
João;3;16;Porque Deus amou o mundo de tal maneira...
```
ou
```
João 3:16 Porque Deus amou o mundo de tal maneira...
```
Também aceita JSON (`[{"livro":"João","capitulo":3,"versiculo":16,"texto":"..."}]`) e o formato comum com “name” e “chapters”.

Se algum livro não for reconhecido, o sistema mostra o nome ao final. Importar de novo **não duplica** versículos.

---

## PARTE 3 — Áudio MP3 e PDF

1. Entre em **Admin → PDF e MP3**.
2. Escolha o **tipo** (Áudio MP3 ou PDF), o **livro** e o **capítulo** (ou “Livro inteiro”).
3. Selecione o arquivo e clique em **Enviar arquivo**.

No leitor, o capítulo passa a mostrar o player de áudio (com controle de velocidade) e os botões de PDF.

**Arquivos grandes não sobem?** O limite padrão do XAMPP é pequeno. Faça assim:
1. Abra o arquivo `C:\xampp\php\php.ini` no Bloco de Notas.
2. Procure (Ctrl+F) por `upload_max_filesize` e troque o valor para `100M`.
3. Procure por `post_max_size` e troque para `100M`.
4. Salve e, no XAMPP, clique em **Stop** e depois **Start** no Apache.

---

## PARTE 4 — Como funciona o WhatsApp (leia com atenção)

O sistema **abre o WhatsApp com a mensagem pronta**; quem aperta “enviar” é você. Isso é uma regra do próprio WhatsApp: envio automático em massa só existe pela API oficial do WhatsApp Business (paga e com aprovação), que não faz parte deste sistema.

Existem 3 formas de enviar, todas na janela “Enviar pelo WhatsApp”:

1. **Abrir WhatsApp e escolher** — você escolhe lá um contato, um grupo ou uma **lista de transmissão do WhatsApp**. É o caminho para transmissão de verdade.
2. **Contato salvo** — escolha um contato cadastrado na aba **WhatsApp** e envie.
3. **Lista do sistema** — escolha uma lista que você montou; o sistema mostra cada pessoa com um botão **Enviar** (marca ✓ depois de enviado).

Observações:
- Cadastre telefones com DDD, por exemplo `(85) 99999-9999`. O código do Brasil (55) é adicionado sozinho.
- No computador, o WhatsApp Web ou o aplicativo precisa estar instalado/conectado.
- Textos muito longos (capítulos grandes) são divididos em partes automaticamente; envie na ordem.
- Na lista de transmissão do WhatsApp, só recebem a mensagem as pessoas que salvaram o seu número.

---

## PARTE 5 — Colocar na internet (hospedagem)

1. Contrate uma hospedagem com **PHP 8 e MySQL** (cPanel, por exemplo) e, de preferência, **certificado HTTPS** (cadeado).
2. No cPanel, abra **Bancos de Dados MySQL**: crie um banco, um usuário e vincule o usuário ao banco com todos os privilégios. Anote os três nomes e a senha.
3. Abra o arquivo `sql/ocaminho.sql` no Bloco de Notas e **apague as duas linhas** que começam com `CREATE DATABASE` e `USE`. Salve.
4. No **phpMyAdmin** da hospedagem, clique no banco criado e use **Importar** com esse arquivo.
5. Edite `api/config.php` com os dados da hospedagem (`DB_NAME`, `DB_USER`, `DB_PASS`).
6. Envie toda a pasta `ocaminho` pelo **Gerenciador de Arquivos** (pasta `public_html`).
7. Acesse `https://seusite.com.br/ocaminho/` e troque a senha do **admin**.

---

## Problemas comuns

| O que aparece | O que fazer |
|---|---|
| “Não foi possível conectar ao banco de dados” | Confira se o **MySQL** está verde no XAMPP e se os dados em `api/config.php` estão certos. |
| Página em branco ou “não encontrada” | Confira se a pasta está em `htdocs\ocaminho` e se o **Apache** está verde. |
| Apache não liga | Outro programa usa a porta 80 (Skype, IIS). Feche-o ou mude a porta no XAMPP. |
| “Usuário ou senha incorretos” | Use `admin` / `caminho123` (ou a senha que você trocou). Após 6 erros, aguarde 5 minutos. |
| Capítulo sem texto | Faça a **Parte 2** (importar a Bíblia). |
| Upload de MP3/PDF falha | Faça o ajuste do `php.ini` da **Parte 3** e confira se a pasta `uploads` permite gravação. |
| Esqueci a senha do admin | Peça a outro administrador para redefinir em **Admin → Usuários**. |

---

## Segurança e cópia de segurança

- Troque a senha inicial **no primeiro acesso**.
- Faça **backup** do banco: no phpMyAdmin, selecione `ocaminho` → **Exportar** → **Executar**. Guarde também a pasta `uploads`.
- Use HTTPS sempre que o sistema estiver na internet.

---

## Estrutura de arquivos

```
ocaminho/
├─ index.html            tela de login
├─ app.html              sistema (após o login)
├─ css/style.css         visual, temas claro/escuro, responsivo
├─ js/login.js           lógica do login
├─ js/app.js             leitor, minuto, busca, WhatsApp, conta
├─ js/admin.js           administração
├─ api/api.php           servidor (PHP + MySQL)
├─ api/config.php        dados de conexão com o banco
├─ sql/ocaminho.sql      banco de dados (importar no phpMyAdmin)
└─ uploads/              PDFs e MP3 enviados
```

---

© O Caminho — sistema criado e desenvolvido por **Cleilton Nascimento**. Todos os direitos reservados.
