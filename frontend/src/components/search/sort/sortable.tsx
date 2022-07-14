import * as React from "react"
import { default as ReactTags } from "react-tag-autocomplete"
import { MHDBackendClient } from "../../../client"
import type { ParsedMHDCollection } from "../../../client/derived"
import styles from "./sortable.module.css"

const CLASS_NAMES = {
    root: styles["react-tags"],
    rootFocused: styles["is-focused"],
    selected: styles["react-tags__selected"],
    selectedTag: styles["react-tags__selected-tag"],
    selectedTagName: styles["react-tags__selected-tag-name"],
    search: styles["react-tags__search"],
    searchWrapper: styles["react-tags__search-wrapper"],
    searchInput: styles["react-tags__search-input"],
    suggestions: styles["react-tags__suggestions"],
    suggestionActive: styles["is-active"],
    suggestionDisabled: styles["is-disabled"],
    suggestionPrefix: styles["react-tags__suggestion-prefix"],
}

/**
 * A rendered tag
 */
type Tag = {
    id: string;
    name: string;
}

function makeTagFromID(id: string, { propMap, codecMap }: ParsedMHDCollection): Tag | undefined {
    const { mod: tMod, id: tID } = MHDBackendClient.parseSortPart(id)

    const prop = propMap.get(tID)
    const codec = codecMap.get(tID)
    if (!prop || !codec.ordered) return undefined

    let name = prop.displayName
    if (tMod === "+") {
        name += " (ASC)"
    }
    if (tMod === "-") {
        name += " (DESC)"
    }

    return { id, name }
}

type SortableProps = {
    id?: string;
    collection: ParsedMHDCollection,

    value: string,
    onChange: (order: string) => void,
}

type SortableState = {
    tags: Array<Tag>
    suggestions: Array<Tag>
}

export default class Sortable extends React.Component<SortableProps, SortableState> {

    state = {
        tags: [],
        suggestions: [],
    }

    static getDerivedStateFromProps({ collection, value: order }: SortableProps, state: SortableState): Partial<SortableState> {
        const tags = order.split(",")
            .map( id => makeTagFromID(id, collection))
            .filter(tag => typeof tag !== "undefined")
        
        const suggestions = collection.properties.flatMap(({ slug }) => [
            makeTagFromID(slug, collection), 
            makeTagFromID(`+${slug}`, collection),
            makeTagFromID(`-${slug}`, collection),
        ]).filter(tag => typeof tag !== "undefined")

        return {
            tags,
            suggestions,
        }
    }

    /** turns a list of tags into a seralized tstae */
    private static tagsToOrder(tags: Array<Tag>): string {
        return tags.map(t => t.id).join(",")
    }

    /**
     * Called when a new tag is added to the list
     * @param tag 
     */
    private readonly onAddition = (tag: Tag) => {
        const tags = [].concat(this.state.tags, tag)
        this.props.onChange(
            Sortable.tagsToOrder(tags)
        )
    }

    /**
     * Called when an item is removed from the list
     * @param index 
     */
    private readonly onDelete = (index: number) => {
        const tags = this.state.tags.slice(0)
        tags.splice(index, 1)
        this.props.onChange(
            Sortable.tagsToOrder(tags)
        )
    }
    private readonly suggestionsFilter = (tag: Tag, query: string) => {
        const { mod: tMod, id: tID } = MHDBackendClient.parseSortPart(tag.id)
        const { mod: qMod, id: qID } = MHDBackendClient.parseSortPart(query)
        
        return (
            tag.name.startsWith(qID) || tID.startsWith(qID)
        ) && (
            qMod === "" ||tMod === qMod
        )
    }

    render() {
        const { id } = this.props
        const { tags, suggestions } = this.state
        return <ReactTags
            classNames={CLASS_NAMES}
            id={id}
            minQueryLength={1}

            tags={tags}
            suggestions={suggestions}
            suggestionsFilter={this.suggestionsFilter}
            placeholderText="Add another field"
            
            onAddition={this.onAddition}
            onDelete={this.onDelete}
        />
    }
}