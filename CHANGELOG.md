# Histórico de versões do Brasa

Seguimos o versionamento semântico (MAJOR.MINOR.PATCH). A versão fica em `const BRASA_V` no index.html do site.
- PATCH (0.3.1): correção que não muda o que o usuário vê ou faz.
- MINOR (0.4.0): recurso novo que não quebra nada.
- MAJOR (1.0.0): lançamento público ou mudança que exige ação (ex.: mudar o banco de dados).
Enquanto estiver em 0.x o app está em desenvolvimento inicial. Toda mudança no schema.sql deve ser citada aqui.

## [0.4.0] - 2026-11-25
### Adicionado
- Chat Brasa: chat por canal só com os usuários do Brasa, usando o nome, a cor, a fonte e a tag que cada um equipou. Mensagens em tempo real (Supabase Realtime), limite de 300 caracteres e 1 mensagem a cada 2 segundos.
- Tela de live com abas Chat e Sobre.
### Alterado
- A marca oficial volta a ser o ícone da chama branca no quadrado laranja, no app, na abertura do APK e no favicon.
### Corrigido
- O vídeo da live não reinicia mais a cada minuto, quando o app atualiza os dados.
### Banco de dados
- Rodar atualizacao-0.4.0.sql no Supabase (tabelas chat_messages e chat_bans). O schema.sql já inclui isso para instalações novas.

## [0.3.0] - 2026-11-25
### Adicionado
- Nova marca: fogueira em camadas com botão de play.
- Tela de live própria: barra compacta, vídeo em tela cheia na largura que fica fixo ao rolar, painel do streamer com contagem de espectadores na cor da marca, tempo de live, categoria e mais lives.
- Início com "Em destaque" e "Principais categorias ao vivo", com pôsteres de arte original gerados por categoria.
- Explorar com os pôsteres de categoria como filtro.
- Versão do app no rodapé e atualização automática por versão semântica no APK.
### Alterado
- O app consulta as 48 lives mais assistidas (antes eram 24) para montar as categorias.
### Observação
- Os avisos dentro do player (logo da Kick, "Visit KICK for HD", contador verde) são do player oficial da Kick e não podem ser alterados.

## [0.2.0]
- Contas, perfil, inventário e personalização (Supabase). Mudança no banco: schema.sql.

## [0.1.0]
- Descoberta de lives da Kick, player oficial, seguir canais.
