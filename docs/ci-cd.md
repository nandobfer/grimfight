# CI/CD — GitHub Actions

O workflow `.github/workflows/ci-cd.yml` testa todos os PRs e os pushes na `main`.
Somente na `main`, após os testes, constrói a imagem no runner, publica um artefato
com checksum e transfere a release via SSH/SCP. Também aceita disparo manual na main.
Não utiliza registry, build no servidor ou pull de imagem em produção.

## Destino confirmado

- Repositório: `nandobfer/grimfight`.
- SSH: `burgos@217.77.3.47`, porta `22`.
- Diretório: `/home/burgos/code/grimfight`.
- Projeto/serviço Compose: `grimfight`.
- Imagem: `nandoburgos/grimfight:<sha-do-commit>`, plataforma `linux/amd64`.
- `.env` existente: `PORT=4008`; healthcheck: `http://127.0.0.1:4008/` (a porta é
  publicada em todas as interfaces; o healthcheck continua usando o loopback do servidor).

Imagem e plataforma estão fixadas no `env` do workflow. Não há build args públicos.
O nginx do host e o `.env` não são alterados. O servidor precisa de Docker Compose,
curl, sha256sum e acesso SSH público. O script detecta o socket do Docker rootless
em `/run/user/<uid>/docker.sock`, sem sudo.

## 1. Criar Environment e credenciais

Em **Settings → Environments**, crie `production`. Restrinja o deploy à branch `main`.
Se adicionar aprovação obrigatória, o deploy aguardará aprovação, deixando de ser
totalmente automático. PRs não recebem os secrets deste Environment.

Crie os quatro **Environment secrets**:

| Secret | Valor |
| --- | --- |
| `DEPLOY_HOST` | `217.77.3.47` |
| `DEPLOY_SSH_USER` | `burgos` |
| `DEPLOY_SSH_KEY` | Conteúdo da chave privada dedicada, incluindo BEGIN/END |
| `DEPLOY_KNOWN_HOSTS` | Host keys verificadas para `217.77.3.47` |

Gere uma chave dedicada (não sobrescreva uma chave existente):

```bash
ssh-keygen -t ed25519 -C "grimfight-github-actions" -f ~/.ssh/grimfight_actions -N ""
```

Nesta máquina, como `burgos`, autorize **somente a chave pública**:

```bash
install -d -m 700 ~/.ssh
printf 'restrict %s\n' "$(< ~/.ssh/grimfight_actions.pub)" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

A opção `restrict` desabilita forwarding e PTY, mas permite os comandos SSH/SCP
necessários. Esta chave ainda executa comandos como `burgos`: guarde-a apenas no
Environment, não em PRs, logs, no repositório ou no chat.

Capture e **confira a fingerprint** contra a chave local do servidor:

```bash
ssh-keyscan -p 22 -t ed25519 217.77.3.47 > ~/.ssh/grimfight_known_hosts
ssh-keygen -lf ~/.ssh/grimfight_known_hosts
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

As fingerprints devem ser iguais antes de cadastrar `DEPLOY_KNOWN_HOSTS`.
Não desabilite `StrictHostKeyChecking`. Use o IP SSH, não um domínio atrás de CDN.

Opcionalmente, com GitHub CLI autenticado, envie sem imprimir a chave privada:

```bash
gh secret set DEPLOY_HOST --env production --repo nandobfer/grimfight --body '217.77.3.47'
gh secret set DEPLOY_SSH_USER --env production --repo nandobfer/grimfight --body 'burgos'
gh secret set DEPLOY_SSH_KEY --env production --repo nandobfer/grimfight < ~/.ssh/grimfight_actions
gh secret set DEPLOY_KNOWN_HOSTS --env production --repo nandobfer/grimfight < ~/.ssh/grimfight_known_hosts
```

## 2. Environment variables

Cadastre em `production`:

| Variable | Valor |
| --- | --- |
| `DEPLOY_REMOTE_DIR` | `/home/burgos/code/grimfight` |
| `DEPLOY_PROJECT_NAME` | `grimfight` |
| `DEPLOY_HEALTHCHECK_URL` | `http://127.0.0.1:4008/` |
| `DEPLOY_SSH_PORT` | `22` (opcional; padrão) |
| `DEPLOY_SERVICE` | `grimfight` (opcional; padrão) |

```bash
gh variable set DEPLOY_REMOTE_DIR --env production --repo nandobfer/grimfight --body '/home/burgos/code/grimfight'
gh variable set DEPLOY_PROJECT_NAME --env production --repo nandobfer/grimfight --body 'grimfight'
gh variable set DEPLOY_HEALTHCHECK_URL --env production --repo nandobfer/grimfight --body 'http://127.0.0.1:4008/'
```

