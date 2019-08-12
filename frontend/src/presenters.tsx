import React from 'react';
import { MDHProperty } from "./client/rest";
import { Column, CellInfo } from "react-table";

/** builds a column renderer for the given property */
export function makePresenter(property: MDHProperty): Column<{}> {
    const presenterImpl = presenters.hasOwnProperty(property.codec) ?
        presenters[property.codec] : presenters[""];
    return {
        Cell: ({original}: CellInfo) => presenterImpl(original[property.slug]),
        Header: property.displayName,
    }
}

const presenters: {[key: string]: (value: any) => React.ReactNode} = {
    "": (val: any) => JSON.stringify(val),
    
    "StandardBool": (val: boolean) => String(val),
    
    "StandardInt": (val: number) => String(val),
    
    "ListAsArray": (arr: string[]) => arr.join(", "),
    
    "MatrixAsArray" : (arr: number[]) => {
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
    
    "PolynomialAsSparseArray": (encoded: (number|string)[]) => {
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

function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
    var index = 0;
    var arrayLength = arr.length;
    var tempArray = [];
    for (index = 0; index < arrayLength; index += chunkSize) {
        var chunk = arr.slice(index, index+chunkSize);
        tempArray.push(chunk);
    }
    return tempArray;
}
