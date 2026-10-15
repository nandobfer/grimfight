# Deploy e CI/CD

- `.github/workflows/ci-cd.yml`: testes Vitest em PRs e main; build da imagem Docker
  somente no runner do GitHub após testes; deploy automático somente em main.
- Actions fixadas por SHA, permissões mínimas, credenciais apenas no Environment
  `production`, SSH com host keys fixadas. A proteção de main é configurada no GitHub,
  não pelo YAML; o check obrigatório é o job `Test` do workflow `CI/CD`.
- Concurrency serializa o pipeline por ref sem cancelar deploys em andamento.
- `scripts/deploy-production.ts`: valida configuração e pré-requisitos, adapta o
  socket rootless em SSH, transfere imagem/manifests via SCP para releases isoladas,
  confere checksum, importa imagem e recria o serviço sem build/pull. Confere o ID
  efetivo da imagem e disponibilidade HTTP no servidor.
- `docker-compose.deploy.yml` recebe `GRIMFIGHT_IMAGE`, impede pull e fixa o
  `container_name` de produção. O Compose usa explicitamente o diretório de
  produção e seu `.env`; não altera o checkout, não roda git pull, não muda o
  proxy nginx e não envia secrets no artefato.
- O compose base publica a porta interna fixa `8080` em todas as interfaces
  (`0.0.0.0:${PORT}`), então a aplicação responde direto em IP:porta sem
  depender de proxy reverso; `PORT` é obrigatório e vem do `.env`. O compose base
  não fixa `container_name`, permitindo que prévias subam em projeto Compose
  isolado (`docker compose -p <projeto>`).
- Mantém manifests/imagens para rollback manual; remove apenas o arquivo da imagem
  após a tentativa de recriação. Não há rollback automático ou prune global.
- O deploy executa TypeScript com Node nativo, sem instalar dependências. Cache de
  package manager é desabilitado nesse job; no job de testes, pnpm precede setup-node.
- `__tests__/deployment/deploy-production.test.ts`: dependências injetadas, sem
  rede/Docker; cobre configuração, SSH estrito, isolamento de release, checksum,
  arquitetura, ordem dos comandos, falhas e disponibilidade.
- Operação, Secrets/Variables, proteção de branch, rollback e armadilhas:
  `docs/ci-cd.md`. Não executar testes, builds ou deploys locais sem pedido explícito.
