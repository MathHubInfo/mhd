import React from "react";
import * as d3 from "d3";

import style from "./d3graph.module.css";

interface Graph {
    edges: [number, number][]
    nodes: number
}

interface D3GraphStyle {
    width: number;
    height: number;

    innerNodeRadius: number;
    outerNodeRadius: number;

    nodeClass: string;
    linkClass: string;
    labelClass: string;
}

interface D3ForceGraphProps {
    /** graph being rendered */
    graph: Graph

    /** Attraction strength between the different nodes. Defaults to 400 */
    strength?: number;

    style?: Partial<D3GraphStyle>;
}

/**
 * A component that renders a graph of nodes and edges using a force-based layout. 
 */
export default class D3ForceGraph extends React.Component<D3ForceGraphProps> {

    private static getProps({ graph, strength = -100, style: css = {} }: D3ForceGraphProps): D3GraphInstanceProps {
        const {
            width = 100, height = 100,

            outerNodeRadius = 20, innerNodeRadius = 6,

            nodeClass = style.node,
            linkClass = style.link,
            labelClass = style.label,
        } = css;

        return {
            graph,
            strength,
            style: {
                width,
                height,

                outerNodeRadius,
                innerNodeRadius,

                nodeClass,
                linkClass,
                labelClass
            }
        }
    }

    private static getKey({
        graph: { nodes, edges },
        strength,
        style: {
            width,
            height,

            outerNodeRadius,
            innerNodeRadius,

            nodeClass,
            linkClass,
            labelClass,
        }
    }: D3GraphInstanceProps): string {
        return JSON.stringify([nodes, edges, strength, width, height, outerNodeRadius, innerNodeRadius, nodeClass, linkClass, labelClass])
    }

    render() {
        const props = D3ForceGraph.getProps(this.props);
        const key = D3ForceGraph.getKey(props);
        return <D3GraphInstance {...props} key={key} />;
    }
}

interface D3GraphInstanceProps {
    /** graph being rendered */
    graph: Graph
    strength: number;
    style: D3GraphStyle;
}

interface D3Node extends d3.SimulationNodeDatum {
    id: number;
}
interface D3Link extends d3.SimulationLinkDatum<D3Node> { }


class D3GraphInstance extends React.Component<D3GraphInstanceProps> {
    private divElement = React.createRef<HTMLDivElement>();

    private simulationNodes: D3Node[] = [];
    private simulationLinks: D3Link[] = [];

    private simulation: d3.Simulation<D3Node, D3Link> | undefined;
    private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | undefined;
    private link: d3.Selection<SVGLineElement, D3Link, SVGGElement, unknown> | undefined;
    private node: d3.Selection<SVGCircleElement, D3Node, SVGGElement, unknown> | undefined;
    private label: d3.Selection<SVGTextElement, D3Node, SVGGElement, unknown> | undefined;

    componentDidMount() {
        const { style: { width, height, innerNodeRadius, nodeClass, linkClass, labelClass }, strength, graph: { nodes, edges } } = this.props;

        this.simulationNodes = Array.from(new Array(nodes).keys()).map((_, i) => ({ id: i }));
        this.simulationLinks = edges.map(v => ({ source: v[0], target: v[1] }));

        this.svg =
            d3.select(this.divElement.current).append("svg")
                .attr("width", width)
                .attr("height", height);

        this.link = this.svg.append("g")
            .attr("class", linkClass)
            .selectAll("line")
            .data(this.simulationLinks)
            .enter().append("line");

        this.node = this.svg.append("g")
            .attr("class", nodeClass)
            .selectAll("circle")
            .data(this.simulationNodes)
            .enter().append("circle")
            .attr("r", innerNodeRadius);

        this.label = this.svg.append("g")
            .selectAll("text")
            .data(this.simulationNodes)
            .enter().append("text")
            .attr("class", labelClass)
            .text(d => "" + d.id);

        this.simulation = d3.forceSimulation<D3Node, D3Link>()
            .force("link", d3.forceLink<D3Node, D3Link>().id((node: D3Node) => "" + node.id))
            .force("charge", d3.forceManyBody().strength(strength))
            .force("center", d3.forceCenter(width / 2, height / 2));

        this.simulation
            .nodes(this.simulationNodes)
            .on("tick", this.ticked.bind(this))
            .on("end", this.end.bind(this));

        this.simulation
            .force<d3.ForceLink<D3Node, D3Link>>("link")!
            .links(this.simulationLinks);

    }

    private ticked() {
        if (!this.link) return;
        if (!this.node) return;
        if (!this.label) return;

        const { style: { innerNodeRadius, outerNodeRadius } } = this.props;

        this.node
            .attr("r", outerNodeRadius)
            .attr("cx", d => d.x! + innerNodeRadius)
            .attr("cy", d => d.y! - innerNodeRadius);
        
            this.link
            .attr("x1", d => (d.source as D3Node).x!)
            .attr("y1", d => (d.source as D3Node).y!)
            .attr("x2", d => (d.target as D3Node).x!)
            .attr("y2", d => (d.target as D3Node).y!);

        this.label
            .attr("x", d => d.x!)
            .attr("y", d => d.y!)
    }

    private end() {
        // TODO: Resize
    }

    componentWillUnmount() {
        // stop the simulation
        if (this.simulation) this.simulation.stop();
        this.simulation = undefined;

        // remove all of the elements
        if (this.label) this.label.remove();
        this.label = undefined;

        if (this.node) this.node.remove();
        this.node = undefined;

        if (this.link) this.link.remove();
        this.link = undefined;

        if (this.svg) this.svg.remove();
        this.svg = undefined;

        // empty the arrays
        this.simulationLinks = [];
        this.simulationNodes = [];

    }


    render() {
        return <div ref={this.divElement} />;
    }
}