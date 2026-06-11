import React, { useEffect, useState } from "react"
import { Box, Button, GlobalStyles, LinearProgress, Paper, Stack, ThemeProvider, Typography } from "@mui/material"
import { EventBus } from "../../game/tools/EventBus"
import { Logo } from "../components/Logo"
import { RecordHistory } from "../GameMenu/RecordHistory/RecordHistory"
import { useMuiTheme } from "../hooks/useMuiTheme"

const RUN_STORAGE_KEYS = ["progress", "characters", "bench", "store"]

const hasSavedRun = () => RUN_STORAGE_KEYS.some((key) => localStorage.getItem(key) !== null)

export const clearSavedRun = () => {
    for (const key of RUN_STORAGE_KEYS) {
        localStorage.removeItem(key)
    }
}

interface MainMenuProps {
    isLoading?: boolean
    onNewGame: () => void
    onContinue: () => void
}

export const MainMenu: React.FC<MainMenuProps> = (props) => {
    const theme = useMuiTheme()
    const [canContinue, setCanContinue] = useState(() => hasSavedRun())
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const refreshSavedRun = () => setCanContinue(hasSavedRun())
        window.addEventListener("focus", refreshSavedRun)
        window.addEventListener("storage", refreshSavedRun)

        return () => {
            window.removeEventListener("focus", refreshSavedRun)
            window.removeEventListener("storage", refreshSavedRun)
        }
    }, [])

    useEffect(() => {
        const updateProgress = (value: number) => setProgress(value)
        EventBus.on("load-progress", updateProgress)

        return () => {
            EventBus.off("load-progress", updateProgress)
        }
    }, [])

    useEffect(() => {
        if (!props.isLoading) {
            setProgress(0)
        }
    }, [props.isLoading])

    const startNewGame = () => {
        clearSavedRun()
        setCanContinue(false)
        props.onNewGame()
    }

    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles
                styles={{
                    "@keyframes grimMenuGradient": {
                        "0%": { transform: "translate3d(-8%, -6%, 0) scale(1)", opacity: 0.75 },
                        "50%": { transform: "translate3d(7%, 5%, 0) scale(1.18)", opacity: 1 },
                        "100%": { transform: "translate3d(-8%, -6%, 0) scale(1)", opacity: 0.75 },
                    },
                    "@keyframes grimMenuPulse": {
                        "0%": { opacity: 0.45, transform: "scale(1)" },
                        "50%": { opacity: 0.82, transform: "scale(1.05)" },
                        "100%": { opacity: 0.45, transform: "scale(1)" },
                    },
                }}
            />
            <Box
                sx={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 20,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    px: { xs: 2, sm: 4 },
                    py: 4,
                    background:
                        "radial-gradient(circle at 20% 18%, rgba(127, 29, 29, 0.52), transparent 30%), radial-gradient(circle at 78% 18%, rgba(88, 28, 135, 0.45), transparent 28%), linear-gradient(145deg, #050409 0%, #0b0712 42%, #17080b 100%)",
                    color: "common.white",
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        inset: "-22%",
                        background:
                            "radial-gradient(circle at 32% 38%, rgba(190, 24, 93, 0.26), transparent 24%), radial-gradient(circle at 64% 54%, rgba(245, 158, 11, 0.18), transparent 22%), radial-gradient(circle at 50% 74%, rgba(59, 7, 100, 0.42), transparent 28%)",
                        filter: "blur(28px)",
                        animation: "grimMenuGradient 18s ease-in-out infinite",
                    },
                    "&::after": {
                        content: '""',
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
                        backgroundSize: "54px 54px",
                        maskImage: "radial-gradient(circle at center, black 0%, transparent 75%)",
                    },
                }}
            >
                <Box
                    sx={{
                        position: "absolute",
                        width: { xs: 260, sm: 420 },
                        height: { xs: 260, sm: 420 },
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(234, 88, 12, 0.26), rgba(88, 28, 135, 0.06) 58%, transparent 72%)",
                        filter: "blur(10px)",
                        animation: "grimMenuPulse 7s ease-in-out infinite",
                    }}
                />
                <Box sx={{ position: "relative", zIndex: 1, flexDirection: "column", alignItems: "center", gap: 2, width: "min(92vw, 520px)" }}>
                    <Paper
                        elevation={18}
                        sx={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: { xs: 2, sm: 3 },
                            width: 1,
                            px: { xs: 3, sm: 6 },
                            py: { xs: 4, sm: 5 },
                            border: "1px solid rgba(250, 204, 21, 0.22)",
                            background:
                                "linear-gradient(180deg, rgba(20, 14, 23, 0.86), rgba(7, 6, 10, 0.94)), radial-gradient(circle at top, rgba(127, 29, 29, 0.38), transparent 52%)",
                            boxShadow: "0 24px 80px rgba(0,0,0,0.72), inset 0 0 42px rgba(127, 29, 29, 0.18)",
                            backdropFilter: "blur(18px)",
                        }}
                    >
                        <Logo size={360} />
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", letterSpacing: 3, textTransform: "uppercase" }}>
                            Enfrente a masmorra infinita
                        </Typography>
                        <Stack sx={{ width: 1, gap: 1.5 }}>
                            <Button size="large" variant="contained" disabled={props.isLoading} onClick={startNewGame}>
                                Nova Masmorra
                            </Button>
                            <Button size="large" variant="outlined" disabled={props.isLoading || !canContinue} onClick={props.onContinue}>
                                Continuar
                            </Button>
                            <RecordHistory buttonLabel="Histórico" buttonVariant="text" disabled={props.isLoading} />
                        </Stack>
                    </Paper>
                    <Box
                        sx={{
                            width: 1,
                            flexDirection: "column",
                            gap: 1,
                            visibility: props.isLoading ? "visible" : "hidden",
                            opacity: props.isLoading ? 1 : 0,
                            pointerEvents: "none",
                            transition: "opacity 180ms ease",
                        }}
                    >
                        <LinearProgress
                            variant="determinate"
                            value={progress * 100}
                            sx={{
                                height: 8,
                                borderRadius: 99,
                                backgroundColor: "rgba(255,255,255,0.12)",
                                boxShadow: "0 0 24px rgba(250, 204, 21, 0.28)",
                            }}
                        />
                        <Typography variant="caption" sx={{ width: 1, textAlign: "center", color: "rgba(255,255,255,0.72)", letterSpacing: 1 }}>
                            Carregando masmorra
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    )
}
