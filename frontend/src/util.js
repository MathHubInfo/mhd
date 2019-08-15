export const sortedKeys = function (o) {
    const keys = Object.keys(o);
    const sorted = keys.sort();
    const filtered = sorted.filter((f) => !(o[f] === null))
    return filtered;
}