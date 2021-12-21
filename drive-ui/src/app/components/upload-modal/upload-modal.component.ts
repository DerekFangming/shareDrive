import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, Output, OnInit, TemplateRef, ViewChild, EventEmitter } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NotifierService } from 'angular-notifier';
import { UploadResult } from 'src/app/model/upload-result';
import { UtilsService } from 'src/app/utils.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-upload-modal',
  templateUrl: './upload-modal.component.html',
  styleUrls: ['./upload-modal.component.css']
})
export class UploadModalComponent implements OnInit {

  uploadFilesSize = 0
  uploadRatio = 0
  uploadRemaining = ''
  uploadFiles: File[] = []

  directory = ''
  uploadToSharedFolder = false
  
  dragOver = false
  uploadingFile = false

  plusImage = environment.production ? environment.contextPath + '/assets/plus.png' : '/assets/plus.png'

  modalRef: NgbModalRef
  @ViewChild('uploadFileModal', { static: true}) uploadFileModal: TemplateRef<any>
  @Output() onUploadFinished: EventEmitter<any> = new EventEmitter()

  constructor(private http: HttpClient, private modalService: NgbModal, private notifierService: NotifierService, public utils: UtilsService) { }

  ngOnInit() {}

  showModal(directory: string, uploadToSharedFolder = false) {
    this.directory = directory
    this.uploadToSharedFolder = uploadToSharedFolder
    this.uploadFiles = []
    this.uploadRatio = 0
    this.uploadFilesSize = 0
    this.modalRef = this.modalService.open(this.uploadFileModal, {
      backdrop : 'static',
      keyboard : false,
      size: 'lg'
    })
  }

  loadFiles(files) {
    for (let file of files) {
      // TODO: Check for folders?

      if (file.size == 0) {
        this.notifierService.notify('error', `Cannot upload empty file: ${file.name}`)
        continue
      }
      if (this.uploadFiles.some(f => f.name == file.name)) {
        this.notifierService.notify('error',  `File with the same name has been selected: ${file.name}`)
        continue
      }

      if (this.uploadFilesSize + file.size > 4294967296) {
        this.notifierService.notify('error',  `Cannot upload more than 4GB of files at a time.`)
        return
      }

      this.uploadFilesSize += file.size
      this.uploadFiles.push(file)
    }
  }

  removeUploadFile(file) {
    const index = this.uploadFiles.indexOf(file)
    if (index > -1) {
      this.uploadFiles.splice(index, 1)

      if (this.uploadFilesSize - file.size <= 0) {
        this.uploadFilesSize = 0
      } else {
        this.uploadFilesSize -= file.size
      }
    }
  }

  uploadSelectedFiles() {
    if (this.uploadFiles.length == 0) {
      this.notifierService.notify('error', 'Please select at least 1 file to upload.')
      return
    }

    this.uploadingFile = true
    let body = new FormData()
    for (let f of this.uploadFiles) {
      body.append('files', f)
    }

    let previousRatio = 0
		let progressTimer = setInterval(() => {
			let newProgress = this.uploadRatio - previousRatio
			previousRatio = this.uploadRatio
			if (newProgress <= 0) {
				this.uploadRemaining = '-'
			} else {
				let remainingSeconds = (100 - this.uploadRatio) / newProgress
				this.uploadRemaining = this.utils.secondsToStr(remainingSeconds)
			}
			
			if (this.uploadRatio == 100 || !this.uploadingFile) {
				clearInterval(progressTimer)
			}
		}, 1000)

    let uploadUrl = this.uploadToSharedFolder ? 'api/upload-shared-file/' : 'api/upload-file/'
    this.http.post<UploadResult>(environment.urlPrefix + uploadUrl + this.directory, body, {
      reportProgress: true,
      observe: 'events'
    }).subscribe(res => {
      if (res.type === HttpEventType.Response) {
        this.uploadRatio = 100;
        this.uploadingFile = false;
        this.modalRef.close();

        this.onUploadFinished.emit([res.body.files]);
        if (res.body.error != '') {
          this.notifierService.notify('warning', res.body.error);
        }
      }
      if (res.type === HttpEventType.UploadProgress) {
          this.uploadRatio = Math.round(100 * res.loaded / res.total);
      } 
    }, error => {
      this.uploadingFile = false;
      this.notifierService.notify('error', error.message);
    })
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

}
