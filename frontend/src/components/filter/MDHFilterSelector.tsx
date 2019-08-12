import React, { Component, ChangeEvent } from 'react';
import { Col, Button, ButtonGroup } from 'reactstrap';
import { ParsedMDHCollection, MDHFilterSchema, MDHFilter } from "../../client/derived";

interface MDHFilterSelectorProps {
    /** the current collection */
    collection: ParsedMDHCollection;

    /** callback when filters are applied  */
    onFilterUpdate: (filters: MDHFilter[]) => void;
}

interface MDHFilterSelectorState {
    selected: TFilter[];
}

interface TFilter {
    value: TFilterValue;
    slug: string;
}


/* * * * * * * * * * * * * * * * * * * * * * * * *
    Filter values
    - - - - - - - - - - - - - - - -
    null: filter selected, no valid value
    true/false: boolean values (default = true)
    /^(=|==|<=|>=|<|>|<>|!=)(\d+\.?\d*)$/
 * * * * * * * * * * * * * * * * * * * * * * * * */
type TFilterValue = string | boolean | null;

type TFilterAction = {
    action: "add",
    slug: string;
} | {
    action: "remove",
    i: number;
} | {
    action: "update",
    i: number,
    value: TFilterValue,
}

/**
 * Allows the user to select and edit filters. 
 * Notifies the parent via onFilterUpdate every time any change occurs. 
 */
 export default class MDHFilterSelector extends Component<MDHFilterSelectorProps, MDHFilterSelectorState> {

    state: MDHFilterSelectorState = {
        selected: [],
    }

    availableFilters: MDHFilterSchema[] = this.props.collection.propertyArray;
    
    /** updates the state of filters */
    updateFilters = (par: TFilterAction) => {
        // fetch a copy of the new filters
        const newSelected = this.state.selected.slice(0);
        
        if (par.action === "add") {
            // add a new element at the end
            newSelected.push({slug: par.slug, value: null});
        } else {
            // create a new filter with the old slug, then remove the old one
            const newFilter: TFilter = { slug: newSelected[par.i].slug, value: null }
            newSelected.splice(par.i, 1);

            // if we had an update, insert the one with the new value
            // TODO: Why is this added at the end (via .push)
            if (par.action === "update") {
                newFilter.value = par.value;
                newSelected.push(newFilter);
            }
        }
        
        // update the state and notify the parent
        this.setState({selected: newSelected});
        this.props.onFilterUpdate(newSelected);
    }
    
    /** renders the available filters */
    renderAvailable(filters: MDHFilterSchema[]) {
        return(
            <div className="zoo-search-filter">
                <div className="zoo-filter-box">
                    <ul className="fa-ul">
                        {filters.map((f) => 
                            <li key={f.slug}
                                onClick={() => this.updateFilters({action: "add", slug: f.slug})}>
                                <span className="fa-li"><i className="fas fa-plus"></i></span>
                                {f.display} <ZooInfoButton value="filter" />
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        );
    }
    
    /** renders the selected filters */
    renderSelected(filters: TFilter[], filterDictionary: ParsedMDHCollection["propertyDictionary"]) {
        return(
            <div className="zoo-search-filter">
                <div className="zoo-filter-box">
                    {filters.length === 0 && <p className="text-center my-3">Select filters</p>}
                    <ul className="fa-ul">
                        {filters.map((f, index) => (
                            <SelectedFilter key={index}
                                info={filterDictionary[f.slug]}
                                value={f.value}
//                                type={collection.columns[f.name].type}
                                onDoneEditing={(v) => this.updateFilters({action: "update", i: index, value: v})}
                                onRemoveFilter={() => this.updateFilters({action: "remove", i: index})}/>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }
    
    render() {
        return(
            <React.Fragment>
                <Col id="zoo-selected-filters" md="5" sm="7" className="mx-auto my-4">
                    {this.renderSelected(this.state.selected, this.props.collection.propertyDictionary)}
                </Col>
                <Col id="zoo-choose-filters" md="4" sm="5" className="mx-auto my-4">
                    {this.renderAvailable(this.availableFilters)}
                </Col>
            </React.Fragment>
        );
    }
}

interface TSelectedFilterProps {
    /** the text of the selected filter */
    info: MDHFilterSchema;

    /** the value of the selected filter */
    value: TFilterValue;

    /** callback when a value has been updated */
    onDoneEditing: (value: TFilterValue) => void;

    /** called when a filter is removed */
    onRemoveFilter: () => void;
}

interface TSelectedFilterState {
    /** are we in edit mode? */
    edit: boolean;

    /** the value of a filter */
    value: string | boolean;
}


class SelectedFilter extends Component<TSelectedFilterProps, TSelectedFilterState> {

    state: TSelectedFilterState = {
        edit: true,
        value: (this.props.info.type === "StandardBool" ? true : ""),
    }
    
    editFilter = () => {
        this.setState({ edit: true });
    }
    
    toggleBooleanValue = (newValue: boolean) => {
        const previousValue = this.state.value;
        if (newValue === previousValue) return;

        this.setState({ value: newValue });
    }
    
    handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({ value: e.target.value });
    }
    
    validateAndUpdate = () => {
        let valueValid = false;
        let actualValue = null;
        
        function standardizer(match: string, operator: string, value: string, offset: number) {
            let actualOperator = null;
            if (typeof operator === 'undefined' || operator === "=" || operator === "==") actualOperator = "=";
            else if (operator === "<>" || operator === "!=") actualOperator = "!=";
            else actualOperator = operator;
            return actualOperator + value;
        }

        if (this.props.info.type === "StandardBool") {
            valueValid = (this.state.value === true || this.state.value === false)
            if (valueValid) actualValue = this.state.value;
        }
        if (this.props.info.type === "StandardInt") {
            const v = (this.state.value as string).replace(/ /g, '');
            const r = /^(=|==|<=|>=|<|>|<>|!=)?(\d+\.?\d*)$/;
            valueValid = r.test(v)
            if (valueValid) actualValue = v.replace(r, standardizer);
        }
        if (valueValid) {
            this.setState({ edit: false });
            this.props.onDoneEditing(actualValue);
        }
    }
    
    renderEditCondition = () => {
        if (this.props.info.type === "StandardBool") {
            return (
                <ButtonGroup id="zoo-choose-objects" className="zoo-bool-filter btn-group-sm">
                    <Button
                        className={(this.state.value ? "focus" : "")}
                        onClick={this.toggleBooleanValue.bind(this, true)}>True</Button>
                    <Button
                        className={(!this.state.value ? "focus" : "")}
                        onClick={this.toggleBooleanValue.bind(this, false)}>False</Button>
                </ButtonGroup>
            );
        }
        else {
            return (
                <input className="zoo-numeric-filter" type="text"
                    onChange={this.handleInputChange}
                    value={(this.state.value || "").toString()} />
            );
        }
    }
    
    render() {
        return(
            <li className={(this.state.edit ? "edit" : "")}>
                { (this.state.value === false && (!this.state.edit)) && <i>not </i> }
                {this.props.info.display} <ZooInfoButton value="filter" />
                { !this.state.edit && <i className="zoo-numeric-condition-display">{this.state.value} </i> }
                { this.state.edit && this.renderEditCondition() }
                <span className="text-muted small">
                    <span className="remove-button" onClick={this.props.onRemoveFilter}><i className="fas fa-minus"></i></span>
                    <span className="done-button" onClick={this.validateAndUpdate.bind(this)}><i className="fas fa-check"></i></span>
                    <span className="edit-button" onClick={this.editFilter.bind(this)}><i className="fas fa-pen"></i></span>
                </span>
            </li>
        );
    }
}

/**
 * A simple informational button
 */
export function ZooInfoButton(props: {value: string}) {
    return(
        <a href="#!" className={"info-" + props.value}>
            <i className="far fa-question-circle" data-fa-transform="shrink-4 up-3"></i>
        </a>
    );
}