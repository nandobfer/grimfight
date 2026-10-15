import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()

const read = (path: string) => readFileSync(join(root, path), "utf8")

/** Entradas do bloco `ports:` de um serviço Compose, ignorando comentários. */
function publishedPorts(compose: string): string[] {
    const lines = compose.split("\n")
    const start = lines.findIndex((line) => /^\s+ports:\s*$/.test(line))
    if (start === -1) return []

    const indent = lines[start].search(/\S/)
    const entries: string[] = []
    for (const line of lines.slice(start + 1)) {
        if (!line.trim() || line.trim().startsWith("#")) continue
        if (line.search(/\S/) < indent) break
        const entry = line.match(/^\s*-\s*"?([^"#]+?)"?\s*$/)
        if (entry) entries.push(entry[1].trim())
    }
    return entries
}

interface PortMapping {
    hostIp?: string
    published: string
    target: number
}

function parsePortMapping(entry: string): PortMapping {
    const match = entry.match(/^(.+):(\d+)$/)
    if (!match) throw new Error(`Mapeamento de porta inesperado: ${entry}`)

    const rest = match[1]
    const target = Number(match[2])
    const withHostIp = rest.match(/^(\d+\.\d+\.\d+\.\d+):(.+)$/)
    if (withHostIp) return { hostIp: withHostIp[1], published: withHostIp[2], target }
    return { published: rest, target }
}

function nginxListenPort(nginx: string): number {
    const match = nginx.match(/^\s*listen\s+(\d+)\s*;/m)
    if (!match) throw new Error("nginx.conf sem diretiva listen")
    return Number(match[1])
}

const composeBase = () => read("docker-compose.yml")
const composeDeploy = () => read("docker-compose.deploy.yml")
const nginx = () => read("nginx.conf")

describe("publicação de rede do container", () => {
    it("publica a mesma porta interna do nginx em todas as interfaces", () => {
        const mappings = publishedPorts(composeBase()).map(parsePortMapping)

        expect(mappings).toHaveLength(1)
        expect(mappings[0].hostIp).toBe("0.0.0.0")
        expect(mappings[0].target).toBe(nginxListenPort(nginx()))
        expect(mappings[0].published).toContain("${PORT")
    })

    it("não restringe a publicação ao loopback do host", () => {
        expect(composeBase()).not.toContain("127.0.0.1")
    })

    it("exige PORT do ambiente em vez de fixar a porta publicada", () => {
        expect(publishedPorts(composeBase())[0]).toContain("${PORT:?")
        expect(read(".env.example")).toMatch(/^PORT=\d+$/m)
    })

    it("não fixa o nome do container no compose base, permitindo prévia em projeto isolado", () => {
        expect(composeBase()).not.toMatch(/^\s*container_name:/m)
    })

    it("mantém produção herdando a publicação pública do compose base", () => {
        expect(composeDeploy()).not.toMatch(/^\s+ports:/m)
    })

    it("fixa nome e imagem de produção apenas no override de deploy", () => {
        const deploy = composeDeploy()

        expect(deploy).toMatch(/^\s*container_name:\s*grimfight\s*$/m)
        expect(deploy).toContain("${GRIMFIGHT_IMAGE")
        expect(deploy).toContain("pull_policy: never")
    })
})

describe("servidor web embarcado", () => {
    it("embarca o nginx no estágio runner sem exigir serviço extra", () => {
        const dockerfile = read("Dockerfile")

        expect(dockerfile).toMatch(/^FROM\s+nginx[^\s]*\s+AS runner$/m)
        expect(dockerfile).toContain("COPY nginx.conf")
        expect(dockerfile).toContain("/usr/share/nginx/html")
    })

    it("serve a aplicação direto, sem depender de proxy reverso configurado à mão", () => {
        const conf = nginx()

        expect(conf).toContain("try_files $uri $uri/ /index.html")
        expect(conf).not.toContain("proxy_pass")
    })
})
