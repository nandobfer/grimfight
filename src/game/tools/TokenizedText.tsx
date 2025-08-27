import { Box, Typography } from "@mui/material"

export interface TokenizedValue {
    boost: number
    [key: string]: number
}

// Accept ANYTHING inside brackets
export const BRACKET_RE = /\[([^\]]+)\]/g

export interface TokenizedDescriptionValue {
    value: string | number
    color?: string // e.g. "info.main", "success.main", "text.primary"
    weight?: number | string // optional font-weight override
}

export type TokenizedDescription = Record<string, TokenizedDescriptionValue>

/**
 * Replace the entire content inside brackets with the mapped token value.
 * Format: [token:anything-you-want-here]
 * If the token exists in `values`, render its `.value` with `.color`.
 * If it doesn't, render the raw inner text with default color.
 */
export function renderTokensDescription(values: TokenizedDescription | undefined, text: string) {
    const parts: React.ReactNode[] = []
    BRACKET_RE.lastIndex = 0

    let last = 0
    let m: RegExpExecArray | null

    while ((m = BRACKET_RE.exec(text))) {
        const [full, inner] = m
        if (m.index > last) parts.push(<span key={`t-${last}`}>{text.slice(last, m.index)}</span>)

        const colon = inner.indexOf(":")
        const key = (colon >= 0 ? inner.slice(0, colon) : inner).trim()
        const innerText = colon >= 0 ? inner.slice(colon + 1) : inner // <- keep "%" or any suffix/prefix

        const meta = values?.[key]
        const color = meta?.color ?? "inherit"
        const weight = meta?.weight ?? 700

        parts.push(
            <Typography component={"span"} key={`k-${m.index}-${key}`} sx={{ color, fontWeight: weight }} variant="body2">
                {innerText}
            </Typography>
        )

        last = m.index + full.length
    }

    if (last < text.length) parts.push(<span key={`t-${last}`}>{text.slice(last)}</span>)

    // single inline wrapper prevents line breaks
    return parts
}

export function renderDescription(text: string) {
    const parts: React.ReactNode[] = []
    BRACKET_RE.lastIndex = 0

    let last = 0
    let m: RegExpExecArray | null

    while ((m = BRACKET_RE.exec(text))) {
        const [full, inner] = m
        if (m.index > last) parts.push(<span key={`t-${last}`}>{text.slice(last, m.index)}</span>)

        const colon = inner.indexOf(":")
        const color = colon >= 0 ? inner.slice(0, colon).trim() : "inherit"
        const content = colon >= 0 ? inner.slice(colon + 1) : inner

        parts.push(
            <Typography component="span" key={`c-${m.index}`} sx={{ color, fontWeight: 700, fontSize: "inherit" }}>
                {content}
            </Typography>
        )

        last = m.index + full.length
    }

    if (last < text.length) parts.push(<span key={`t-${last}`}>{text.slice(last)}</span>)
    return parts
}