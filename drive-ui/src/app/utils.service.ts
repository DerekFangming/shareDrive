import { Injectable } from "@angular/core";
import { environment } from "../environments/environment";
import { Shareable } from "./model/shareable";

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  getFileSize = (bytes: any) => {
    let l = 0, n = parseInt(bytes, 10) || 0;
    while(n >= 1024 && ++l)
      n = n/1024;
    return(n.toFixed(n >= 10 || l < 1 ? 0 : 1) + ' ' + this.units[l]);
  }

  getCreatedTime(time: string) {
    return new Date(time).toLocaleString();
  }

  getCreatedTimeFromSeconds(secs: any) {
    return secs == 0 ? ' - ' : (new Date(secs)).toLocaleString();
  }

  getMobileCreatedTimeFromSeconds(secs: number) {
    return secs == 0 ? ' - ' : (new Date(secs)).toLocaleString('en', {
      year: "2-digit",
      month: "2-digit",
      day: "numeric"
    });
  }

  getReadableNumber = (num: any) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  keepTwoDigits = (num: any) => {
    return Number(num).toFixed(2)
  }

  getType(input: string) {
    if (input == null) return '';

    return input
    .split("_")
    .reduce((res, word, i) =>
      `${res}${word.charAt(0).toUpperCase()}${word
        .substr(1)
        .toLowerCase()}`,
      ""
    );
  }

  logout() {
    window.location.href = environment.urlPrefix + 'logout';
  }

  getImage(name: String) {
    return '/assets/' + name;
  }

  parseFileType(file: Shareable) {
    if (!file.isFile) {
      file.type = 'Folder';
      file.icon = this.getImage('folder.png');
      return file;
    }
    let names = file.name!.split('.');
    
    if (names.length == 0) {
      file.type = 'Unknown';
      file.icon = this.getImage('file.png');
    } else {
      let type = names[names.length - 1].toUpperCase();
      if (['TIF', 'JPG', 'JPEG', 'GIF', 'PNG', 'DNG', 'ICO', 'ORF', 'NEF'].includes(type)) {
        file.type = type + ' image';
        file.icon = this.getImage('image.png');
      } else if (['DOC', 'DOCX', 'HTML', 'HTM', 'ODT', 'ODS', 'PDF', 'XLS', 'XLSX', 'CSV', 'PPT', 'PPTX', 'TXT'].includes(type)) {
        file.type = type + ' document';
        file.icon = this.getImage('document.png');
      } else if (['ISO', 'TAR', 'GZ', '7Z', 'APK', 'ARC', 'DMG', 'JAR', 'RAR', 'WAR', 'ZIP'].includes(type)) {
        file.type = type + ' archive';
        file.icon = this.getImage('archive.png');
      } else if (['AAC', 'AAX', 'ACT', 'AIFF', 'FLAC', 'M4A', 'M4B', 'M4P', 'MP3', 'WAV ', 'WMA'].includes(type)) {
        file.type = type + ' audio';
        file.icon = this.getImage('audio.png');
      } else if (['WEBM', 'MKV', 'FLV', 'AVI', 'MOV', 'QT', 'WMV', 'RM', 'RMVB', 'ASF',
        'AMV', 'MP4', 'M4P', 'MPG', 'MPEG', 'M4V', '3GP', 'F4V', 'F4P'].includes(type)) {
        file.type = type + ' video';
        file.icon = this.getImage('video.png');
      } else {
        file.type = type + ' file';
        file.icon = this.getImage('file.png');
      }
    }
    return file;
  }

  secondsToStr(sec: number) {

    var years = Math.floor(sec / 31536000);
    if (years) return years + ' year' + this.numberEnding(years);
    
    var days = Math.floor((sec %= 31536000) / 86400);
    if (days) return days + ' day' + this.numberEnding(days);

    var hours = Math.floor((sec %= 86400) / 3600);
    if (hours) return hours + ' hour' + this.numberEnding(hours);

    var minutes = Math.floor((sec %= 3600) / 60);
    if (minutes) return minutes + ' minute' + this.numberEnding(minutes);

    var seconds = sec % 60;
    if (seconds >= 1) {
        return this.keepTwoDigits(seconds) + ' second' + this.numberEnding(seconds);
    } else {
    	return 'less than a second';
    }
  }

  numberEnding (num: number) {
    return (num > 1) ? 's' : '';
  }

  splitDirectory(directory: string) {
    if (directory.startsWith('/')) directory = directory.substring(1)
    let dirs = directory == '' ? [] : directory.split('/');
    let res: Shareable[] = [];
    let parentDir = '';

    for (let dir of dirs) {
      res.push(new Shareable({name: dir, path: parentDir + dir}));
      parentDir += dir + '/';
    }

    return res;
  }
  
}