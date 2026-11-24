# Brasa · Fase 1

Plataforma de lives. Fase 1: descoberta de lives da Kick e player oficial incorporado. Fase 2: contas, perfil e personalização. Sem dinheiro e sem dados falsos.

Todos os arquivos ficam na mesma pasta, sem subpastas.

## O que funciona
- Início (mais assistidas, categorias, quem você segue ao vivo), Explorar, Seguindo e Assistir.
- Player oficial da Kick (iframe player.kick.com) e botão Abrir na Kick.
- Seguir canais fica salvo no navegador (localStorage).
- Sem a API conectada, dá para abrir qualquer canal pelo nome; o app só não sabe quem está ao vivo.

## Guia do dono (só você faz, uma vez; os usuários não configuram nada)
1. **Kick:** crie sua conta, ative a verificação em duas etapas (kick.com/settings/security) e abra kick.com/settings/developer. Crie um app com nome, descrição e uma URL de redirecionamento (pode ser o endereço do seu site; o Brasa usa só o token do próprio app). Leia os Developer Terms. Copie o Client ID e o Client Secret e trate o Secret como senha.
2. **Servidor (Cloudflare, plano gratuito):** Workers & Pages > Create > Worker. Em Edit code, cole o brasa-worker.js e faça Deploy. Em Settings > Variables and Secrets, crie KICK_CLIENT_ID e KICK_CLIENT_SECRET (tipo Secret). Abra a URL do Worker seguida de /health: deve aparecer {"ok":true}.
3. **Seu site:** abra o config.js, cole a URL do Worker em API_URL e salve. Depois publique todos os arquivos (Cloudflare Pages com Direct Upload, Netlify ou GitHub Pages).
4. **Trava de segurança (opcional):** no Worker, crie ALLOW_ORIGIN com o endereço do seu site para o servidor só responder a ele.
Pronto: todos os usuários veem as lives sem configurar nada. O Client Secret fica apenas no Worker, nunca nos arquivos do site.

## Limites conhecidos
- Espectadores atualizam cerca de 1 vez por minuto na Kick; o app consulta no máximo 1 vez por minuto.
- A Kick pode bloquear o player incorporado em alguns sites; por isso existe o botão Abrir na Kick.
- Não detecta mudança de título em tempo real (só a cada atualização). Webhooks ficam para a Fase 2.
- Não usa endpoints não documentados da Kick.

## Fase 2: contas, perfil e personalização (Supabase)
Arquivos novos: profile.js, config.js e schema.sql. O app já funciona sem eles; sem Supabase a aba Perfil avisa que as contas não estão conectadas.
1. Crie um projeto gratuito em supabase.com.
2. No SQL Editor, cole e rode o schema.sql inteiro (cria tabelas, regras de segurança, a função de equipar e o catálogo inicial).
3. Em Authentication > URL Configuration, coloque o endereço do seu site em Site URL e em Redirect URLs. Em Providers, deixe Email ligado.
4. Em Project Settings > API, copie a Project URL e a chave anon e cole no config.js. Nunca use a chave service_role em arquivo nenhum do site.
5. Suba os arquivos de novo. Crie uma conta de teste: você recebe os itens iniciais já equipados.

Como a segurança funciona: o navegador só consegue ler o catálogo e os perfis, ler o próprio inventário e mudar o próprio nome de exibição. Dar item e equipar item só acontece no servidor (gatilho de cadastro e função equip), que confere se o item é seu.

Limites desta fase: itens além dos iniciais aparecem como Indisponíveis (só ficam obtíveis na Fase 3). Stickers só são exibidos. Não há troca de foto de perfil nem moderação automática de nomes. Antes de qualquer venda de créditos ou baús é preciso verificação de idade confiável e orientação jurídica (ECA Digital).

## Próximas fases
3. Créditos com registro de entradas e saídas, missões e baús só com créditos ganhos. 4. Pagamentos, presentes e painel de admin, só após orientação jurídica.

