import * as React from "react"
import { default as ReactTags } from "react-tag-autocomplete"
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

function parseTagID(id: string): [string, string] {
    if (id.startsWith("+")) return ["+", id.substring(1)]
    if (id.startsWith("-")) return ["-", id.substring(1)]
    return ["", id]
} 

function makeTagFromID(id: string, { propMap }: ParsedMHDCollection): Tag | undefined {
    const [tMod, tID] = parseTagID(id)
    let name = propMap.get(tID)?.displayName
    if (typeof name !== "string") return undefined

    if (tMod === "+") {
        name += " (ASC)"
    }
    if (tMod === "-") {
        name += " (DESC)"
    }

    return { id, name }
}

type SortableProps = {
    collection: ParsedMHDCollection,

    value: string,
    onChange: (order: string) => void,
}

type SortableState = {
    tags: Array<Tag>
    suggestions: Array<Tag>
}

export default class Sortable extends React.Component<SortableProps, SortableState> {

    // this initial state will be deserialized from props!
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
        ])

        return {
            tags,
            suggestions,
        }
    }

    private static tagsToOrder(tags: Array<Tag>): string {
        return tags.map(t => t.id).join(",")
    }

    private readonly onAddition = (tag: Tag) => {
        const tags = [].concat(this.state.tags, tag)
        this.props.onChange(
            Sortable.tagsToOrder(tags)
        )
    }
    private readonly onDelete = (index: number) => {
        const tags = this.state.tags.slice(0)
        tags.splice(index, 1)
        this.props.onChange(
            Sortable.tagsToOrder(tags)
        )
    }
    private readonly suggestionsFilter = (tag: Tag, query: string) => {
        const [tMod, tID] = parseTagID(tag.id)
        const [qMod, qID] = parseTagID(query)
        
        return (
            tag.name.startsWith(qID) || tID.startsWith(qID)
        ) && (
            qMod === "" ||tMod === qMod
        )
    }
    render() {
        const { tags, suggestions } = this.state
        return <ReactTags
            classNames={CLASS_NAMES}
            
            tags={tags}
            suggestions={suggestions}
            suggestionsFilter={this.suggestionsFilter}
            placeholderText="Add another field"
            
            onAddition={this.onAddition}
            onDelete={this.onDelete}
        />
    }
}