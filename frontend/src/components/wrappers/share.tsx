import React, { useId } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCopy } from "@fortawesome/free-regular-svg-icons"
import { Button, Tooltip } from "reactstrap"
import { faShare } from "@fortawesome/free-solid-svg-icons"

/**
 * A button that allows sharing the URL to the current page
 * Uses the native share api when available
 */
export class ShareThisPage extends React.Component {
    state = {
        onClient: false,
        nativeShareSupported: false,
        fallbackCopied: false,
    }

    componentDidMount(): void {
        this.setState({
            onClient: true, 
            nativeShareSupported: !!navigator.share,
        })
    }
    componentWillUnmount(): void {
        if (this.copyTimer) window.clearTimeout(this.copyTimer)
    }
    
    private readonly shareNative = async () => {
        try {
            await navigator.share({
                title: document.title,
                url: location.href,
            })
        } catch(_) {
        }
    }

    private copyTimer: number | null = null
    private readonly handleCopy = () => {
        this.setState({ fallbackCopied: true })

        if(this.copyTimer) window.clearTimeout(this.copyTimer)
        this.copyTimer = window.setTimeout(() => {
            this.setState({ fallbackCopied: false })
            this.copyTimer = null
        }, 1000)
    }

    render() {
        const { onClient, nativeShareSupported, fallbackCopied } = this.state
        if(!onClient) return <Button disabled>Share This Page</Button>

        if(nativeShareSupported) return <Button onClick={this.shareNative}>Share This Page</Button>
        return <CopyButton size="" text={location.href} title={<><FontAwesomeIcon icon={faShare} />{" "}Share This Page</>} copied={fallbackCopied} onCopy={this.handleCopy} />
    }
}


/**
 * A (managed) button to allow copying of text to the clipboard
 * @param props
 * @returns 
 */
export function CopyButton(props: { text: string, size?: string; title?: string | React.ReactNode; copied: boolean, onCopy?: () => void, }) {
    const id = useId()
    const escaped = id.replace(/\W/g, m => "\\" + m.charCodeAt(0).toString(16) + " ")
    return <>
        <CopyToClipboard text={props.text} onCopy={props.onCopy}>
            <Button size={props.size ?? "sm"} id={id}>
                {props.title ?? <FontAwesomeIcon icon={faCopy} />}
            </Button>
        </CopyToClipboard>
        <Tooltip placement="right" isOpen={props.copied} target={escaped}>
            Copied To Clipboard!
        </Tooltip>
    </>

}