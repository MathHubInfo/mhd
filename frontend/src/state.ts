const STATE_MAGIC = "MDH_V0";

/**
 * Encodes state into a string along with magic and a hash
 */
export function encodeState<T>(state: {}) {
    // stringify the state itself
    const js = JSON.stringify(state);

    // encode it along with the magic and the hash code
    const magiced = JSON.stringify([STATE_MAGIC, js, hashCode(js)]);

    // and turn it into base64
    return btoa(magiced);
}

/**
 * decodes some state from the url
 * Return undefined when validate fails
 * @param state
 */
export function decodeState(state: string): {} | undefined {
    if (state === "") return;
    
    try {
        const [m, s, h] = JSON.parse(atob(state));
        if (m !== STATE_MAGIC) throw new Error("Unable to verify magic");
        if (hashCode(s) !== h) throw new Error("Unable to verify hash");
        return JSON.parse(s); 
    } catch(e) {
        return undefined;
    }
}

/**
 * Computes the hashCode of a string
 * @param s 
 */
function hashCode(s: string): number {
    let hash = 0;
    if (s.length === 0) {
        return hash;
    }
    for (let i = 0; i < s.length; i++) {
        var char = s.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}