import React from 'react';
import { Button } from "reactstrap";
import MDHMain from "../../../common/MDHMain";
import { Link } from "react-router-dom";

interface MDHItemNotFoundProps {
    /** collection name */
    collection: string;
    /** uuid of the item that could not be found */
    uuid: string;
}

/** Renders a collection that is not found */
export default class MDHItemNotFound extends React.Component<MDHItemNotFoundProps> {
    render() {
        const { collection } = this.props;

        const leftHead = <p>Did not find selected item. </p>;
        const buttons = <>
            <Link to={`/collection/${collection}/`}><Button>Back to Collection</Button></Link>
        </>;

        return <MDHMain title="Not Found" leftHead={leftHead} buttons={buttons} />;
    }
}