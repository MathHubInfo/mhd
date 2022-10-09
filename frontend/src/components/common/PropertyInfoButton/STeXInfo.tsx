import * as React from "react"
import type { TMHDProperty } from "../../../client/rest"
import type { InfoButtonFlags } from "./InfoButton"
import InfoButton from "./InfoButton"

import styles from "./STeXInfo.module.css"
import { displayLink, fetchFragment } from "../../../stex"


export default class STeXInfo extends React.Component<InfoButtonFlags & { uri: string; prop: TMHDProperty }> {
    render() {
        const { uri, prop: { description }, ...rest } = this.props
        return <InfoButton href={displayLink(uri)} className={styles.Tooltip} {...rest}>
            { description && <>{description}<hr /></>}
            <STeXFragment uri={uri} />
        </InfoButton>
    }
}

/** STeX fetches and embeds an STeXFragment */
class STeXFragment extends React.Component<{ uri: string }, { fragment: string; error: boolean; }> {
    state = { fragment: "", error: false }
    private mounted = false

    componentDidMount() {
        this.mounted = true
        this.loadData(this.props.uri)
    }
    componentWillUnmount() {
        this.mounted = false
    }
    componentDidUpdate(prevProps: Readonly<{ uri: string }>,): void {
        if (prevProps.uri === this.props.uri) return
        this.loadData(this.props.uri)
    }

    private loadData = async (uri: string) => {
        if (!this.mounted) return

        let fragment = ""
        let error = false
        try {
            fragment = await fetchFragment(uri)
        } catch(e) {
            error = true
        }

        if (!this.mounted || this.props.uri !== uri) return
        this.setState({ error, fragment })
    }
    render() {
        const { fragment, error } = this.state
        if (error) return "Failed to load"
        if (fragment === "") return "Loading"

        return <div dangerouslySetInnerHTML={{ __html: fragment }} />
    }
}
