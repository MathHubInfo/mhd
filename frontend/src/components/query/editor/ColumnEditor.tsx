import type { CSSProperties } from "react"
import { Component } from "react"
import type { DraggingStyle, DropResult, NotDraggingStyle } from "react-beautiful-dnd"
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd"
import { Col } from "reactstrap"
import type { ParsedMHDCollection } from "../../../client/derived"
import WithID from "../../wrappers/withid"

import styles from "./index.module.css" // Import css modules stylesheet as styles

interface ColumnEditorProps {
    /** the current collection */
    collection: ParsedMHDCollection;

    /** the initially selected columns */
    columns: string[];

    /** called when the columns are applied by the user */
    onColumnsUpdate: (newColumns: string[]) => void;
}

/**
 * An editor where users can drag and drop columns between being selected and not selected. 
 * Notifies the caller via onColumnsApply() every time the columns are changed. 
 * Also notifies on mount. 
 */
export class ColumnEditor extends Component<ColumnEditorProps & { ids: [string, string] }> {
    private selectedID = () => this.props.ids[0]
    private availableID = () => this.props.ids[1]
    private handleDragEnd = (result: DropResult) => {
        // there was no destination => nothing to be dropped
        if (!result.destination) { return }

        // if we dropped it exactly where we were, we don't have to do anything
        if (result.source.droppableId === result.destination.droppableId &&
            result.source.index === result.destination.index) {
            return
        }
        const newSelected = Array.from(this.props.columns)
        if (result.source.droppableId === this.selectedID()) {
            newSelected.splice(result.source.index, 1)
        }
        if (result.destination.droppableId === this.selectedID()) {
            newSelected.splice(result.destination.index, 0, result.draggableId)
        }
        this.props.onColumnsUpdate(newSelected)
    }

    componentDidMount() {
        this.props.onColumnsUpdate(this.props.columns)
    }

    render() {
        const { collection: { propertySlugs, nameMap }, columns } = this.props
        const available = propertySlugs.filter(n => !columns.includes(n))

        const columnNames = columns.map(s => nameMap.get(s)!)
        const availableNames = available.map(s => nameMap.get(s)!)

        return <Col sm="12">
            <h5>Choose Columns To Display</h5>
            <p>
                Drag and Drop between <code>Selected Columns</code> and <code>Available Columns</code> to determine which columns are displayed.
                By default all columns are displayed.
            </p>

            <DragDropContext onDragEnd={this.handleDragEnd}>
                <DroppableArea id={this.selectedID()} caption="Selected columns" items={columns} names={columnNames} />
                <DroppableArea id={this.availableID()} caption="Available columns" items={available} names={availableNames} />
            </DragDropContext>
        </Col>
    }
}

export default WithID(ColumnEditor, { count: 2 })

interface DroppableAreaProps {
    /** id of the area */
    id: string;

    /** displayed title of the area */
    caption: string;

    /** items contained in the area */
    items: string[];

    /** names of the items contained in the area */
    names: (string | undefined)[]
}

/** Represents an area where items can be dragged and dropped to */
class DroppableArea extends Component<DroppableAreaProps> {
    render() {
        return (
            <Droppable droppableId={this.props.id} direction="horizontal">
                {(provided, snapshot) => (
                    <div>
                        <p className={styles.droppableCaption}>{this.props.caption}</p>
                        <div
                            className={styles.droppableArea}
                            ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}
                            {...provided.droppableProps}
                        >
                            {this.props.items.map((item, index) => (
                                <DraggableColumn key={item} index={index} item={item} name={this.props.names[index]} />
                            ))}
                            {provided.placeholder}
                        </div>
                    </div>
                )}
            </Droppable>
        )
    }
}

function getListStyle(isDraggingOver: boolean): CSSProperties {
    return {
        background: isDraggingOver ? "rgba(25, 113, 127, 0.15)" : "rgba(25, 113, 127, 0.05)",
        display: "flex",
        overflow: "auto",
    }
}

interface DraggableColumnProps {
    /** the index of the column */
    index: number;

    /** item this column represents, used for all ids */
    item: string;

    /** when provided, use this as name for content */
    name?: string;
}

/**
 * A single draggable column element
 */
class DraggableColumn extends Component<DraggableColumnProps> {
    render() {
        const { item, name, index } = this.props

        return (
            <Draggable draggableId={item} index={index}>
                {(provided, snapshot) => (
                    <div
                        className={`btn btn-outline-secondary btn-sm ${styles.draggableItem}`}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style!
                        )}
                    >
                        {name || item}
                    </div>
                )}
            </Draggable>
        )
    }
}

function getItemStyle(isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle): CSSProperties {
    return {
        userSelect: "none",
        ...draggableStyle, // styles we need to apply on draggables
    }
}