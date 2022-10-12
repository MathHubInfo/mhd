import { Component } from "react"
import { Col, FormGroup, Label } from "reactstrap"
import type { ParsedMHDCollection } from "../../../client/derived"
import Sortable from "../sort/sortable"

import styles from "./index.module.css" // Import css modules stylesheet as styles

type OrderEditorProps = {
    /** the current collection */
    collection: ParsedMHDCollection;

    /** the currently selected order */
    order: string;

    /** called when the order is applied by the user */
    onOrderUpdate: (order: string) => void;
}

export default class OrderEditor extends Component<OrderEditorProps> {
    private onOrderUpdate = (order: string) => {
        this.props.onOrderUpdate(order)
    }

    componentDidMount(): void {
        this.props.onOrderUpdate(this.props.order) 
    }

    render() {
        const { order } = this.props
        return <Col sm="12">
            <h5>Sort Results</h5>
            <p>
                Type and use the autocomplete to determine in which order the results should be displayed.
                Click on a column (or use the keyboard) to remove it.
                Each column can be displayed <code>Ascending</code> or <code>Descending</code>.
                By default results are displayed in a consistent unspecified order.
            </p>
            <FormGroup>
                <Label className={styles.droppableCaption}>Custom Sort</Label>
                <Sortable collection={this.props.collection} onChange={this.onOrderUpdate} value={order} />
            </FormGroup>
        </Col>
    }
}

