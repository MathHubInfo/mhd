import React from 'react';
import MDHMain from "../../../common/MDHMain";
import { ParsedMDHCollection } from "../../../../client/derived";
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
        const { item } = this.props;

        const leftHead = JSON.stringify(item);
        /*const buttons = <>
            <Link to={`/collection/${collection.slug}/`}><Button>Back to Collection</Button></Link>
        </>;*/
        const buttons = null;

        return <MDHMain title={`Item ${item._id}`} leftHead={leftHead} buttons={buttons} />;
    }
}