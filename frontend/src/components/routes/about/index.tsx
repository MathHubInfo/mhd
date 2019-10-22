import React from 'react';
import { Button, Container } from "reactstrap";
import MDHMain from "../../common/MDHMain";
import { Link } from "react-router-dom";

/** Renders a collection that is not found */
export default class MHDAboutPage extends React.Component {
    render() {
        const buttons = <Link to='/'><Button>Back to Home</Button></Link>;

        return <MDHMain title="About MathHubData" buttons={buttons}>
            <Container>
                <p>Loreum Ipsum</p>
            </Container>
        </MDHMain>;
    }
}