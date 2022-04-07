import React from "react";
import { Tooltip } from "reactstrap";
import LaTeX from "react-latex";

import { TMHDProperty } from "../../client/rest";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";


export default class PropertyInfoButton extends React.Component<{prop: TMHDProperty}> {
    render() {
        const {url, description} = this.props.prop;
        return <InfoButton href={url || undefined}>
            <LaTeX>{description || "No description provided"}</LaTeX>
        </InfoButton>;
    }
}
class InfoButton extends React.Component<{href?: string}, {isOpen: boolean}> {
    state = {
        isOpen: false
    }

    private toggleOpen = () => {
        this.setState(({ isOpen }) => ({isOpen: !isOpen}))
    }

    private onClick = (evt: React.MouseEvent<HTMLAnchorElement>) => {
        evt.stopPropagation();
    }

    private buttonRef = React.createRef<HTMLAnchorElement>();

    componentDidMount() {
        // HACK HACK HACK HACK HACK HACK HACK
        // in order for the tooltip to show up, it needs to register an 'onHover' event
        // to be able to do so, a reference to the underlying HTML element is needed. 
        // The first time the render() is called, buttonRef.current will be null. 
        // It will be populated immediatly after the element has been mounted on the page. 
        // We force a re-render here to make sure that the tooltip-ref is not null. 
        this.forceUpdate();
    }

    render() {
        const { children, href } = this.props;
        const { isOpen } = this.state;

        return <>
            <a href={href || "#!" } target={href && "_blank"} rel="noopener noreferrer" ref={this.buttonRef} onClick={this.onClick}>
                <FontAwesomeIcon icon={faQuestionCircle} transform="shrink-4 up-3" />
            </a>
            {this.buttonRef.current &&
                <Tooltip placement="right" isOpen={isOpen} target={this.buttonRef.current} toggle={this.toggleOpen}>
                     {children}
                </Tooltip>   
            }
        </>;
    }
}