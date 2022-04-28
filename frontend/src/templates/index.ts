import type { ReactElement } from "react"
import React from "react"
import { TwingEnvironment, TwingFilter, TwingFunction, TwingLoaderArray } from "twing"
import type { TwingCallableArgument } from "twing/dist/types/lib/callable-wrapper"
import type { TNodeList, TReactElement } from "./html"
import renderHTMLAsReact from "./html"
import { createElement, ELEMENT_NODE, outerHTML } from "./html/dom"

const DEFAULT_TEMPLATE_NAME = "index.twig"

const COMPONENT_ELEMENT_NAME = "template-component"
const COMPONENT_NAME_PROP = "data-name"
const COMPONENT_ARG_PROP = "data-args"

const FILTER_ELEMENT_NAME = "template-filter"
const FILTER_NAME_PROP = "data-name"
const FILTER_VALUE_PROP = "data-value"

type Component = React.ComponentType<{args: Array<any>}>

/**
 * TemplateManager manages instantiating templates for use in other React Components
 */
export default class TemplateManager<C extends {args: Array<any>}> {

    private readonly components = new Map<string, Component>()
    private readonly componentArgCounts = new Map<string, number>()

    /**
     * Registers a React component to be used in templating as a function with the provided name.
     * 
     * When the component is placed on the page it will be given the context argument and a list of arguments.
     * The list of arguments are whatever the user passes into the filter.
     * 
     * @param name function name to use for templatea
     * @param component React component to use
     * @param argCount number of arguments for the react component, see above
     */
    registerComponent(name: string, component: React.ComponentType<C>, argCount: number) {
        this.components.set(name, component)
        this.componentArgCounts.set(name, argCount)
    }

    private readonly filters = new Set<string>()

    /**
     * Registers a filter that records its' value and is returned from the render function.
     *
     * @param name Name of filter to use
     */
    registerRecordingFilter(name: string) {
        this.filters.add(name)
    }

    /**
     * Prepare renders the provided template into a set of html tags that should be passed to the client.
     * The returned string can be rendered by the client syncronously
     * 
     * This rendering process is asyncronous, and should take place server-side.
     * This process does not instantiate any react components; instead they are replaced with place-holders to be picked up on later.
     * 
     * @param template The template to render
     * @param context Context to render the template in
     * @returns 
     */
    async prepare(template: string, context: Omit<C, "args">): Promise<string> {
        // TODO: we should cache the loader, and see if that throws any errors.
        // It is unclear how many loaders should be cached, and when the caching should be pruned.
        const loader = new TwingLoaderArray({ [DEFAULT_TEMPLATE_NAME]: template })
        const twing = new TwingEnvironment(loader)
        
        // setup each component as a custom function
        this.componentArgCounts.forEach((count: number, name: string) => {
            const accepted = new Array<TwingCallableArgument>(count).map((_: TwingCallableArgument, i: number) => ({ name: `arg${i}` }))
            twing.addFunction(
                new TwingFunction(
                    name,
                    async (...args: any[]): Promise<any> => {
                        const element = createElement(COMPONENT_ELEMENT_NAME)
                        element.setAttribute(COMPONENT_NAME_PROP, name)
                        element.setAttribute(COMPONENT_ARG_PROP, JSON.stringify(args))
                        return outerHTML(element)
                    },
                    accepted,
                    {
                        is_safe: ["html"],
                    }
                )
            )
        })

        // setup each recording filter a tag
        this.filters.forEach((name: string) => {
            twing.addFilter(
                new TwingFilter(
                    name,
                    async (...args: any[]): Promise<any> => {
                        const element = createElement(FILTER_ELEMENT_NAME)
                        element.setAttribute(FILTER_NAME_PROP, name)
                        element.setAttribute(FILTER_VALUE_PROP, JSON.stringify(args[0]))
                        return outerHTML(element)
                    },
                    [{ name: "value" }],
                    {
                        is_safe: ["html"],
                    }
                )
            )
        })

        return twing.render(DEFAULT_TEMPLATE_NAME, context)
    }

    /**
     * Render renders prepared html and instantiates registered components.
     * 
     * @param html returned from prepare 
     * @param context same context as used above
     * @param records context to record called filters into
     * @returns 
     */
    render(html: string, context: Omit<C, "args">, records?: Map<string, Array<string>>): Array<ReactElement<{}>> {
        return renderHTMLAsReact(html, {
            replace: (domNode: Node, callback: (nodes: TNodeList) => TReactElement[]) => {
                if (domNode.nodeType != ELEMENT_NODE) return null
                
                // instantiate components
                if (domNode.nodeName === COMPONENT_ELEMENT_NAME) {
                    const componentName = (domNode as Element).getAttribute(COMPONENT_NAME_PROP)
                    const component = this.components.get(componentName)
                    if (!componentName) return null
    
                    const args = JSON.parse((domNode as Element).getAttribute(COMPONENT_ARG_PROP))
                    if( !Array.isArray(args) ) return
    
                    return React.createElement(component, { ...context, args: args }, callback(domNode.childNodes))
                }

                // instantiate filter
                if (domNode.nodeName === FILTER_ELEMENT_NAME) {
                    if ( records ) {
                        // if no record was specified, no need to record anything
                        
                        const name = (domNode as Element).getAttribute(FILTER_NAME_PROP)
    
                        const value = JSON.parse((domNode as Element).getAttribute(FILTER_VALUE_PROP))
                        if( typeof value !== "string" ) return null
                        
                        if(!records.has(name)) records.set(name, [])
                        records.set(name, [...records.get(name)!, value])
                    }
    
                    return React.createElement(React.Fragment, {}, callback(domNode.childNodes))
                }
                
                return null
            },
        })
    }
}