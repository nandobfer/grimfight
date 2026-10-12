import { describe, expect, it } from "vitest"
import { readConfig, runDeploy, shellQuote } from "../../scripts/deploy-production"
import type { DeployDependencies } from "../../scripts/deploy-production"

const environment = () => ({
    DEPLOY_HOST: "217.77.3.47",
    DEPLOY_SSH_USER: "burgos",
    DEPLOY_SSH_KEY: "/credentials/key",
    DEPLOY_KNOWN_HOSTS: "/credentials/known_hosts",
    DEPLOY_REMOTE_DIR: "/home/burgos/code/grimfight",
    DEPLOY_PROJECT_NAME: "grimfight",
    DEPLOY_SERVICE: "grimfight",
    DEPLOY_IMAGE_REPOSITORY: "nandoburgos/grimfight",
    DEPLOY_IMAGE_TAG: "a".repeat(40),
    DEPLOY_IMAGE_ARCHIVE: "/artifacts/grimfight-image.tar.gz",
    DEPLOY_IMAGE_SHA256: "b".repeat(64),
    DEPLOY_HEALTHCHECK_URL: "http://127.0.0.1:4008/",
})

function fakeDependencies(fail?: (command: string) => boolean) {
    const commands: Array<{ file: string; args: string[] }> = []
    const logs: string[] = []
    const deps: DeployDependencies = {
        exec: (file, args) => {
            commands.push({ file, args })
            const command = args.at(-1) ?? ""
            if (fail?.(command)) throw new Error("Falha simulada")
            if (command.includes("docker info")) return "x86_64\n"
            if (command.includes("docker image inspect")) return "sha256:release\n"
            if (command.includes("ps -aq")) return "previous-container\n"
            if (command.includes("ps -q")) return "new-container\n"
            if (command.includes("{{.Config.Image}}")) return "nandoburgos/grimfight:previous\n"
            if (command.includes("{{.Image}}")) return "sha256:release\n"
            return ""
        },
        exists: () => true,
        sleep: () => {},
        log: (message) => { logs.push(message) },
    }
    return { deps, commands, logs }
}

describe("configuração do deploy", () => {
    it("deriva a imagem e arquitetura e mantém o healthcheck local", () => {
        expect(readConfig(environment())).toMatchObject({
            port: 22,
            image: `nandoburgos/grimfight:${"a".repeat(40)}`,
            architecture: "x86_64",
            healthcheck: "http://127.0.0.1:4008/",
        })
        expect(readConfig({ ...environment(), DEPLOY_PLATFORM: "linux/arm64" }).architecture).toBe("aarch64")
    })

    it.each([
        ["DEPLOY_HOST", "-oProxyCommand=evil"],
        ["DEPLOY_SSH_USER", "user;evil"],
        ["DEPLOY_REMOTE_DIR", "/home/../etc"],
        ["DEPLOY_IMAGE_TAG", "tag;evil"],
        ["DEPLOY_IMAGE_SHA256", "invalid"],
        ["DEPLOY_SSH_PORT", "65536"],
        ["DEPLOY_PLATFORM", "windows/amd64"],
        ["DEPLOY_HEALTHCHECK_URL", "file:///etc/passwd"],
        ["DEPLOY_PROJECT_NAME", ""],
    ])("rejeita %s inválido antes do SSH", (name, value) => {
        expect(() => readConfig({ ...environment(), [name]: value })).toThrow()
    })

    it("escapa aspas em argumentos remotos", () => {
        expect(shellQuote("a'b")).toBe("'a'\\''b'")
    })
})

