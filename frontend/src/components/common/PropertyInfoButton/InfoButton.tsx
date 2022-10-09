import * as React from "react"
import { Tooltip } from "reactstrap"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons"

import styles from "./InfoButton.module.css"


export type InfoButtonFlags = {
    large?: boolean;
}

export default class InfoButton extends React.Component<{ href?: string, className?: string; children: React.ReactNode } & InfoButtonFlags, { isOpen: boolean, isMounted: boolean }> {
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
        const { children, href, large, className } = this.props
        const { isOpen, isMounted } = this.state

        return <>
            {large && " "}
            <a href={href || "#!"} className={styles.InfoButton} target={href && "_blank"} rel="noopener noreferrer" ref={this.buttonRef} onClick={this.onClick}>
                <FontAwesomeIcon icon={faQuestionCircle} transform={large ? undefined : "shrink-4 up-3"} />
            </a>
            {isMounted && this.buttonRef.current &&
                <Tooltip className={`${className ?? ""} ${styles.Tooltip}`} placement="right" isOpen={isOpen} target={this.buttonRef.current} toggle={this.toggleOpen}>
                    {children}
                </Tooltip>
            }
        </>
    }
}