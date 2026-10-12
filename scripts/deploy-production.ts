/** Deploy por SCP. Node 24 executa este TypeScript sem dependências adicionais. */
import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { basename, resolve } from "node:path"
import { fileURLToPath } from "node:url"

type Environment = Record<string, string | undefined>

export interface DeployConfig {
    host: string
    user: string
    port: number
    key: string
    knownHosts: string
    remoteDir: string
    project: string
    service: string
    image: string
    tag: string
    archive: string
    checksum: string
    architecture: string
    healthcheck: string
}

export interface DeployDependencies {
    exec: (file: string, args: string[]) => string
    exists: (path: string) => boolean
    sleep: (milliseconds: number) => void
    log: (message: string) => void
}

export function shellQuote(value: string): string {
    return `'${value.replace(/'/g, "'\\''")}'`
}

export function readConfig(env: Environment): DeployConfig {
    const required = (name: string, pattern?: RegExp): string => {
        const value = env[name]?.trim()
        if (!value || (pattern && !pattern.test(value))) throw new Error(`Configuração inválida: ${name}`)
        return value
    }
    const port = Number(env.DEPLOY_SSH_PORT || "22")
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Porta SSH inválida")
    const platform = env.DEPLOY_PLATFORM || "linux/amd64"
    if (platform !== "linux/amd64" && platform !== "linux/arm64") throw new Error("Plataforma inválida")
    const repository = required("DEPLOY_IMAGE_REPOSITORY", /^[a-z0-9]+(?:[._/-][a-z0-9]+)*$/)
    const tag = required("DEPLOY_IMAGE_TAG", /^[a-f0-9]{40}$/)
    const archive = required("DEPLOY_IMAGE_ARCHIVE")
    if (!/^[A-Za-z0-9._-]+$/.test(basename(archive))) throw new Error("Nome de arquivo inválido")
    const healthcheck = required("DEPLOY_HEALTHCHECK_URL")
    const url = new URL(healthcheck)
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Healthcheck inválido")
    return {
        host: required("DEPLOY_HOST", /^[A-Za-z0-9][A-Za-z0-9.-]*$/),
        user: required("DEPLOY_SSH_USER", /^[A-Za-z0-9_][A-Za-z0-9._-]*$/),
        port,
        key: required("DEPLOY_SSH_KEY"),
        knownHosts: required("DEPLOY_KNOWN_HOSTS"),
        remoteDir: required("DEPLOY_REMOTE_DIR", /^(?:\/[A-Za-z0-9_-][A-Za-z0-9._-]*)+$/),
        project: required("DEPLOY_PROJECT_NAME", /^[a-z0-9][a-z0-9_-]*$/),
        service: required("DEPLOY_SERVICE", /^[A-Za-z0-9_][A-Za-z0-9._-]*$/),
        image: `${repository}:${tag}`,
        tag,
        archive,
        checksum: required("DEPLOY_IMAGE_SHA256", /^[a-f0-9]{64}$/),
        architecture: platform === "linux/amd64" ? "x86_64" : "aarch64",
        healthcheck,
    }
}

