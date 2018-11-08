import React, {Component} from 'react';
import Config from 'Config';

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

export const getFileType = (file) => {
	if (!file.isFile) return 'Folder';
	let type = 'Unknown';
	let names = file.name.split('.');
	
	if (names.length == 0) {
		return type;
	} else {
		type = names[names.length - 1].toUpperCase();
		if (['TIF', 'JPG', 'GIF', 'PNG', 'DNG', 'ICO', 'ORF', 'NEF'].includes(type)) {
			return type + ' image';
		} else if (['DOC', 'DOCX', 'HTML', 'HTM', 'ODT', 'ODS', 'PDF', 'XLS', 'XLSX', 'CSV', 'PPT', 'PPTX', 'TXT'].includes(type)) {
			return type + ' document';
		} else if (['ISO', 'TAR', 'GZ', '7Z', 'APK', 'ARC', 'DMG', 'JAR', 'RAR', 'WAR', 'ZIP'].includes(type)) {
			return type + ' archive';
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

export const keepTwoDigits = (num) => {
	return Number(num).toFixed(2)
}

export const numberEnding = (number) => {
    return (number > 1) ? 's' : '';
}

export const secondsToStr = (sec) => {

    var years = Math.floor(sec / 31536000);
    if (years) {
        return years + ' year' + numberEnding(years);
    }
    
    var days = Math.floor((sec %= 31536000) / 86400);
    if (days) {
        return days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((sec %= 86400) / 3600);
    if (hours) {
        return hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((sec %= 3600) / 60);
    if (minutes) {
        return minutes + ' minute' + numberEnding(minutes);
    }
    var seconds = sec % 60;
    if (seconds >= 1) {
        return keepTwoDigits(seconds) + ' second' + numberEnding(seconds);
    } else {
    	return 'less than a second';
    }
}

export const getCookie = (name) => {
	let value = '; ' + document.cookie;
	let parts = value.split('; ' + name + '=');
	if (parts.length == 2) return parts.pop().split(';').shift();
	return '';
}

export const getSecretKey = () => {
	return getCookie(Config.secretKey)
}

export const getRequestJsonHeader = () => {
	return  {
    	'Accept': 'application/json',
    	'Content-Type': 'application/json',
    	'Authorization': getSecretKey()
    }
}