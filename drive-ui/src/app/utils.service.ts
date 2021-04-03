import { Injectable } from "@angular/core";
import { environment } from "../environments/environment";
import { Shareable } from "./model/shareable";

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  getFileSize = (bytes) => {
    let l = 0, n = parseInt(bytes, 10) || 0;
    while(n >= 1024 && ++l)
      n = n/1024;
    return(n.toFixed(n >= 10 || l < 1 ? 0 : 1) + ' ' + this.units[l]);
  }

  getCreatedTime(time: string) {
    return new Date(time).toLocaleString();
  }

  getCreatedTimeFromSeconds(secs: number) {
    return secs == 0 ? ' - ' : (new Date(secs)).toLocaleString();
  }

  getReadableNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  keepTwoDigits = (num) => {
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
    return environment.contextPath + '/assets/' + name;
  }

  parseFileType(file: Shareable) {
    if (!file.isFile) {
      file.type = 'Folder';
      file.icon = this.getImage('folder.png');
      return file;
    }
    let names = file.name.split('.');
    
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
  
}