import React from 'react';

export const presenters = {
    
    "BoolIdent": (val) => String(val),
    
    "IntIdent": (val) => String(val),
    
    "ListAsArray": (arr) => arr.join(", "),
    
    "MatrixAsArray" : (arr) => {
        var dimension = Math.round(Math.sqrt(arr.length));
        return String(arr);
    },
    
    "PolynomialAsSparseArray": (arr) => {
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