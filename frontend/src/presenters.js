import React from 'react';

const chunkArray = (arr, chunkSize) => {
    var index = 0;
    var arrayLength = arr.length;
    var tempArray = [];
    for (index = 0; index < arrayLength; index += chunkSize) {
        var chunk = arr.slice(index, index+chunkSize);
        tempArray.push(chunk);
    }
    return tempArray;
}

export const presenters = {
    
    "BoolIdent": (val) => String(val),
    
    "IntIdent": (val) => String(val),
    
    "ListAsArray": (arr) => arr.join(", "),
    
    "MatrixAsArray" : (arr) => {
        var dimension = Math.round(Math.sqrt(arr.length));
        var chunked = chunkArray(arr, dimension);
        var rows = chunked.map((r, index) => {
            var row = r.map((e, i) => {
                return <td key={index + ":" + i}>{e}</td>;
            })
            return <tr key={index}>{row}</tr>;
        })
        return <table className="display-matrix">{rows}</table>
    },
    
    "PolynomialAsSparseArray": (encoded) => {
        var arr = chunkArray(encoded, 2);
        arr.reverse();
        var list = arr.map((a, i) => {
            var c = a[1]
            var exp = a[0]
            if (c === 0) return null;
            if (c === 1) c = "";
            if (a[1] > 0 && i > 0) c = "+" + c;
            if (exp === 0) return <span key={i}>{c}</span>;
            if (exp === 1) return <span key={i}>{c} x</span>;
            else return <span key={i}>{c} x<sup>{exp}</sup></span>;
        })
        return list
    }
    
}