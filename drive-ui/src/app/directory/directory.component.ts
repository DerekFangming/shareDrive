import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Shareable } from '../model/shareable';
import { UtilsService } from '../utils.service';
import { Capacity } from '../model/capacity';
import { DirectorySize } from '../model/directory-size';
import { Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { NotifierService } from 'angular-notifier';

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
  creatingFolder = false;
  renameFile = false;
  renamingFile = false;
  deleteFile = false;
  deletingFile = false;
  loadingDirectory = false;
  loadingCapacity = false;
  loadingDirectorySize = false;

  newFolderName = '';
  renameFileName = '';
  loadDirectoryError = '';
  creatingFolderError = '';

  constructor(private http: HttpClient, public utils: UtilsService, private router: Router, private location: PlatformLocation,
    private notifierService: NotifierService) { }

  ngOnInit() {
    this.loadDirectory(this.getDirectoryFromUrl());
    this.loadCapacity();

    this.location.onPopState(() => {
      this.loadDirectory(this.getDirectoryFromUrl());
    });
  }

  getDirectoryFromUrl() {
    let path = this.location.pathname.replace(environment.contextPath + '/directory', '');
    if (path.startsWith('/')) path = path.substring(1);
    return decodeURI(path);
  }

  loadDirectory(directory: string) {
    this.sortColumn = '';
    this.sortAsc = true;
    this.selectedFile = null;

    this.router.navigateByUrl('/directory/' + directory);
    this.shareables = [];
    this.directory = directory;
    this.loadingDirectory = true;
    this.http.get<Shareable[]>(environment.urlPrefix + 'api/directory/' + this.directory).subscribe(res => {
      this.loadingDirectory = false;
      this.shareables = res.map(s => this.utils.parseFileType(s)).sort((a, b) => a.isFile == b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1);
      // console.log(this.shareables);
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
      if (!shareable.isFile) {
        this.loadingDirectorySize = true;
        this.http.get<DirectorySize>(environment.urlPrefix + 'api/directory-size/' + shareable.path).subscribe(res => {
          this.loadingDirectorySize = false;
          this.selectedFile.size = res.size;
        }, error => {
          this.loadingDirectorySize = false;
          console.log(error.error);
        });
      }
    }
  }

  loadFolderContent(shareable: Shareable) {
    if (!shareable.isFile) {
      this.loadDirectory(shareable.path)
    }
  }

  createNewFolder() {
    this.creatingFolder = true;
    let newDir = new Shareable({name: this.newFolderName, path: this.directory + '/' + this.newFolderName});
    this.http.post<Shareable>(environment.urlPrefix + 'api/directory', newDir).subscribe(res => {
      this.creatingFolder = false;
      this.createFolder = false;
      this.newFolderName = '';
      this.shareables.unshift(this.utils.parseFileType(res));
      this.notifierService.notify('success', 'Folder created');
    }, error => {
      this.creatingFolder = false;
      this.notifierService.notify('error', error.error.message);
    });
  }

  downloadSelectedFile() {
    if (this.selectedFile.isFile) {
      console.log(window.location.href);
      window.open(environment.urlPrefix + environment.contextPath + "api/download-file/" + this.selectedFile.path);
    }
  }

  deleteSelectedFile() {
    this.deletingFile = true;
    this.http.delete(environment.urlPrefix + 'api/delete-file/' + this.selectedFile.path).subscribe(res => {
      this.deletingFile = false;
      this.deleteFile = false;
      // this.renameFileName = '';
      // this.selectedFile.name = res.name;
      // this.selectedFile.path = res.path;
      this.notifierService.notify('success', 'File deleted');
    }, error => {
      this.deletingFile = false;
      this.notifierService.notify('error', error.error.message);
    });
  }

  renameSelectedFile() {
    this.renamingFile = true;
    let renamedFile = new Shareable({name: this.renameFileName, path: this.selectedFile.path});
    this.http.put<Shareable>(environment.urlPrefix + 'api/rename-file', renamedFile).subscribe(res => {
      this.renamingFile = false;
      this.renameFile = false;
      this.renameFileName = '';
      this.selectedFile.name = res.name;
      this.selectedFile.path = res.path;
      this.notifierService.notify('success', 'File renamed');
    }, error => {
      this.renamingFile = false;
      this.notifierService.notify('error', error.error.message);
    });
  }

}
