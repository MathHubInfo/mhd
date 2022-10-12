import * as React from "react"
import LaTeX from "react-latex"
import { Badge, Tooltip } from "reactstrap"
import type { TMHDCollection } from "../../../client/rest"
import { isProduction } from "../../../controller"
import WithID from "../../wrappers/withid"

export default class CollectionTitle extends React.Component<{ collection: TMHDCollection }> {
    render() {
        const { collection: { displayName } } = this.props
        return <LaTeX>{displayName}</LaTeX>
    }
}

export class CollectionFlags extends React.Component<{ collection: TMHDCollection }> {
    render() {
        const { collection: { hidden, flag_large_collection, count } } = this.props
        return <p>
            <CountBadge count={count} />{" "}
            {flag_large_collection && <><LargeBadge />{" "}</>}
            {hidden && <HiddenBadge />}
        </p>
    }
}

class CountBadge extends React.Component<{count: number | null}> {
    render() {
        const { count } = this.props
        if (count === null && !isProduction) {
            return <>
                <HoverBadge title="Unknown count" color="danger">
                    No collection count available.
                    Run <code style={{ fontSize: ".75rem" }}>python manage.py update_count</code> to update it.
                </HoverBadge>
                {" "}
            </>
        }

        if (count === null) return
        
        return <>
            <HoverBadge simple color="info">
                {count} object{count != 1 && "s"}
            </HoverBadge>
            {" "}
        </>
    }
}

class HiddenBadge extends React.Component {
    render() {
        return <HoverBadge title="Unlisted" color="warning">
            This collection is not shown on the front page.
            Only share the link with people you trust.
        </HoverBadge>
    }
}

class LargeBadge extends React.Component {
    render() {
        return <HoverBadge title="Unlisted" color="danger">
            This collection is very large and queries might be slow. 
        </HoverBadge>
    }
}


type HoverBadgeProps = {
    color?: string;
    title?: React.ReactNode;
    simple?: boolean;
    ids: [string];
    children?: React.ReactNode | React.ReactNode[];
}

const HoverBadge = WithID(class HoverBadge extends React.Component<HoverBadgeProps, { hover: boolean }> {
    state = { hover: false }

    private readonly onToggle = () => {
        this.setState(({ hover }) => ({ hover: !hover }))
    }
    render() {
        const { color, title, ids: [id], children, simple } = this.props
        if (simple) {
            return <Badge color={color} id={ id }>{children}</Badge>
        }
        const { hover } = this.state
        return <>
            <Badge color={color} id={ id }>{title}</Badge>
            <Tooltip placement="right" isOpen={hover} target={id} toggle={this.onToggle}>
                {children}
            </Tooltip>
        </>
    }
}, { unsafeQuerySelectorAllSupport: true })

