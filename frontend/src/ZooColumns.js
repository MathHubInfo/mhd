import React, { Component } from 'react';
import { Button} from 'reactstrap';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons'
/* DATA */
import objectProperties from './objectProperties.json';

const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: "none",
    ...draggableStyle // styles we need to apply on draggables
});

const getListStyle = isDraggingOver => ({
  background: isDraggingOver ? "rgba(25, 113, 127, 0.15)" : "rgba(25, 113, 127, 0.05)",
  display: "flex",
  overflow: "auto"
});

export default class ChooseColumns extends Component {
    
    constructor(props) {
        super(props);
        this.getResetState = () => {
            return {
                selected: this.props.current,
                expanded: false
            };
        }
        this.state = this.getResetState();
        this.onDragEnd = this.onDragEnd.bind(this);
        this.reset = this.reset.bind(this);
        this.toggleExpanded = this.toggleExpanded.bind(this);
        this.getAvailable = () => {
            return Object.keys(objectProperties[this.props.objects]).filter((k) => {
                return this.state.selected.indexOf(k) < 0;
            })
        }
    }

    onDragEnd(result) {
        if (!result.destination) { return; }
        if (result.source.droppableId === result.destination.droppableId && 
            result.source.index === result.destination.index) { 
            return; 
        }

        const newSelected = Array.from(this.state.selected);
        if (result.source.droppableId === "selected") {
            newSelected.splice(result.source.index, 1);
        }
        if (result.destination.droppableId === "selected") {
            newSelected.splice(result.destination.index, 0, result.draggableId);
        }
        this.setState({ selected: newSelected });
    }
    
    toggleExpanded() { this.setState({ expanded: !this.state.expanded }); }
    reset() { this.setState(this.getResetState()); }

    render() {
        return (
            <div className="settings">
                <p><Button color="link" onClick={this.toggleExpanded}>
                    <FontAwesomeIcon icon={this.state.expanded ? faAngleUp : faAngleDown} />
                    <span>Choose columns</span>
                </Button></p>
                {this.state.expanded &&
                    <React.Fragment>
                        <DragDropContext onDragEnd={this.onDragEnd}>
                            <DroppableArea id="selected" caption="Selected columns" items={this.state.selected} />
                            <DroppableArea id="available" caption="Available columns" items={this.getAvailable()} />
                        </DragDropContext>
                        <Button color="secondary" size="sm" onClick={this.reset}>Cancel</Button>
                        <Button color="primary" size="sm" className="ml-3" onClick={() => {this.props.apply(this.state.selected)}}>Apply</Button>
                    </React.Fragment>
                }
            </div>
        );
    }
}

class DroppableArea extends Component {
    render() {
        return (
            <Droppable droppableId={this.props.id} direction="horizontal">
                {(provided, snapshot) => (
                    <div>
                        <p className="droppable-caption">{this.props.caption}</p>
                        <div
                            className="droppable-area"
                            ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}
                            {...provided.droppableProps}
                        >
                            {this.props.items.map((item, index) => (
                                <DraggableColumn key={item} id={item} index={index} item={item} />
                            ))}
                            {provided.placeholder}
                        </div>
                    </div>
                )}
            </Droppable>
        );
    }
}

class DraggableColumn extends Component {
    render() {
        return(
            <Draggable draggableId={this.props.id} index={this.props.index}>
                {(provided, snapshot) => (
                    <div
                        className="btn btn-outline-secondary btn-sm draggable-item"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style
                        )}
                    >
                        {this.props.item}
                    </div>
                )}
            </Draggable>
        );
    }
}