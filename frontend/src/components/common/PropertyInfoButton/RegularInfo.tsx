import * as React from "react"
import type { TMHDProperty } from "../../../client/rest"
import LaTeX from "react-latex"
import type { InfoButtonFlags } from "./InfoButton"
import InfoButton from "./InfoButton"

export default class RegularInfo extends React.Component<InfoButtonFlags & { prop: TMHDProperty }> {
    render() {
        const { prop: { url, description }, ...rest } = this.props
        return <InfoButton href={url || undefined} {...rest}>
            <LaTeX>{description || "No description provided"}</LaTeX>
        </InfoButton>
    }
}