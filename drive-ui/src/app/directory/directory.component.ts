import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
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
import { UploadResult } from '../model/upload-result';
import { User } from '../model/user';

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
  uploadFiles: File[] = [];

  sortColumn = '';
  sortAsc = true;
  selectedFile: Shareable;
  selectedMoveDirectory: Shareable;
  uploadFilesSize = 0;
  uploadRatio = 0;
  uploadRemaining = '';
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
  uploadingFile = false;
  dragOver = false;
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
  shareName = ''
  shareLink = ''
  minDate: any
  shareToDate: any;

  plusImage = environment.production ? environment.contextPath + '/assets/plus.png' : '/assets/plus.png';

  modalRef: NgbModalRef;
  @ViewChild('moveFileModal', { static: true}) moveFileModal: TemplateRef<any>;
  @ViewChild('uploadFileModal', { static: true}) uploadFileModal: TemplateRef<any>;
  @ViewChild('shareFileModal', { static: true}) shareFileModal: TemplateRef<any>;

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

  getDirectoryFromUrl() {
    let path = this.location.pathname.replace(environment.contextPath + '/directory', '');
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
      console.log(window.location.href);
      window.open(environment.urlPrefix + environment.contextPath + "/api/download-file/" + this.selectedFile.path);
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

  openUploadFileModel() {
    this.uploadFiles = [];
    this.uploadRatio = 0;
    this.uploadFilesSize = 0;
    this.modalRef = this.modalService.open(this.uploadFileModal, {
      backdrop : 'static',
      keyboard : false,
      size: 'lg'
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

  onDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
  }

  onDragEnter(event) {
    this.dragOver = true;
    event.preventDefault();
  }

  onDragLeave(event) {
    this.dragOver = false;
    event.preventDefault();
  }

  onFilesDropped(event) {
    this.dragOver = false;
    event.preventDefault();
    this.loadFiles(event.dataTransfer.files);
  }

  onFilesSelected(event) {
    event.preventDefault();
    this.loadFiles(event.target.files);
  }

  loadFiles(files) {
    for (let file of files) {
      // TODO: Check for folders?

      if (file.size == 0) {
        this.notifierService.notify('error', `Cannot upload empty file: ${file.name}`);
        continue;
      }
      if (this.uploadFiles.some(f => f.name == file.name)) {
        this.notifierService.notify('error',  `File with the same name has been selected: ${file.name}`);
        continue;
      }

      if (this.uploadFilesSize + file.size > 4294967296) {
        this.notifierService.notify('error',  `Cannot upload more than 4GB of files at a time.`);
        return
      }

      this.uploadFilesSize += file.size;
      this.uploadFiles.push(file);
    }
  }

  removeUploadFile(file) {
    const index = this.uploadFiles.indexOf(file);
    if (index > -1) {
      this.uploadFiles.splice(index, 1);

      if (this.uploadFilesSize - file.size <= 0) {
        this.uploadFilesSize = 0;
      } else {
        this.uploadFilesSize -= file.size;
      }
    }
  }

  uploadSelectedFiles() {
    if (this.uploadFiles.length == 0) {
      this.notifierService.notify('error', 'Please select at least 1 file to upload.');
      return;
    }

    this.uploadingFile = true;
    let body = new FormData();
    for (let f of this.uploadFiles) {
      body.append('files', f);
    }

    let previousRatio = 0;
		let progressTimer = setInterval(() => {
			let newProgress = this.uploadRatio - previousRatio;
			previousRatio = this.uploadRatio
			if (newProgress <= 0) {
				this.uploadRemaining = '-';
			} else {
				let remainingSeconds = (100 - this.uploadRatio) / newProgress
				this.uploadRemaining = this.utils.secondsToStr(remainingSeconds)
			}
			
			if (this.uploadRatio == 100 || !this.uploadingFile) {
				clearInterval(progressTimer)
			}
		}, 1000)

    this.http.post<UploadResult>(environment.urlPrefix + 'api/upload-file/' + this.directory, body, {
      reportProgress: true,
      observe: 'events'
    }).subscribe(res => {
      if (res.type === HttpEventType.Response) {
        this.uploadRatio = 100;
        this.uploadingFile = false;
        this.modalRef.close();

        this.shareables = [ ...this.shareables, ...res.body.files];
        this.shareables = this.shareables.map(s => this.utils.parseFileType(s)).sort((a, b) => a.isFile == b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1);
        if (res.body.error != '') {
          this.notifierService.notify('warning', res.body.error);
        }

        this.loadCapacity();
      }
      if (res.type === HttpEventType.UploadProgress) {
          this.uploadRatio = Math.round(100 * res.loaded / res.total);
      } 
    }, error => {
      this.uploadingFile = false;
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
    let share = new Share({file: this.selectedFile.path})
    if (this.shareToDate != null) {
      share.expiration = new Date(this.shareToDate.year + '-' + this.shareToDate.month + '-' + (this.shareToDate.day + 1)).toISOString()
    }
    // console.log(this.shareToDate)
    // console.log(new Date())
    // console.log(new Date(this.shareToDate.year + '-' + this.shareToDate.month + '-' + (this.shareToDate.day + 1)).toISOString())
    //2021-12-01T03:17:44.033Z

    this.sharingFile = true
    this.http.post<Share>(environment.urlPrefix + 'api/shares', share).subscribe(res => {
      let baseUrl = environment.production ? 'https://fmning.com/drive/share/' : 'http://localhost:4200/share/'
      this.shareLink = baseUrl + res.id
      this.sharingFile = false
    }, error => {
      this.sharingFile = false
      this.notifierService.notify('error', error.message);
    });
  }

  copyToClipboard() {
    const selBox = document.createElement('textarea')
    selBox.style.position = 'fixed'
    selBox.style.left = '0'
    selBox.style.top = '0'
    selBox.style.opacity = '0'
    selBox.value = this.shareLink
    document.body.appendChild(selBox)
    selBox.focus()
    selBox.select()
    document.execCommand('copy')
    document.body.removeChild(selBox)
  }

}
