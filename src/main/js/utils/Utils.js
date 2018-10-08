import React, {Component} from 'react';

const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

export const convertSize = (bytes) => {
	let l = 0, n = parseInt(bytes, 10) || 0;
	while(n >= 1024 && ++l)
		n = n/1024;
	return(n.toFixed(n >= 10 || l < 1 ? 0 : 1) + ' ' + units[l]);
}

/**
 * Convert seconds to formated date string
 */
export const convertDate = (secs) => {
	return (new Date(secs)).toLocaleString();
}

export const numberWithCommas = (x) => {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}