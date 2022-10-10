import * as React from "react"
import type { TCollectionPredicate } from "../../../client"
import type { TMHDCollection, TMHDProperty } from "../../../client/rest"
import CodecManager from "../../../codecs"
import ExportButton from "../../../exporters/button"
import PropertyHover from "../../common/PropertyInfoButton"

type PropertyHeaderContextual = {
    collection: TMHDCollection;
    query: TCollectionPredicate;
    order: string;
}
type PropertyHeaderProps = {
    property: TMHDProperty;
}

export const PropertyHeaderContext = React.createContext<PropertyHeaderContextual>(undefined!)

export default class PropertyHeader extends React.Component<PropertyHeaderProps> {
    render() {
        const { property } = this.props
        const { exporters } = CodecManager.getInstance().get(property.codec)
        return <PropertyHeaderContext.Consumer>{
            ({ collection, query, order }) => <>
                {property.displayName}
                
                <PropertyHover large prop={property}/>
                    {exporters.map(e =>
                    <ExportButton 
                        key={e.slug}

                        exporter={e}
                        flags={property}

                        collection={collection}
                        query={query}
                        order={order}
                    />
                )}
            </>
        }</PropertyHeaderContext.Consumer>
    }
}