import React from 'react';
import { Button } from "reactstrap";
import MDHMain from "../../../common/MDHMain";
import { ParsedMDHCollection } from "../../../../client/derived";
import { Link } from "react-router-dom";
import { TMDHItem } from "../../../../client/rest";

interface MDHItemViewProps {
    /** collection */
    collection: ParsedMDHCollection;
    
    /** item */
    item: TMDHItem<{}>
}

/** Renders a collection that is not found */
export default class MDHItemView extends React.Component<MDHItemViewProps> {
    render() {
        const { collection, item } = this.props;

        const leftHead = <p>Item rendering to be implemented. </p>;
        const buttons = <>
            <Link to={`/collection/${collection.slug}/`}><Button>Back to Collection</Button></Link>
        </>;

        return <MDHMain title={`Item ${item._id}`} leftHead={leftHead} buttons={buttons} />;
    }
}