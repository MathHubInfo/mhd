
import type Codec from "./codec"
import { Fallback } from "./codec"
import StandardInt from "./impl/StandardInt"
import StandardBool from "./impl/StandardBool"
import StandardString from "./impl/StandardString"
import StandardJSON from "./impl/StandardJSON"
import MatrixAsList from "./impl/MatrixAsList"
import ListAsArray from "./impl/ListAsArray"
import GraphAsSparse6 from "./impl/GraphAsSparse6"
import CoveringRelationAsDigraph6 from "./impl/CoveringRelationAsDigraph6"
import PolynomialAsSparseArray from "./impl/PolynomialAsSparseArray"

/**
 * Manages all known codecs
 */
export default class CodecManager {

    private static instance: CodecManager

    private constructor() {
        this.register(new StandardInt())
        this.register(new StandardBool())
        this.register(new StandardString())
        this.register(new StandardJSON())
        this.register(new GraphAsSparse6())
        this.register(new PolynomialAsSparseArray())
        this.register(new CoveringRelationAsDigraph6())
        this.register(new MatrixAsList(new StandardInt(), 2, 2))
        this.register(new MatrixAsList(new StandardInt(), 3, 3))
        this.register(new ListAsArray(new StandardInt()))
        this.register(new ListAsArray(new StandardJSON()))
    }

    /** registers a codec with this codec manager */
    private register(codec: Codec<any, any>) {
        this.codecs.set(codec.slug, codec)
    }

    private codecs = new Map<string, Codec<any, any>>()
    private fallbacks = new Map<string, Fallback>()

    /** gets a codec with the given name */
    get(name: string): Codec<any, any> {
        const codec = this.codecs.get(name)
        if (!codec) throw new Error(`Codec ${name} is not known`)
        return codec
    }
    /** gets a component with fallback for when it doesn't exist */
    getWithFallback(name: string): Codec<any, any> {

        // if we have a codec, return it
        const codec = this.codecs.get(name)
        if (codec) return codec

        // if we have fallback for the given name, return it
        const fallback = this.fallbacks.get(name)
        if (fallback) return fallback

        // else make a new fallback and make that
        const newFallback = new Fallback(name)
        this.fallbacks.set(name, newFallback)
        return newFallback
    }

    /** get or create the singleton instance of thie CodecManager */
    static getInstance () {
        if (!CodecManager.instance)
            CodecManager.instance = new CodecManager()
        
        return CodecManager.instance
    }
}

