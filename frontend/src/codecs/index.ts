
import Codec from "./codec";
import StandardInt from "./impl/StandardInt";
import StandardBool from "./impl/StandardBool";
import Fallback from "./impl/Fallback";

/**
 * Manages all known codecs
 */
export default class CodecManager {

    private static instance: CodecManager;
    private fallback: Codec<any, any> = new Fallback();

    private constructor() {
        this.register(new StandardInt());
        this.register(new StandardBool());
    }

    /** registers a codec with this codec manager */
    private register(codec: Codec<any, any>) {
        this.codecs.set(codec.slug, codec);
    }

    private codecs = new Map<string, Codec<any, any>>();

    /** gets a codec with the given name */
    get(name: string): Codec<any, any> {
        const codec = this.codecs.get(name);
        if (!codec) throw new Error(`Codec ${name} is not known`);
        return codec;
    }
    /** gets a component with fallback for when it doesn't exist */
    getWithFallback(name: string): Codec<any, any> {
        const codec = this.codecs.get(name);
        return codec ? codec : this.fallback;
    }

    /** get or create the singleton instance of thie CodecManager */
    static getInstance () {
        if (!CodecManager.instance)
            CodecManager.instance = new CodecManager();
        
        return CodecManager.instance;
    }
}

