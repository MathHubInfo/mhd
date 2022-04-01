import {default as ColumnResizerOrg} from "column-resizer";

import stringHash from "string-hash"


// re-export ColumnResizerOptions
import {ColumnResizerOptions as ColumnResizerOptionsOrg} from "column-resizer";
export type ColumnResizerOptions = ColumnResizerOptionsOrg;

/**
 * A column-resizer subclass that overwrites a bunch of stuff
 */
export default class ColumnResizer extends ColumnResizerOrg {
    constructor(tb: HTMLTableElement, options: Partial<ColumnResizerOptions>) {
        super(tb, options);

        this.fixStyles();
    }

    // hash of the old style that is overwritten
    private static OVERWRITE_HASH = stringHash(
        " .grip-resizable{table-layout:fixed;} .grip-resizable > tbody > tr > td, .grip-resizable > tbody > tr > th{overflow:hidden}"
    + " .grip-padding > tbody > tr > td, .grip-padding > tbody > tr > th{padding-left:0!important; padding-right:0!important;}"
    + " .grip-container{ height:0px; position:relative;} .grip-handle{margin-left:-5px; position:absolute; z-index:5; }"
    + " .grip-handle .grip-resizable{position:absolute;background-color:red;filter:alpha(opacity=1);opacity:0;width:10px;height:100%;cursor: col-resize;top:0px}"
    + " .grip-lastgrip{position:absolute; width:1px; } .grip-drag{ border-left:1px dotted black;	}"
    + " .grip-flex{width:auto!important;} .grip-handle.grip-disabledgrip .grip-resizable{cursor:default; display:none;}").toString();
    
    // the new replaced style that is being set
    private static NEW_STYLE = " .grip-resizable{table-layout:fixed;} .grip-resizable > tbody > tr > td, .grip-resizable > tbody > tr > th{overflow:hidden}"
    + " .grip-padding > tbody > tr > td, .grip-padding > tbody > tr > th{padding-left:5px!important; padding-right:5px!important;}"
    + " .grip-container{ height:0px; position:relative;} .grip-handle{margin-left:-5px; position:absolute; z-index:5; }"
    + " .grip-handle .grip-resizable{position:absolute;background-color:red;filter:alpha(opacity=1);opacity:0;width:10px;height:100%;cursor: col-resize;top:0px}"
    + " .grip-lastgrip{position:absolute; width:1px; } .grip-drag{ border-left:1px dotted black;	}"
    + " .grip-flex{width:auto!important;} .grip-handle.grip-disabledgrip .grip-resizable{cursor:default; display:none;}";

    private fixStyles() {
        (Array.from(document.querySelectorAll("head > style")) as Array<HTMLStyleElement & {gripid?: string}>).forEach(h => {
            if (h.gripid === ColumnResizer.OVERWRITE_HASH) {
                h.innerText = ColumnResizer.NEW_STYLE;
            }
        })
    }
}