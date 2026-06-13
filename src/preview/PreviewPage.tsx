import { useEffect, useState } from "react"
import { Box, Button, Chip, Divider, List, ListItemButton, ListItemText, Stack, Tab, Tabs, ThemeProvider, Typography } from "@mui/material"
import { useMuiTheme } from "../ui/hooks/useMuiTheme"
import { buildPreviewRoute, parsePreviewRoute, type PreviewAssetType } from "./previewRoute"
import { findPreviewAsset, getFirstAvailablePreviewAsset, getFirstPreviewAsset, previewAssetLabels, previewAssets, type PreviewAsset } from "./previewAssets"
import { PreviewPhaserCanvas } from "./PreviewPhaserCanvas"

function getAssetFromLocation(): PreviewAsset | undefined {
    const parsed = parsePreviewRoute(window.location.pathname)
    if (!parsed) return getFirstAvailablePreviewAsset()

    return findPreviewAsset(parsed.type, parsed.name) ?? getFirstPreviewAsset(parsed.type) ?? getFirstAvailablePreviewAsset()
}

export function PreviewPage() {
    const theme = useMuiTheme()
    const [selectedAsset, setSelectedAsset] = useState<PreviewAsset | undefined>(() => getAssetFromLocation())
    const [activeType, setActiveType] = useState<PreviewAssetType>(() => selectedAsset?.type ?? "creature")

    useEffect(() => {
        const updateFromLocation = () => {
            const asset = getAssetFromLocation()
            setSelectedAsset(asset)
            if (asset) setActiveType(asset.type)
        }

        window.addEventListener("popstate", updateFromLocation)
        return () => window.removeEventListener("popstate", updateFromLocation)
    }, [])

    const selectAsset = (asset: PreviewAsset) => {
        setSelectedAsset(asset)
        setActiveType(asset.type)
        window.history.pushState(null, "", buildPreviewRoute(asset))
    }

    const selectType = (type: PreviewAssetType) => {
        setActiveType(type)
        const firstAsset = getFirstPreviewAsset(type)
        if (firstAsset) selectAsset(firstAsset)
    }

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    minHeight: "100vh",
                    width: 1,
                    bgcolor: "#070910",
                    color: "#f8fafc",
                    display: { xs: "block", md: "flex" },
                }}
            >
                <Box
                    component="aside"
                    sx={{
                        width: { xs: 1, md: 320 },
                        maxHeight: { xs: "44vh", md: "100vh" },
                        overflow: "hidden",
                        borderRight: { md: "1px solid rgba(148, 163, 184, 0.22)" },
                        borderBottom: { xs: "1px solid rgba(148, 163, 184, 0.22)", md: 0 },
                        bgcolor: "rgba(15, 23, 42, 0.78)",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Box sx={{ px: 2.5, py: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <Typography variant="h6">Asset Preview</Typography>
                            {selectedAsset && <Chip size="small" label={selectedAsset.type} variant="outlined" />}
                        </Stack>
                    </Box>
                    <Tabs value={activeType} onChange={(_, value: PreviewAssetType) => selectType(value)} variant="fullWidth">
                        <Tab value="creature" label="Creatures" />
                        <Tab value="portrait" label="Portraits" />
                        <Tab value="fx" label="FX" />
                    </Tabs>
                    <Divider />
                    <List sx={{ overflow: "auto", py: 0 }}>
                        {previewAssets[activeType].map((asset) => (
                            <ListItemButton
                                key={`${asset.type}-${asset.name}`}
                                selected={selectedAsset?.type === asset.type && selectedAsset.name === asset.name}
                                onClick={() => selectAsset(asset)}
                            >
                                <ListItemText primary={asset.label} secondary={asset.path} secondaryTypographyProps={{ noWrap: true }} />
                            </ListItemButton>
                        ))}
                        {previewAssets[activeType].length === 0 && (
                            <Box sx={{ p: 2.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Nenhum asset em {previewAssetLabels[activeType]}.
                                </Typography>
                            </Box>
                        )}
                    </List>
                </Box>

                <Box component="main" sx={{ flex: 1, minWidth: 0, minHeight: { xs: "56vh", md: "100vh" }, display: "flex", flexDirection: "column" }}>
                    {selectedAsset ? <SelectedAssetPreview asset={selectedAsset} /> : <EmptyPreview />}
                </Box>
            </Box>
        </ThemeProvider>
    )
}

function SelectedAssetPreview({ asset }: { asset: PreviewAsset }) {
    return (
        <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", p: { xs: 2, md: 4 }, gap: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
                <Box>
                    <Typography variant="h4" sx={{ lineHeight: 1.05 }}>
                        {asset.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {asset.path}
                    </Typography>
                </Box>
                <Button variant="outlined" href="/">
                    Voltar ao jogo
                </Button>
            </Stack>

            <Box
                sx={{
                    flex: 1,
                    minHeight: 360,
                    border: "1px solid rgba(148, 163, 184, 0.22)",
                    borderRadius: 3,
                    overflow: "hidden",
                    bgcolor: "#10131c",
                }}
            >
                {asset.type === "portrait" ? <PortraitPreview asset={asset} /> : <PreviewPhaserCanvas key={`${asset.type}-${asset.name}`} asset={asset} />}
            </Box>
        </Box>
    )
}

function PortraitPreview({ asset }: { asset: PreviewAsset }) {
    return (
        <Box sx={{ height: 1, minHeight: 360, display: "grid", placeItems: "center", background: "radial-gradient(circle at center, #1e293b 0, #10131c 58%)" }}>
            <Box
                component="img"
                src={asset.path}
                alt={asset.name}
                sx={{
                    width: { xs: 192, md: 320 },
                    height: { xs: 192, md: 320 },
                    imageRendering: "pixelated",
                    borderRadius: 4,
                    border: "1px solid rgba(248, 250, 252, 0.18)",
                    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.45)",
                }}
            />
        </Box>
    )
}

function EmptyPreview() {
    return (
        <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 4 }}>
            <Typography color="text.secondary">Nenhum asset disponivel para preview.</Typography>
        </Box>
    )
}