describe("deploy sem infraestrutura real", () => {
    it("transfere a release isolada, valida checksum, recria sem build/pull e confere imagem", () => {
        const { deps, commands } = fakeDependencies()
        const config = readConfig(environment())
        runDeploy(config, deps)
        const remote = commands.filter(({ file }) => file === "ssh").map(({ args }) => args.at(-1) ?? "")
        const checksum = remote.findIndex((command) => command.includes("sha256sum -c"))
        const load = remote.findIndex((command) => command.includes("docker load"))
        const recreate = remote.findIndex((command) => command.includes("up -d --no-build --pull never"))
        expect(checksum).toBeGreaterThan(-1)
        expect(load).toBeGreaterThan(checksum)
        expect(recreate).toBeGreaterThan(load)
        expect(remote[recreate]).toContain(`/.deploy/releases/${config.tag}/docker-compose.yml`)
        expect(remote[recreate]).toContain(`--env-file '${config.remoteDir}/.env'`)
        expect(remote.some((command) => command.includes("{{.Image}}"))).toBe(true)
        expect(remote.some((command) => command.includes(config.healthcheck))).toBe(true)
        expect(remote.every((command) => command.includes('export DOCKER_HOST="unix://$XDG_RUNTIME_DIR/docker.sock"'))).toBe(true)
        expect(commands.every(({ args }) => args.includes("StrictHostKeyChecking=yes"))).toBe(true)
        const transfer = commands.find(({ file }) => file === "scp")
        expect(transfer?.args).toContain(`burgos@217.77.3.47:${config.remoteDir}/.deploy/releases/${config.tag}/`)
        expect(transfer?.args).not.toContain(".env")
        expect(remote.some((command) => command.includes("docker restart"))).toBe(false)
        expect(remote.some((command) => command.includes("docker build"))).toBe(false)
    })

    it("não toca no servidor se faltar um arquivo local", () => {
        const { deps, commands } = fakeDependencies()
        deps.exists = () => false
        expect(() => runDeploy(readConfig(environment()), deps)).toThrow("Arquivo ausente")
        expect(commands).toHaveLength(0)
    })

    it("aborta antes do SCP quando a arquitetura diverge", () => {
        const { deps, commands } = fakeDependencies()
        expect(() => runDeploy(readConfig({ ...environment(), DEPLOY_PLATFORM: "linux/arm64" }), deps)).toThrow("Arquitetura")
        expect(commands.some(({ file }) => file === "scp")).toBe(false)
    })

    it("não importa nem recria quando o checksum falha", () => {
        const { deps, commands } = fakeDependencies((command) => command.includes("sha256sum -c"))
        expect(() => runDeploy(readConfig(environment()), deps)).toThrow("Falha simulada")
        expect(commands.some(({ args }) => args.at(-1)?.includes("docker load"))).toBe(false)
        expect(commands.some(({ args }) => args.at(-1)?.includes("up -d"))).toBe(false)
    })

    it("reporta a imagem anterior e limpa o arquivo se o healthcheck falhar", () => {
        const { deps, commands } = fakeDependencies((command) => command.includes("curl --fail"))
        expect(() => runDeploy(readConfig(environment()), deps)).toThrow("Imagem anterior para rollback: nandoburgos/grimfight:previous")
        expect(commands.at(-1)?.args.at(-1)).toContain("rm -f")
    })

    it("tolera uma falha transitória no healthcheck", () => {
        let attempts = 0
        const { deps, logs } = fakeDependencies((command) => command.includes("curl --fail") && ++attempts === 1)
        runDeploy(readConfig(environment()), deps)
        expect(attempts).toBe(2)
        expect(logs.at(-1)).toContain("Deploy concluído")
    })

    it("não aceita uma imagem diferente mesmo se o site antigo estiver disponível", () => {
        const { deps, commands } = fakeDependencies()
        const exec = deps.exec
        deps.exec = (file, args) => {
            const result = exec(file, args)
            return args.at(-1)?.includes("{{.Image}}") ? "sha256:old-image\n" : result
        }
        expect(() => runDeploy(readConfig(environment()), deps)).toThrow("Container não está usando a imagem da release")
        expect(commands.some(({ args }) => args.at(-1)?.includes("curl --fail"))).toBe(false)
    })
})
