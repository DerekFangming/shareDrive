import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Shareable } from '../model/shareable';
import { Share } from '../model/share';
import { UtilsService } from '../utils.service';
import { Capacity } from '../model/capacity';
import { DirectorySize } from '../model/directory-size';
import { Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { NotifierService } from 'angular-notifier';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { User } from '../model/user';
import { UploadModalComponent } from '../components/upload-modal/upload-modal.component';

@Component({
  selector: 'app-directory',
  templateUrl: './directory.component.html',
  styleUrls: ['./directory.component.css']
})
export class DirectoryComponent implements OnInit {

  directory = '';
  shareables: Shareable[] = [];
  moveDirectories: Shareable[] = [];
  capacity: Capacity;

  sortColumn = '';
  sortAsc = true;
  selectedFile: Shareable;
  selectedMoveDirectory: Shareable;
  searchKeyword = '';
  me: User;
  
  isMobile = false;
  createFolder = false;
  creatingFolder = false;
  renameFile = false;
  renamingFile = false;
  deleteFile = false;
  deletingFile = false;
  movingFile = false;
  loadingDirectory = false;
  loadingCapacity = false;
  loadingDirectorySize = false;
  loadingMoveDirectory = false;
  searching = false;
  showingSearchResult = false;
  sharingFile = false

  newFolderName = '';
  renameFileName = '';
  moveFileDirectory = '';
  loadDirectoryError = '';
  creatingFolderError = '';
  shareIndefinitely = 'true';
  shareWriteAccess = false
  shareName = ''
  shareLink = ''
  minDate: any
  shareToDate: any;

  modalRef: NgbModalRef;
  @ViewChild('moveFileModal', { static: true}) moveFileModal: TemplateRef<any>;
  @ViewChild('shareFileModal', { static: true}) shareFileModal: TemplateRef<any>;
  @ViewChild('uploadFileModal', { static: true}) uploadFileModal: UploadModalComponent;

  constructor(private http: HttpClient, public utils: UtilsService, private router: Router, private location: PlatformLocation,
    private notifierService: NotifierService, private modalService: NgbModal, private elementRef: ElementRef) { }

  ngOnInit() {
    this.isMobile = window.innerWidth <= 768;

    this.loadingDirectory = true;
    this.loadingCapacity = true;
    this.http.get<User>(environment.urlPrefix + 'me').subscribe(res => {
      this.me = res;
      if (this.me.avatar == null) this.me.avatar ='https://i.imgur.com/lkAhvIs.png';
      this.loadDirectory(this.getDirectoryFromUrl());
      this.loadCapacity();
    }, error => {
      this.notifierService.notify('error', error.message);
    });

    this.location.onPopState(() => {
      this.loadDirectory(this.getDirectoryFromUrl());
    });
  }

  uploadFinished(shareables: Shareable[]){
    this.shareables = [ ...this.shareables, ...shareables];
    this.shareables = this.shareables.map(s => this.utils.parseFileType(s)).sort((a, b) => a.isFile == b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1);
    this.loadCapacity()
  }

  getDirectoryFromUrl() {
    let path = this.location.pathname.replace('/directory', '');
    if (path.startsWith('/')) path = path.substring(1);
    return decodeURI(path);
  }

  loadDirectory(directory: string) {
    this.sortColumn = '';
    this.sortAsc = true;
    this.selectedFile = null;
    this.showingSearchResult = false;

    this.router.navigateByUrl('/directory/' + directory);
    this.shareables = [];
    this.directory = directory;
    this.loadingDirectory = true;
    this.http.get<Shareable[]>(environment.urlPrefix + 'api/directory/' + this.directory).subscribe(res => {
      this.loadingDirectory = false;
      this.shareables = res.map(s => this.utils.parseFileType(s)).sort((a, b) => a.isFile == b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1);
    }, error => {
      this.loadingDirectory = false;
      this.loadDirectoryError = error.message;
      this.notifierService.notify('error', error.message);
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
      this.notifierService.notify('error', error.message);
    });
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
          this.notifierService.notify('error', error.message);
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
      this.notifierService.notify('error', error.message);
    });
  }

  downloadSelectedFile() {
    if (this.selectedFile.isFile) {
      window.open(environment.urlPrefix + "api/download-file/" + this.selectedFile.path);
    }
  }

  deleteSelectedFile() {
    this.deletingFile = true;
    this.http.delete(environment.urlPrefix + 'api/delete-file/' + this.selectedFile.path).subscribe(res => {
      this.deletingFile = false;
      this.deleteFile = false;
      var index = this.shareables.indexOf(this.selectedFile);
      if (index !== -1) {
        this.shareables.splice(index, 1);
      }
      this.selectedFile = null;
      this.notifierService.notify('success', 'File deleted');
      this.loadCapacity();
    }, error => {
      this.deletingFile = false;
      this.notifierService.notify('error', error.message);
    });
  }

  openMoveFileModel() {
    this.moveFileDirectory = '';
    this.moveDirectories = [];
    this.loadMoveDirectory('');
    this.modalRef = this.modalService.open(this.moveFileModal, {
      backdrop : 'static',
      keyboard : false,
      centered: true,
      size: 'lg'
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
      this.notifierService.notify('error', error.message);
    });
  }

  moveSelectedFile() {
    if (this.selectedMoveDirectory == null) {
      this.notifierService.notify('error', 'Please select a folder to move.')
      return
    }
    this.movingFile = true
    let moveFile = {path: this.selectedFile.path, targetPath: this.selectedMoveDirectory.path}
    this.http.post(environment.urlPrefix + 'api/move-file', moveFile).subscribe(res => {
      this.movingFile = false
      this.modalRef.close();
      var index = this.shareables.indexOf(this.selectedFile);
      if (index !== -1) {
        this.shareables.splice(index, 1);
      }
    }, error => {
      this.movingFile = false
      this.notifierService.notify('error', error.message);
    });
  }

  getParentDirectory(directory: string) {
    let dirs = directory == '' ? [] : directory.split('/');
    if (dirs.length > 0) dirs.pop();

    if (dirs.length == 0) return ''
    else return dirs.join('/')
  }

  loadMoveDirectory(directory: string) {
    this.moveFileDirectory = directory;
    this.loadingMoveDirectory = true;
    this.http.get<Shareable[]>(environment.urlPrefix + 'api/directory/' + directory + '?dirOnly=true').subscribe(res => {
      this.loadingMoveDirectory = false;
      this.moveDirectories = res.sort((a, b) => a.name.localeCompare(b.name));
    }, error => {
      this.loadingMoveDirectory = false;
      this.notifierService.notify('error', error.message);
    });
  }

  searchFiles() {
    this.searching = true;

    this.http.get<Shareable[]>(environment.urlPrefix + 'api/search-file/' + this.directory, {
      params: {
        keyword: this.searchKeyword
      }
    }).subscribe(res => {
      this.searching = false;
      this.showingSearchResult = true;
      this.shareables = res.map(s => this.utils.parseFileType(s)).sort((a, b) => a.isFile == b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1);
    }, error => {
      this.searching = false;
      this.notifierService.notify('error', error.message);
    });
  }

  openShareFileModel() {
    this.sharingFile = false
    this.shareIndefinitely = 'true'
    this.shareWriteAccess = false
    this.shareName = ''
    this.shareLink = ''
    this.shareToDate = null
    const current = new Date()
    this.minDate= { year: current.getFullYear(), month: current.getMonth() + 1, day: current.getDate()}
    this.modalRef = this.modalService.open(this.shareFileModal, {
      backdrop : 'static',
      keyboard : false,
      centered: true
    });
  }

  shareFile() {
    let share = new Share({path: this.selectedFile.path, writeAccess: this.shareWriteAccess, name: this.shareName == '' ? null : this.shareName})
    if (this.shareToDate != null) {
      share.expiration = new Date(this.shareToDate.year + '-' + this.shareToDate.month + '-' + (this.shareToDate.day + 1)).toISOString()
    }

    this.sharingFile = true
    this.http.post<Share>(environment.urlPrefix + 'api/shares', share).subscribe(res => {
      let baseUrl = environment.production ? 'https://fmning.com/drive/share/' : 'http://localhost:4200/share/' // TODO
      this.shareLink = baseUrl + res.id
      this.sharingFile = false
    }, error => {
      this.sharingFile = false
      this.notifierService.notify('error', error.message);
    });
  }

  copyToClipboard() {
    this.utils.copyToClipboard(document, this.shareLink)
  }

}
