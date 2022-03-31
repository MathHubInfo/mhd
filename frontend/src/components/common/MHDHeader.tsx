import React from 'react';
import { Navbar, NavbarBrand, NavbarToggler, Collapse, Nav, NavItem, NavLink } from "reactstrap";
import { default as Link } from "next/link";

interface MHDHeaderState {
    isOpen: boolean;
}

export default class MHDHeader extends React.Component<{}, MHDHeaderState> {
    state: MHDHeaderState = {
        isOpen: false,
    }

    private toggle = () => {
        this.setState(({ isOpen }: MHDHeaderState) => ({ isOpen: !isOpen }));
    }

    render() {
        const { isOpen } = this.state;
        return (
            <Navbar color="light" light expand="md">
                <NavbarBrand href="/">MathDataHub - your dataset, but FAIR</NavbarBrand>
                <NavbarToggler onClick={this.toggle} />
                <Collapse isOpen={isOpen} navbar>
                    <Nav className="ml-auto" navbar>
                        <NavItem>
                            <NavLink tag={Link} href='/about/' target="_blank" rel="noopener noreferrer">About</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href="https://github.com/MathHubInfo/mhd" className={"item-link"} target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-github"></i> GitHub
                            </NavLink>
                        </NavItem>
                    </Nav>
                </Collapse>
            </Navbar>
        );
    }
}