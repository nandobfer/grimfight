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
- `docker-compose.deploy.yml` recebe `GRIMFIGHT_IMAGE` e impede pull. O Compose
  usa explicitamente o diretório de produção e seu `.env`; não altera o checkout,
  não roda git pull, não muda o proxy nginx e não envia secrets no artefato.
- Mantém manifests/imagens para rollback manual; remove apenas o arquivo da imagem
  após a tentativa de recriação. Não há rollback automático ou prune global.
- O deploy executa TypeScript com Node nativo, sem instalar dependências. Cache de
  package manager é desabilitado nesse job; no job de testes, pnpm precede setup-node.
- `__tests__/deployment/deploy-production.test.ts`: dependências injetadas, sem
  rede/Docker; cobre configuração, SSH estrito, isolamento de release, checksum,
  arquitetura, ordem dos comandos, falhas e disponibilidade.
- Operação, Secrets/Variables, proteção de branch, rollback e armadilhas:
  `docs/ci-cd.md`. Não executar testes, builds ou deploys locais sem pedido explícito.
