import React from "react"

import type { TMHDProperty } from "../../../client/rest"
import { Enabled } from "../../../stex"
import type { InfoButtonFlags } from "./InfoButton"
import RegularInfo from "./RegularInfo"
import STeXInfo from "./STeXInfo"

export default class PropertyHover extends React.Component<{prop: TMHDProperty} & InfoButtonFlags> {
    render() {
        const { prop, ...rest } = this.props
        if(Enabled) {
            const uri = prop?.metadata?.uri
            if (uri) return <STeXInfo prop={prop} uri={uri} {...rest} />
        }
        return <RegularInfo prop={prop} {...rest} /> 
    }
}
