import React, { Component } from 'react';
import { Col, Button, ButtonGroup } from 'reactstrap';
import {ZooInfoButton} from './ZooReusables';
import {getFilterObject} from './util.js';

/* * * * * * * * * * * * * * * * * * * * * * * * *
    Handling filters
    - - - - - - - - - - - - - - - -
    null: filter selected, no valid value
    true/false: boolean values (default = true)
    /^(=|==|<=|>=|<|>|<>|!=)(\d+\.?\d*)$/
 * * * * * * * * * * * * * * * * * * * * * * * * */
export default class ZooFilters extends Component {
    
    constructor(props) {
        super(props);
        this.state = { selected: [] };
        this.availableFilters = props.properties.map((p) => getFilterObject(p));
        this.updateFilters = this.updateFilters.bind(this);
    }
    
    updateFilters(par) {
        var newSelected = this.state.selected.slice(0)
        if (par.action === "add") {
            newSelected.push({slug: par.slug, value: null});
        }
        else { // remove or update
            var newFilter = { slug: newSelected[par.i].slug }
            newSelected.splice(par.i, 1);
            if (par.action === "update") {
                newFilter.value = par.value;
                newSelected.push(newFilter);
            }
        }
        this.setState({selected: newSelected});
        if (par.action !== "add") this.props.callback(JSON.stringify(newSelected)); 
    }
    
    renderAvailable(filters) {
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
    
    renderSelected(filters, filterDictionary) {
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


class SelectedFilter extends Component {
    
    constructor(props) {
        super(props);
        this.state = { edit: true, value: (this.props.info.type === "StandardBool" ? true : "") };
        this.editFilter = this.editFilter.bind(this);
        this.toggleBooleanValue = this.toggleBooleanValue.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.validateAndUpdate = this.validateAndUpdate.bind(this);
    }
    
    editFilter() {
        this.setState({ edit: true });
    }
    
    toggleBooleanValue(newValue) {
        const previousValue = this.state.value;
        if (newValue === previousValue) { return; }
        this.setState({ value: newValue });
    }
    
    handleInputChange(e) {
        this.setState({ value: e.target.value });
    }
    
    validateAndUpdate() {
        var valueValid = false;
        var actualValue = null;
        function standardizer(match, operator, value, offset, string) {
            var actualOperator = null
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
            const v = this.state.value.replace(/ /g, '');
            const r = /^(=|==|<=|>=|<|>|<>|!=)?(\d+\.?\d*)$/;
            valueValid = r.test(v)
            if (valueValid) actualValue = v.replace(r, standardizer);
        }
        if (valueValid) {
            this.setState({ edit: false });
            this.props.onDoneEditing(actualValue);
        }
    }
    
    renderEditCondition() {
        if (this.props.info.type === "StandardBool") {
            return(
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
                    onChange={this.handleInputChange.bind(this)}
                    value={this.state.value} />
            );
        }
    }
    
    render() {
        return(
            <li key={this.props.name} className={(this.state.edit ? "edit" : "")}>
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