import React from "react"
import { Col } from "reactstrap"
import type { MHDFilter, ParsedMHDCollection } from "../../../client/derived"
import type { TValidationResult } from "../../../codecs/codec"
import type Codec from "../../../codecs/codec"
import type { TMHDProperty } from "../../../client/rest"
import styles from "./FilterSelector.module.css"
import PropertyHover from "../../common/PropertyInfoButton"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus, faMinus, faCheck, faPen } from "@fortawesome/free-solid-svg-icons"

type FilterSelectorProps = {
    /** the current collection */
    collection: ParsedMHDCollection;

    /** the initially set filters */
    filters: IdentifiedFilter[];

    /** callback when filters are applied  */
    onFilterUpdate: (filters: IdentifiedFilter[]) => void;
}

type IdentifiedFilter = MHDFilter & {
    uid?: React.Key,
    initialEdit?: boolean;
}

/**
 * Allows the user to select and edit filters. 
 * Notifies the parent via onFilterUpdate every time any change occurs. 
 */
export default class FilterSelector extends React.Component<FilterSelectorProps> {
    private uid = 0
    private readonly addFilter = (slug: string) => {
        this.doFilterUpdate(f => f.push({ slug: slug, value: null, uid: this.uid++, initialEdit: true }))
    }

    private readonly updateFilter = (index: number, value: string) => {
        this.doFilterUpdate(f => {
            f[index] = {
                ...f[index], // make sure we make a copy!
                value: value,
                initialEdit: false,
            }
        })
    }

    /** removeFilter removes the filter with the selected index */
    private readonly removeFilter = (index: number) => {
        this.doFilterUpdate(f => f.splice(index, 1))
    }

    private readonly doFilterUpdate = (update: (filters: IdentifiedFilter[]) => void) => {
        const { filters, onFilterUpdate } = this.props

        const filters2 = [...filters]
        update(filters2)

        onFilterUpdate(filters2)
    }

    /** renders the selected filters */
    private renderSelected() {
        const { filters, collection: { propMap, codecMap } } = this.props

        return <>
            {filters.length === 0 && <p className="text-center my-3">Select filters from the list on the left</p>}
            <ul className="fa-ul">
                {filters.map((filter, index) => (
                    <SelectedFilter key={filter.uid}
                        property={propMap.get(filter.slug)!}
                        codec={codecMap.get(filter.slug)!}
                        filter={filter}

                        onApplyFilter={this.updateFilter.bind(this, index)}
                        onRemoveFilter={this.removeFilter.bind(this, index)} />
                ))}
            </ul>
        </>
    }

    /** renders the available filters */
    private renderAvailable() {
        const { collection: { properties, codecMap } } = this.props
        return <ul className="fa-ul">
            {properties
                .filter(p => !codecMap.get(p.slug).hiddenFromFilterList(p))
                .map((p) =>
                    <li key={p.slug}
                        onClick={this.addFilter.bind(this, p.slug)}>
                        <FontAwesomeIcon icon={faPlus} listItem />
                        {p.displayName} {<PropertyHover prop={p} />}
                    </li>
                )}
        </ul>
    }

    render() {
        return (
            <>
                <Col md="6" sm="12" className={styles.availableFilters}>
                    <div>
                        <h5>Available conditions</h5>
                        <div className={styles.searchFilter}>
                            <div className={styles.filterBox}>
                                {this.renderAvailable()}
                            </div>
                        </div>
                    </div>

                </Col>
                <Col md="6" sm="12" className={styles.selectedFilters}>
                    <div>
                        <h5>Active conditions</h5>
                        <div className={styles.searchFilter}>
                            <div className={styles.filterBox}>
                                {this.renderSelected()}
                            </div>
                        </div>
                    </div>
                </Col>
            </>
        )
    }
}

type TSelectedFilterProps<S, T> = {
    /** the schema of this filter */
    property: TMHDProperty;

    /** the values of this codec */
    codec: Codec<S, T>,

    /** the selected filter value */
    filter: IdentifiedFilter;

    /** callback when a value has been updated */
    onApplyFilter: (value: MHDFilter["value"]) => void;

    /** called when a filter is removed */
    onRemoveFilter: () => void;
}

type TSelectedFilterState<T> = {
    /** are we in edit mode? */
    edit: boolean;

    /** indicates if the current value is valid or not. */
    valid?: boolean;

    /** the value of a filter */
    internalValue: T;
}


class SelectedFilter<S = any, T = any> extends React.Component<TSelectedFilterProps<S, T>, TSelectedFilterState<T>> {

    state: TSelectedFilterState<T> = {
        edit: !!this.props.filter.initialEdit,
        internalValue: this.props.codec.parseFilterValue(this.props.filter.value),
    }

    editFilter = () => {
        this.setState({ edit: true, valid: true })
    }

    handleValueUpdate = (internalValue: T, surpressValidation?: boolean) => {
        // if we want to surpress validation
        if (surpressValidation) {
            this.setState({ internalValue, valid: undefined })
            return
        }

        const { valid } = this.validateValue(internalValue)
        this.setState({ internalValue, valid })
    }

    /**
     * Validates the internal value of this result
     */
    validateValue = (internalValue: T): TValidationResult => {
        const { codec, filter: { value: lastValue } } = this.props

        // validate using the codec
        try {
            return codec.cleanFilterValue(internalValue, lastValue || undefined)
        } catch (e: any) {
            return { valid: false, message: (e || "").toString() }
        }
    }

    /**
     * Validates and applies the current internal value (iff it is valid)
     */
    handleApply = () => {
        const validationResult = this.validateValue(this.state.internalValue)

        // when valid update the parent
        if (validationResult.valid) {
            this.setState({ valid: true, edit: false })
            this.props.onApplyFilter(validationResult.value)

            // else mark as invalid
        } else {
            this.setState({ valid: false })
        }
    }

    componentDidMount() {
        this.handleValueUpdate(this.state.internalValue, false)
    }

    render() {
        const { edit, internalValue, valid } = this.state
        const { onRemoveFilter, property: { displayName }, codec } = this.props

        const FilterViewerComponent = codec.filterViewerComponent()
        const FilterEditorComponent = codec.filterEditorComponent()

        return (
            <li className={(edit ? styles.edit : "")}>
                {
                    edit ?
                        <FilterEditorComponent value={internalValue} valid={valid} onChange={this.handleValueUpdate} onApply={this.handleApply} codec={this.props.codec}>
                            {displayName}
                        </FilterEditorComponent>
                        :
                        <FilterViewerComponent value={internalValue} codec={this.props.codec}>
                            {displayName}
                        </FilterViewerComponent>
                }

                <span className="text-muted small">
                    <span className={styles.removeButton} onClick={onRemoveFilter}><FontAwesomeIcon icon={faMinus} /></span>
                    <span className={styles.doneButton} onClick={this.handleApply}><FontAwesomeIcon icon={faCheck} /></span>
                    <span className={styles.editButton} onClick={this.editFilter}><FontAwesomeIcon icon={faPen} /></span>
                </span>
            </li>
        )
    }
}