## 3. Proteger main

Em **Settings → Rulesets/Branches**, crie uma regra para `main`:

- Exigir pull request antes do merge.
- **Require status checks to pass before merging**: selecionar `Test`
  (job do workflow `CI/CD`, exibido em alguns lugares como `CI/CD / Test`).
- Exigir branch atualizada antes do merge, se desejado.
- Desabilitar bypass para administradores/automações se quiser bloqueio total.

O workflow sozinho não bloqueia merge. O check aparece após a primeira execução.
A disponibilidade de proteção de branch depende do plano/visibilidade do repositório.

## 4. Validação, quando solicitada

Teste o acesso SSH com as host keys já conferidas; o resultado esperado é sucesso:

```bash
ssh -i ~/.ssh/grimfight_actions -o UserKnownHostsFile="$HOME/.ssh/grimfight_known_hosts" \
  -o StrictHostKeyChecking=yes -o BatchMode=yes -p 22 burgos@217.77.3.47 true
```

Depois de publicar o workflow e configurar o Environment:
**Actions → CI/CD → Run workflow → main**. Deve passar por Test → Build image →
Deploy production. Um PR executa somente Test. Um disparo manual em outra branch
não faz deploy. Nenhum deploy foi executado como parte da criação destes arquivos.

## Releases e rollback

Os manifests ficam em `.deploy/releases/<sha>/`. O `.env` original é usado
explicitamente. Não há `git pull`, sobrescrita do checkout ou limpeza global de
imagens. A imagem é importada, o container é recriado com
`up -d --no-build --pull never`, e o ID da imagem efetivamente em uso é conferido.
O healthcheck acessa o nginx pelo loopback do servidor; não testa gameplay no browser.
O arquivo compactado é removido após a tentativa de recriação. Releases e imagens
são mantidas para rollback e precisam de limpeza periódica deliberada.

Falha após a recriação **não faz rollback automático**: o job falha e informa a
imagem anterior. Para rollback, use uma release conhecida e sua tag correspondente:

```bash
cd /home/burgos/code/grimfight
# Substitua <sha-anterior> em todas as ocorrências:
GRIMFIGHT_IMAGE=nandoburgos/grimfight:<sha-anterior> docker compose \
  --project-directory "$PWD" --env-file "$PWD/.env" -p grimfight \
  -f .deploy/releases/<sha-anterior>/docker-compose.yml \
  -f .deploy/releases/<sha-anterior>/docker-compose.deploy.yml \
  up -d --no-build --pull never grimfight
```

No primeiro deploy, o container antigo pode usar uma tag sem release em `.deploy`.
Nesse caso, use os manifests da primeira release com a referência antiga mostrada
no log. Não use `docker restart`: ele não troca a imagem.

## Prévias acessíveis por IP:porta

O compose base publica a porta interna `8080` em todas as interfaces
(`0.0.0.0:${PORT}`) e não fixa `container_name`. Uma prévia sobe com projeto
Compose isolado e uma `PORT` da faixa reservada, sem tocar no container de produção:

```bash
PORT=7091 docker compose -p grimfight-gri-14 up -d --build
```

- `PORT` é obrigatório (o compose falha cedo sem ele) e é a única variável
  necessária para trocar a porta publicada; o nginx do container continua na `8080`.
- Como o nome do container não é fixado no compose base, `-p <projeto>` evita
  colisão com o container `grimfight` de produção.
- Não é necessário editar o nginx do host nem criar proxy reverso para abrir a
  prévia por IP:porta; o proxy de produção continua funcionando via
  `127.0.0.1:${PORT}` (TLS).
- O firewall do host/provedor precisa liberar a porta reservada: bind correto não
  abre porta bloqueada externamente.
- Confira a configuração resolvida antes de subir, sem executar build:
  `PORT=7091 docker compose -p grimfight-gri-14 config`.

## Troubleshooting

- Cache do pnpm: instalar pnpm **antes** de setup-node no job Test; no deploy,
  `package-manager-cache: false`, pois Node 24 executa o script sem instalar pacotes.
- `Permission denied`: confira a chave pública e permissões `700`/`600` do SSH.
- Host key: o secret precisa corresponder exatamente ao IP configurado; confira fingerprint.
- Docker rootless: o daemon de `burgos` precisa estar ativo em sessões SSH não interativas.
- Healthcheck: confira `PORT=4008`, logs do container e a publicação da porta em
  todas as interfaces (`0.0.0.0`). O proxy do host continua apontando para `127.0.0.1:4008`.
- Falta de secret/variable: falha antes de qualquer alteração remota.
- Espaço em disco: mantenha releases/imagens de rollback necessárias; não use prune global
  neste host, que pode executar outros projetos.
