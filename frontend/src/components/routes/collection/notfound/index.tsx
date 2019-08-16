import React from 'react';
import { Button } from "reactstrap";
import MDHMain from "../../../common/MDHMain";
import { Link } from "react-router-dom";

interface MDHCollectionNotFoundProps {
    /** name of the collection that could not be found */
    name: string;
}

/** Renders a collection that is not found */
export default class MDHCollectionNotFound extends React.Component<MDHCollectionNotFoundProps> {
    render() {
        const { name } = this.props;

        const leftHead = <p>Collection with slug <b>{name}</b> does not exist. </p>;
        const buttons = <Link to='/'><Button>Back to Home</Button></Link>;

        return <MDHMain title="Not Found" leftHead={leftHead} buttons={buttons} />;
    }
}