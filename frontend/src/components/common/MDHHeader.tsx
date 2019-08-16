import React from 'react';
import { Navbar, NavbarBrand, NavbarToggler, Collapse, Nav, NavItem, NavLink } from "reactstrap";
import { NavLink as RouterNavLink } from "react-router-dom";

interface MDHHeaderState {
    isOpen: boolean;
}

export default class MDHHeader extends React.Component<{}, MDHHeaderState> {
    state: MDHHeaderState = {
        isOpen: false,
    }

    private toggle = () => {
        this.setState(({ isOpen }: MDHHeaderState) => ({ isOpen: !isOpen }));
    }

    render() {
        const { isOpen } = this.state;
        return (
            <Navbar color="light" light expand="md">
                <NavbarBrand href="/">MathDataHub</NavbarBrand>
                <NavbarToggler onClick={this.toggle} />
                <Collapse isOpen={isOpen} navbar>
                    <Nav className="ml-auto" navbar>
                        <NavItem>
                            <NavLink tag={RouterNavLink} exact to="/">Home</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href="https://github.com/MathHubInfo/mdh_django" className={"item-link"}>
                                <i className="fab fa-github" data-fa-transform="grow-8"></i>
                            </NavLink>
                        </NavItem>
                    </Nav>
                </Collapse>
            </Navbar>
        );
    }
}