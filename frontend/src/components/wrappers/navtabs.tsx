import * as React from "react"
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";

type NavTabProps = {
    children: Array<{
        id: React.Key;
        title: React.ReactNode | React.ReactNode[];
        children: React.ReactNode | React.ReactNode[];
    }>,
    className?: string;
}

export default class NavTabs extends React.Component<NavTabProps, { active: number }> {
    state = {
        active: 0,
    }

    private readonly setActive = (active: number) => {
        this.setState({ active })
    }
    render() {
        const { children, className } = this.props
        const { active } = this.state

        return <>
            <Nav tabs>
                {children.map((tab, index) =>
                    <NavItem key={tab.id}>
                        <NavLink
                            className={(active === index) ? "active" : ""}
                            onClick={this.setActive.bind(this, index)}
                        >{tab.title}</NavLink>
                    </NavItem>
                )}
            </Nav>
            <TabContent activeTab={children[active]?.id} className={className}>
                {children.map(tab =>
                    <TabPane key={tab.id} tabId={tab.id}>{
                    tab.children
                    }</TabPane>
                )}
            </TabContent>
        </>
        
    }
}