import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Shareable } from '../model/Shareable';
import { UtilsService } from '../utils.service';
import { Capacity } from '../model/Capacity';

@Component({
  selector: 'app-directory',
  templateUrl: './directory.component.html',
  styleUrls: ['./directory.component.css']
})
export class DirectoryComponent implements OnInit {

  directory = '';
  shareables: Shareable[] = [];
  capacity: Capacity;

  sortColumn = '';
  sortAsc = true;
  selectedFile: Shareable;
  
  createFolder = false;
  loadingDirectory = false;
  loadingCapacity = false;


  loadDirectoryError = '';


  constructor(private http: HttpClient, public utils: UtilsService) { }

  ngOnInit() {
    this.loadDirectory('');
    this.loadCapacity();
  }

  loadDirectory(directory: string) {
    this.directory = directory;
    this.loadingDirectory = true;
    this.http.get<Shareable[]>(environment.urlPrefix + 'api/directory/' + this.directory).subscribe(res => {
      this.loadingDirectory = false;
      this.shareables = res.map(s => this.utils.parseFileType(s)).sort((a, b) => a.isFile == b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1);
    }, error => {
      this.loadingDirectory = false;
      console.log(error.error);
    });
  }

  loadCapacity() {
    this.loadingCapacity = true;
    this.http.get<Capacity>(environment.urlPrefix + 'api/capacity').subscribe(res => {
      this.loadingCapacity = false;
      this.capacity = res;
      this.capacity.ratio = this.utils.keepTwoDigits((this.capacity.totalSpace - this.capacity.availableSpace) * 100 / this.capacity.totalSpace);
    }, error => {
      this.loadingCapacity = false;
      console.log(error.error);
    });
  }

  splitDirectory(directory: string) {
    let dirs = directory == '' ? [] : directory.split('/');
    let res: Shareable[] = [];
    let parentDir = '';

    for (let dir of dirs) {
      res.push(new Shareable({name: dir, path: parentDir + dir}));
      parentDir += dir + '/';
    }

    return res;
  }

  
  sortShareables(sortColumn: string) {
    if (this.sortColumn == sortColumn) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = sortColumn;
      this.sortAsc = true;
    }
    if (this.sortColumn == 'name') {
      this.shareables.sort((a, b) => this.sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
    } else if (this.sortColumn == 'mod') {
      this.shareables.sort((a, b) => this.sortAsc ? a.lastModified - b.lastModified : b.lastModified - a.lastModified)
    } else if (this.sortColumn == 'size') {
      this.shareables.sort((a, b) => this.sortAsc ? a.size - b.size : b.size - a.size)
    }
  }

  selectFile(shareable: Shareable) {
    if (shareable != this.selectedFile) {
      this.selectedFile = shareable;
      console.log(1);
    }
  }

  loadFolderContent() {
    console.log(2);
  }

}
