import React, { useId, createElement } from "react"

type WithIDFlags<T> = {
    count: number | ((props: Omit<T, "ids">) => number);
    unsafeQuerySelectorAllSupport: boolean;
}

/** IDHack generates unique ids */
function GenerateID({children, hack}: {children: (s: string) => React.ReactElement, hack: boolean}) {
    const id = useId()
    return children(hack ? id.replaceAll(":", "_") : id)
}

export default function WithID<T extends {ids: Array<string>}>(Wrapped: React.ComponentType<T>, flags?: Partial<WithIDFlags<T>>): React.ComponentType<Omit<T, "ids">> {
    const comp = function(props: T) {
        const { count = 1, unsafeQuerySelectorAllSupport = false} = flags ?? {}
        const theCount = typeof count === 'function' ? count(props) : count;

        return <GenerateID hack={unsafeQuerySelectorAllSupport}>{
            (id: string) => {        
                // generate all the ids
                const ids = [];
                for(let i = 0; i < theCount; i++) {
                    ids.push(id + "_" + i.toString())
                }
                
                return createElement(Wrapped, { ...props, ids })
            }}</GenerateID>
        
    }
    comp.displayName = `WithID(${getDisplayName(Wrapped)})`
    return comp
}

function getDisplayName(WrappedComponent) {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}