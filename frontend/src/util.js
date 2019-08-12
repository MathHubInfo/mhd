export const sortedKeys = function (o) {
    const keys = Object.keys(o);
    const sorted = keys.sort();
    const filtered = sorted.filter((f) => !(o[f] === null))
    return filtered;
}

export const getQueryURI = function (par) {
    if (par === null) return "";
    const parArray = JSON.parse(par);
    var accumulator = ""
    for (var i = 0; i < parArray.length; i++) {
        if (i > 0) accumulator += "&&";
        accumulator += parArray[i].slug + parArray[i].value;
    }
    return encodeURIComponent(accumulator);
}

export const getFilterObject = (o) => {
    return {
        isFilter: ["StandardBool", "StandardInt"].indexOf(o.codec) > -1, // TODO: move into codec utils file
        display: o.displayName,
        slug: o.slug,
        type: o.codec
    }
}