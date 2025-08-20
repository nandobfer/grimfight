import { createTheme, LinearProgress, useMediaQuery } from "@mui/material"
import { useMemo } from "react"
// import { ptBR } from "@mui/x-data-grid/locales"
import { colors } from "../style/colors"

export const useMuiTheme = () => {
    const isMobile = useMediaQuery("(orientation: portrait)")

    const THEME = useMemo(
        () =>
            createTheme(
                {
                    typography: {
                        fontFamily: "Poppins",
                    },
                    palette: {
                        mode: "dark",

                        primary: {
                            main: colors.primary,
                        },
                        secondary: {
                            main: colors.secondary,
                        },

                        background: {
                            default: colors.background,
                            // paper: colors.paper,
                        },
                        // text: {primary: colors.primary}
                    },
                    components: {
                        MuiMenuList: { defaultProps: { sx: { backgroundColor: colors.background } } },
                        MuiList: { defaultProps: { sx: { backgroundColor: colors.background } } },
                        // MuiDataGrid: {
                        //     styleOverrides: {
                        //         root: {
                        //             "--DataGrid-t-color-interactive-focus": "transparent !important",
                        //             "--DataGrid-hasScrollY": "0 !important",
                        //         },
                        //         columnHeader: {
                        //             color: colors.secondary,
                        //         },
                        //     },
                        //     defaultProps: {
                        //         slotProps: { columnHeaders: { style: { display: isMobile ? "none" : undefined } } },
                        //     },
                        // },
                        MuiAutocomplete: {
                            styleOverrides: {
                                listbox: { width: "100%", backgroundColor: colors.background },
                            },
                        },
                        MuiDialog: {
                            defaultProps: {
                                slotProps: {
                                    paper: {
                                        sx: { display: "flex", padding: 2, flexDirection: "column", gap: 2, maxWidth: "90vw" },
                                        elevation: undefined,
                                    },
                                },
                            },
                        },
                        // MuiButton: { styleOverrides: { contained: { color: colors.secondary } } },
                        MuiCircularProgress: { defaultProps: { size: "1.5rem", color: "inherit" } },
                        MuiTooltip: { defaultProps: { arrow: true } },
                    },
                }
                // ptBR
            ),
        [colors]
    )

    return THEME
}
