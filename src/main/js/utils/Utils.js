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

export const getAccessToken = () => {
	return getCookie(Config.passwordCookieKey)
}

export const getRequestJsonHeader = () => {
	return  {
    	'Accept': 'application/json',
    	'Content-Type': 'application/json',
    	'Authorization': getAccessToken()
    }
}

export const getUUID = () => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

export const sha256 = async (message) => {
    const msgBuffer = new TextEncoder('utf-8').encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
    return hashHex;
}

export const sha = (string) => {
	function rightRotate(value, amount) {
		return (value>>>amount) | (value<<(32 - amount));
	};
	
	var mathPow = Math.pow;
	var maxWord = mathPow(2, 32);
	var lengthProperty = 'length'
	var i, j;
	var result = ''

	var words = [];
	var stringBitLength = string[lengthProperty]*8;
	
	var hash = sha256.h = sha256.h || [];
	var k = sha256.k = sha256.k || [];
	var primeCounter = k[lengthProperty];

	var isComposite = {};
	for (var candidate = 2; primeCounter < 64; candidate++) {
		if (!isComposite[candidate]) {
			for (i = 0; i < 313; i += candidate) {
				isComposite[i] = candidate;
			}
			hash[primeCounter] = (mathPow(candidate, .5)*maxWord)|0;
			k[primeCounter++] = (mathPow(candidate, 1/3)*maxWord)|0;
		}
	}
	
	string += '\x80'
	while (string[lengthProperty]%64 - 56) string += '\x00'
	for (i = 0; i < string[lengthProperty]; i++) {
		j = string.charCodeAt(i);
		if (j>>8) return;
		words[i>>2] |= j << ((3 - i)%4)*8;
	}
	words[words[lengthProperty]] = ((stringBitLength/maxWord)|0);
	words[words[lengthProperty]] = (stringBitLength)
	
	for (j = 0; j < words[lengthProperty];) {
		var w = words.slice(j, j += 16);
		var oldHash = hash;
		hash = hash.slice(0, 8);
		
		for (i = 0; i < 64; i++) {
			var i2 = i + j;
			var w15 = w[i - 15], w2 = w[i - 2];

			var a = hash[0], e = hash[4];
			var temp1 = hash[7]
				+ (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
				+ ((e&hash[5])^((~e)&hash[6])) // ch
				+ k[i]
				+ (w[i] = (i < 16) ? w[i] : (
						w[i - 16]
						+ (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15>>>3)) // s0
						+ w[i - 7]
						+ (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2>>>10)) // s1
					)|0
				);
			var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
				+ ((a&hash[1])^(a&hash[2])^(hash[1]&hash[2])); // maj
			
			hash = [(temp1 + temp2)|0].concat(hash);
			hash[4] = (hash[4] + temp1)|0;
		}
		
		for (i = 0; i < 8; i++) {
			hash[i] = (hash[i] + oldHash[i])|0;
		}
	}
	
	for (i = 0; i < 8; i++) {
		for (j = 3; j + 1; j--) {
			var b = (hash[i]>>(j*8))&255;
			result += ((b < 16) ? 0 : '') + b.toString(16);
		}
	}
	return result.toUpperCase();
}
