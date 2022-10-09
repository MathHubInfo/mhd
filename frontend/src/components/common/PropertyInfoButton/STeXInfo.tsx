import * as React from "react"
import { parseHTMLNodes, findElementsByTagName, innerHTML } from "../../../templates/html/dom"
import type { TMHDProperty } from "../../../client/rest"
import type { InfoButtonFlags } from "./InfoButton"
import InfoButton from "./InfoButton"

import styles from "./STeXInfo.module.css"

const STEX_SERVER = "https://stexmmt.mathhub.info/:sTeX/"
const STEX_FRAGMENT_ENDPOINT = STEX_SERVER + "fragment?"
const STEX_DISPLAY_ENDPOINT = STEX_SERVER + "symbol?"

export default class STeXInfo extends React.Component<InfoButtonFlags & { uri: string; prop: TMHDProperty }> {
    render() {
        const { uri, prop: { description }, ...rest } = this.props
        return <InfoButton href={STEX_DISPLAY_ENDPOINT + uri} className={styles.Tooltip} {...rest}>
            { description && <>{description}<hr /></>}
            <STeXFragment uri={uri} />
        </InfoButton>
    }
}

/** STeX fetches and embeds an STeXFragment */
class STeXFragment extends React.Component<{ uri: string }, { html: string; error: boolean; }> {
    state = { html: "", error: false }
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

        let html = ""
        let error = false
        try {
            const target = STEX_FRAGMENT_ENDPOINT + uri
            html = await fetch(target).then(r => r.text())
        } catch (e) {
            error = true
        }

        if (!this.mounted || this.props.uri !== uri) return
        this.setState({ error, html })
    }
    render() {
        const { html, error } = this.state
        if (error) return "Failed to load"
        if (html === "") return "Loading"

        return <RenderSTeXFragment html={html} />
    }
}

type STeXFragmentProps = {
    html: string;
}

type STeXFragmentState = {
    parsed: string;
}

class RenderSTeXFragment extends React.Component<STeXFragmentProps, STeXFragmentState> {
    state = {
        parsed: "",
    }
    private static parseFragment(source: string): string {
        const fragment = parseHTMLNodes(source)
        const body: ArrayLike<Node> = findElementsByTagName(fragment, "body")
        return body.length == 1 ? innerHTML(body[0]) : innerHTML(fragment)
    }
    static getDerivedStateFromProps({ html }: STeXFragmentProps): STeXFragmentState {
        return { parsed: RenderSTeXFragment.parseFragment(html) }
    }
    render() {
        const { parsed } = this.state
        return <div dangerouslySetInnerHTML={{ __html: parsed }} />
    }
}