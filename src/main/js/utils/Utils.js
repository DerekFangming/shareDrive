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
	return secs == 0 ? ' - ' : (new Date(secs)).toLocaleString();
}

export const numberWithCommas = (x) => {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export const getFileType = (fileName) => {
	let type = 'Unknown';
	let names = fileName.split('.');
	
	if (names.length == 0) {
		return type;
	} else {
		type = names[names.length - 1].toUpperCase();
		if (['TIF', 'JPG', 'GIF', 'PNG'].includes(type)) {
			return type + ' image';
		} else if (['DOC', 'DOCX', 'HTML', 'HTM', 'ODT', 'ODS', 'PDF', 'XLS', 'XLSX', 'CSV', 'PPT', 'PPTX', 'TXT'].includes(type)) {
			return type + ' document';
		} else if (['AAC', 'AAX', 'ACT', 'AIFF', 'FLAC', 'M4A', 'M4B', 'M4P', 'MP3', 'WAV ', 'WMA'].includes(type)) {
			return type + ' audio';
		} else if (['WEBM', 'MKV', 'FLV', 'AVI', 'MOV', 'QT', 'WMV', 'RM', 'RMVB', 'ASF',
			'AMV', 'MP4', 'M4P', 'MPG', 'MPEG', 'M4V', '3GP', 'F4V', 'F4P'].includes(type)) {
			return type + ' video';
		} else {
			return type + ' file';
		}
	}
}