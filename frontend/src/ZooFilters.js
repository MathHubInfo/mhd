import React, { Component } from 'react';
import { Col, Button, ButtonGroup } from 'reactstrap';
import {ZooInfoButton} from './ZooReusables';
/* DATA */
import objectProperties from './config/objectProperties.json';

/* * * * * * * * * * * * * * * * * * * * * * * * *
    Handling filters
    - - - - - - - - - - - - - - - -
    null: filter selected, no valid value
    true/false: boolean values (default = true)
    /^(=|==|<=|>=|<|>|<>|!=)(\d+\.?\d*)$/
 * * * * * * * * * * * * * * * * * * * * * * * * */
class ZooFilters extends Component {

    constructor(props) {
        super(props);
        this.addFilter = this.addFilter.bind(this);
    }
    
    getCurrentFilters() { return JSON.parse(this.props.filters); }
    updateFilters(filtersObject) { this.props.callback(JSON.stringify(filtersObject)); }
    
    addFilter(name) {
        const filters = this.getCurrentFilters();
        filters[name] = null;
        const newState = {};
        Object.keys(filters).sort().forEach(function(key) {
          newState[key] = filters[key];
        });
        this.updateFilters(newState);
    }
    
    removeFilter(name) {
        var newState = this.getCurrentFilters();
        delete newState[name];
        this.updateFilters(newState);
    }
    
    updateFilterValue(name, value) {
        var newState = this.getCurrentFilters();
        newState[name] = value;
        this.updateFilters(newState);
    }
    
    renderAvailable(filters) {
        return(
            <div className="zoo-search-filter">
                <div className="zoo-filter-box">
                    <ul className="fa-ul">
                        {filters.map((f) => 
                            <li key={f} onClick={this.addFilter.bind(this, f)}>
                                <span className="fa-li"><i className="fas fa-plus"></i></span>
                                {f.replace(/_/g, ' ')} <ZooInfoButton value="filter" />
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        );
    }
    
    renderSelected(filters) {
        return(
            <div className="zoo-search-filter">
                <div className="zoo-filter-box">
                    {filters.length === 0 && <p className="text-center my-3">Select filters</p>}
                    <ul className="fa-ul">
                        {filters.map((f) => (
                            <SelectedFilter key={f.name}
                                name={f.name}
                                value={f.value}
                                type={objectProperties[this.props.objects][f.name].type}
                                onDoneEditing={(v) => this.updateFilterValue(f.name, v)}
                                onRemoveFilter={() => this.removeFilter(f.name)}/>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }
    
    render() {
        const display = !(this.props.objects === null)
        var selected = [];
        var available = [];
        if (display) {
            const current = this.getCurrentFilters(); 
            const currentKeys = Object.keys(current);
            selected = currentKeys.map((k) => ({name: k, value: current[k]}));
            available = Object.keys(objectProperties[this.props.objects]).filter((f) => {
                return objectProperties[this.props.objects][f].isFilter && currentKeys.indexOf(f) < 0;
            })
        }
        return(
            <React.Fragment>
                <Col id="zoo-selected-filters" md="5" sm="7" className="mx-auto my-4">
                    {display && this.renderSelected(selected)}
                </Col>
                <Col id="zoo-choose-filters" md="4" sm="5" className="mx-auto my-4">
                    {display && this.renderAvailable(available)}
                </Col>
            </React.Fragment>
        );
    }
}


class SelectedFilter extends Component {
    
    constructor(props) {
        super(props);
        this.state = { edit: true, value: (this.props.type === "BoolIdent" ? true : "") };
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
        if (this.props.type === "BoolIdent") {
            valueValid = (this.state.value === true || this.state.value === false)
            if (valueValid) actualValue = this.state.value;
        }
        if (this.props.type === "IntIdent") {
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
        if (this.props.type === "BoolIdent") {
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
                {this.props.name.replace(/_/g, ' ')} <ZooInfoButton value="filter" />
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

export default ZooFilters;