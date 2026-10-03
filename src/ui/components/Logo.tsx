import React from "react"
import { Avatar } from "@mui/material"

interface LogoProps {
    size?: number | Record<string, number>
}

export const Logo: React.FC<LogoProps> = (props) => {
    return <Avatar variant="square" src="grimfight.png" sx={{ width: props.size || 600, height: "auto" }} />
}
