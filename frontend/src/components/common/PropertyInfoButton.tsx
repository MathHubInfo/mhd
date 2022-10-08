import React from "react"
import { Tooltip } from "reactstrap"
import LaTeX from "react-latex"

import type { TMHDProperty } from "../../client/rest"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons"


export default class PropertyInfoButton extends React.Component<{prop: TMHDProperty, large?: boolean}> {
    render() {
        const { large, prop: { url, description, metadata: _metadata } } = this.props
        // TODO: Do something with the MMT URI here
        // Do we want to embed it?
        // const uri = _metadata?.uri
        return <InfoButton href={url || undefined} large={large}>
            <LaTeX>{description || "No description provided"}</LaTeX>
        </InfoButton>
    }
}
class InfoButton extends React.Component<{href?: string, large?: boolean; children: React.ReactNode}, {isOpen: boolean, isMounted: boolean}> {
    state = {
        isOpen: false,
        isMounted: false,
    }

    private toggleOpen = () => {
        this.setState(({ isOpen }) => ({ isOpen: !isOpen }))
    }

    private onClick = (evt: React.MouseEvent<HTMLAnchorElement>) => {
        evt.stopPropagation()
    }

    private buttonRef = React.createRef<HTMLAnchorElement>()

    componentDidMount() {
        this.setState({ isMounted: true })
    }

    render() {
        const { children, href, large } = this.props
        const { isOpen, isMounted } = this.state

        return <>
            { large && " "}
            <a href={href || "#!" } target={href && "_blank"} rel="noopener noreferrer" ref={this.buttonRef} onClick={this.onClick}>
                <FontAwesomeIcon icon={faQuestionCircle} transform={large ? undefined : "shrink-4 up-3" } />
            </a>
            {isMounted && this.buttonRef.current &&
                <Tooltip placement="right" isOpen={isOpen} target={this.buttonRef.current} toggle={this.toggleOpen}>
                     {children}
                </Tooltip>   
            }
        </>
    }
}