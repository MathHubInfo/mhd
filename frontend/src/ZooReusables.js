import React from 'react';

export function ZooInfoButton(props) {
    return(
        <a href="#!" className={"info-" + props.value}>
            <i className="far fa-question-circle" data-fa-transform="shrink-4 up-3"></i>
        </a>
    );
}