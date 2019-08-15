import React from 'react';
import { Col } from 'reactstrap';
import { MDHFilter, ParsedMDHCollection } from "../../client/derived";
import Codec, { TValidationResult } from "../../codecs/codec";
import { TMDHProperty } from "../../client/rest";

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
type TFilterValue = string | null;

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
 export default class MDHFilterSelector extends React.Component<MDHFilterSelectorProps, MDHFilterSelectorState> {

    state: MDHFilterSelectorState = {
        selected: [],
    }

    availableFilters = this.props.collection.properties;
    
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
    renderAvailable() {
        const { collection: { properties } } = this.props;
        return(
            <div className="zoo-search-filter">
                <div className="zoo-filter-box">
                    <ul className="fa-ul">
                        {properties.map((p) => 
                            <li key={p.slug}
                                onClick={() => this.updateFilters({action: "add", slug: p.slug})}>
                                <span className="fa-li"><i className="fas fa-plus"></i></span>
                                {p.displayName} <ZooInfoButton value="filter" />
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        );
    }
    
    /** renders the selected filters */
    renderSelected() {
        const { selected } = this.state;
        const { collection: { propMap, codecMap } } = this.props;

        return(
            <div className="zoo-search-filter">
                <div className="zoo-filter-box">
                    {selected.length === 0 && <p className="text-center my-3">Select filters</p>}
                    <ul className="fa-ul">
                        {selected.map(({ slug, value }, index) => (
                            <SelectedFilter key={index}
                                property={propMap.get(slug)!}
                                codec={codecMap.get(slug)!}
                                value={value}
                                onApplyFilter={(v) => this.updateFilters({action: "update", i: index, value: v})}
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
                    {this.renderSelected()}
                </Col>
                <Col id="zoo-choose-filters" md="4" sm="5" className="mx-auto my-4">
                    {this.renderAvailable()}
                </Col>
            </React.Fragment>
        );
    }
}

interface TSelectedFilterProps<T> {
    /** the schema of this filter */
    property: TMDHProperty;

    /** the values of this codec */
    codec: Codec<any, T>,

    /** the value of the selected filter */
    value: TFilterValue;

    /** callback when a value has been updated */
    onApplyFilter: (value: TFilterValue) => void;

    /** called when a filter is removed */
    onRemoveFilter: () => void;
}

interface TSelectedFilterState<T> {
    /** are we in edit mode? */
    edit: boolean;

    /** indicates if the current value is valid or not. */
    valid?: boolean;

    /** the value of a filter */
    internalValue: T;
}


class SelectedFilter<T = any> extends React.Component<TSelectedFilterProps<T>, TSelectedFilterState<T>> {

    state: TSelectedFilterState<T> = {
        edit: true,
        internalValue: this.props.codec.defaultFilterValue(),
    }
    
    editFilter = () => {
        this.setState({ edit: true, valid: true });
    }
    
    handleValueUpdate = (internalValue: T, surpressValidation?: boolean) => {
        // if we want to surpress validation
        if ( surpressValidation ) {
            this.setState({ internalValue, valid: undefined });
            return;
        }

        const { valid } = this.validateValue(internalValue);
        this.setState({ internalValue, valid });
    }

    /**
     * Validates the internal value of this result
     */
    validateValue = (internalValue: T): TValidationResult => {
        const { codec, value: lastValue } = this.props;
        
        // validate using the codec
        try {
            return codec.cleanFilterValue(internalValue, lastValue || undefined )
        } catch(e) {
            return { valid: false, message: (e || "").toString()};
        }
    }
    
    /**
     * Validates and applies the current internal value (iff it is valid)
     */
    handleApply = () => {
        const validationResult = this.validateValue(this.state.internalValue)
        
        // when valid update the parent
        if (validationResult.valid) {
            this.setState({ valid: true, edit: false });
            this.props.onApplyFilter(validationResult.value);

        // else mark as invalid
        } else {
            this.setState({ valid: false });
        }
    }
    
    render() {
        const { edit, internalValue, valid } = this.state;
        const { onRemoveFilter } = this.props;

        const { property: { displayName }, codec: { filterViewerComponent: FilterViewerComponent, filterEditorComponent: FilterEditorComponent } } = this.props;

        return(
            <li className={(edit ? "edit" : "")}>
                {
                    edit ?
                        <FilterEditorComponent value={internalValue} valid={valid} onChange={this.handleValueUpdate} onApply={this.handleApply}>
                            <>
                                { displayName }
                                <ZooInfoButton value="filter" />
                            </>
                        </FilterEditorComponent>
                        :
                        <FilterViewerComponent value={internalValue}>
                            <>
                                { displayName }
                                <ZooInfoButton value="filter" />
                            </>
                        </FilterViewerComponent>
                }
                
                <span className="text-muted small">
                    <span className="remove-button" onClick={onRemoveFilter}><i className="fas fa-minus"></i></span>
                    <span className="done-button" onClick={this.handleApply}><i className="fas fa-check"></i></span>
                    <span className="edit-button" onClick={this.editFilter}><i className="fas fa-pen"></i></span>
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