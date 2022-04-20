import React, { ReactElement } from "react";
import { TwingEnvironment, TwingFilter, TwingFunction, TwingLoaderArray } from "twing";
import { TwingCallableArgument } from "twing/dist/types/lib/callable-wrapper";
import Parse, { TNodeList, TReactElement } from "./string-to-react";
import { createElement, ELEMENT_NODE, OuterHTML } from "./string-to-react/dom";

const DEFAULT_TEMPLATE_NAME = "index.twig";
const CUSTOM_ELEMENT_NAME = "template-component";
const CUSTOM_ELEMENT_COMPNAME_PROP = "data-component-name";
const CUSTOM_ELEMENT_ARGS_PROP = "data-component-args";

type Component = React.ComponentType<{args: Array<any>}>

export default class TemplateManager<C extends {args: Array<any>}> {

    private readonly mapComponents = new Map<string, Component>();
    private readonly mapNumArgs = new Map<string, number>();

    /** registerComponent registers function as calling component with the provided argument */
    registerComponent(func: string, component: React.ComponentType<C>, argCount: number) {
        this.mapComponents.set(func, component);
        this.mapNumArgs.set(func, argCount);
    }

    /** render renders template as html */
    async renderToHTML(template: string, context: any): Promise<string> {
        const loader = new TwingLoaderArray({[DEFAULT_TEMPLATE_NAME]: template});
        const twing = new TwingEnvironment(loader);
        
        this.mapNumArgs.forEach((numArgs: number, name: string) => {
            const accepted = new Array<TwingCallableArgument>(numArgs).map((_: TwingCallableArgument, i: number) => ({ name: `arg${i}` }));
            twing.addFunction(
                new TwingFunction(
                    name,
                    async (...args: any[]): Promise<any> => {
                        const element = createElement(CUSTOM_ELEMENT_NAME);
                        element.setAttribute(CUSTOM_ELEMENT_COMPNAME_PROP, name);
                        element.setAttribute(CUSTOM_ELEMENT_ARGS_PROP, JSON.stringify(args));
                        return OuterHTML(element);
                    },
                    accepted,
                    {
                        is_safe: ["html"],
                    }
                )
            );
        })

        return twing.render(DEFAULT_TEMPLATE_NAME, context);
    }

    /** renderToElement renders html as a set of react elements */
    renderToElement(html: string, context: Omit<C, "args">): Array<ReactElement<{}>> {
        return Parse(html, {
            replace: (domNode: Node, callback: (nodes: TNodeList) => TReactElement[]) => {
                if (domNode.nodeType != ELEMENT_NODE || domNode.nodeName !== CUSTOM_ELEMENT_NAME) return null;
                
                const componentName = (domNode as Element).getAttribute(CUSTOM_ELEMENT_COMPNAME_PROP);
                const component = this.mapComponents.get(componentName)
                if (!componentName) return null;

                const args = JSON.parse((domNode as Element).getAttribute(CUSTOM_ELEMENT_ARGS_PROP));
                if( !Array.isArray(args) ) return;

                return React.createElement(component, { ...context, args: args }, callback(domNode.childNodes));  
            }
        });
    }
}