export function runDeploy(config: DeployConfig, deps: DeployDependencies): void {
    const composeFiles = ["docker-compose.yml", "docker-compose.deploy.yml"]
    for (const path of [config.key, config.knownHosts, config.archive, ...composeFiles]) {
        if (!deps.exists(path)) throw new Error(`Arquivo ausente: ${path}`)
    }
    const target = `${config.user}@${config.host}`
    const options = ["-i", config.key, "-o", `UserKnownHostsFile=${config.knownHosts}`,
        "-o", "StrictHostKeyChecking=yes", "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes", "-o", "ConnectTimeout=15"]
    const ssh = (command: string): string => deps.exec("ssh", [...options, "-p", String(config.port), target,
        `set -eu\nexport XDG_RUNTIME_DIR="\${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"\n` +
        'if [ -S "$XDG_RUNTIME_DIR/docker.sock" ]; then export DOCKER_HOST="unix://$XDG_RUNTIME_DIR/docker.sock"; fi\n' + command])
    const release = `${config.remoteDir}/.deploy/releases/${config.tag}`
    const archive = `${release}/${basename(config.archive)}`
    const compose = (image: string, args: string): string =>
        `GRIMFIGHT_IMAGE=${shellQuote(image)} docker compose --project-directory ${shellQuote(config.remoteDir)}` +
        ` --env-file ${shellQuote(`${config.remoteDir}/.env`)} -p ${shellQuote(config.project)}` +
        composeFiles.map((file) => ` -f ${shellQuote(`${release}/${file}`)}`).join("") + ` ${args}`

    deps.log("Conferindo Docker, Compose, curl e .env no servidor")
    ssh(`command -v curl >/dev/null\ndocker compose version >/dev/null\ntest -f ${shellQuote(`${config.remoteDir}/.env`)}`)
    if (ssh('docker info --format "{{.Architecture}}"').trim() !== config.architecture) {
        throw new Error("Arquitetura do servidor diferente da imagem")
    }
    ssh(`mkdir -p ${shellQuote(release)}`)
    deps.log("Transferindo imagem e configuração da release")
    deps.exec("scp", [...options, "-P", String(config.port), config.archive, ...composeFiles, `${target}:${release}/`])
    ssh(`printf '%s  %s\\n' ${shellQuote(config.checksum)} ${shellQuote(archive)} | sha256sum -c -`)
    ssh(`docker load --input ${shellQuote(archive)}`)
    const imageId = ssh(`docker image inspect --format '{{.Id}}' ${shellQuote(config.image)}`).trim()
    if (!imageId) throw new Error("Imagem importada não encontrada")

    const previousId = ssh(compose(config.image, `ps -aq ${shellQuote(config.service)}`)).trim()
    const previousImage = previousId
        ? ssh(`docker inspect --format '{{.Config.Image}}' ${shellQuote(previousId)}`).trim() : undefined
    if (previousImage) deps.log(`Imagem anterior para rollback: ${previousImage}`)
    try {
        deps.log(`Recriando ${config.service} com ${config.image}`)
        ssh(compose(config.image, `up -d --no-build --pull never ${shellQuote(config.service)}`))
        const containerId = ssh(compose(config.image, `ps -q ${shellQuote(config.service)}`)).trim()
        if (!containerId) throw new Error("Container não está em execução")
        const actualId = ssh(`docker inspect --format '{{.Image}}' ${shellQuote(containerId)}`).trim()
        if (actualId !== imageId) throw new Error("Container não está usando a imagem da release")
        let healthy = false
        for (let attempt = 0; attempt < 30; attempt++) {
            try {
                ssh(`curl --fail --silent --show-error --output /dev/null --max-time 10 ${shellQuote(config.healthcheck)}`)
                healthy = true
                break
            } catch {
                if (attempt < 29) deps.sleep(5000)
            }
        }
        if (!healthy) throw new Error(`Healthcheck falhou: ${config.healthcheck}`)
        deps.log(`Deploy concluído: ${config.image}`)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`${message}${previousImage ? `\nImagem anterior para rollback: ${previousImage}` : ""}`)
    } finally {
        // Remove apenas o arquivo transferido; mantém imagens e manifests para rollback.
        try { ssh(`rm -f ${shellQuote(archive)}`) } catch { deps.log("Aviso: arquivo da imagem não foi removido") }
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        runDeploy(readConfig(process.env), {
            exec: (file, args) => execFileSync(file, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }),
            exists: existsSync,
            sleep: (ms) => { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms) },
            log: (message) => console.log(`[deploy] ${message}`),
        })
    } catch (error) {
        console.error(`[deploy] ${error instanceof Error ? error.message : String(error)}`)
        process.exitCode = 1
    }
}
