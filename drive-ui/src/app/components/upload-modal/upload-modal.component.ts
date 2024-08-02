import { CommonModule } from '@angular/common'
import { HttpClient, HttpEventType } from '@angular/common/http'
import { Component, Output, OnInit, EventEmitter } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterOutlet, RouterModule } from '@angular/router'
import { environment } from '../../../environments/environment'
import { UploadResult } from '../../model/upload-result'
import { UtilsService } from '../../utils.service'
import { NotificationsService } from 'angular2-notifications'

declare var $: any

@Component({
  selector: 'app-upload-modal',
  standalone: true,
  imports: [RouterOutlet, FormsModule, CommonModule, RouterModule],
  templateUrl: './upload-modal.component.html',
  styleUrl: './upload-modal.component.css'
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

  plusImage = '/assets/plus.png'

  @Output() onUploadFinished: EventEmitter<any> = new EventEmitter()

  constructor(private http: HttpClient, private notifierService: NotificationsService, public utils: UtilsService) { }

  ngOnInit() {}

  showModal(directory: string, uploadToSharedFolder = false) {
    this.directory = directory
    this.uploadToSharedFolder = uploadToSharedFolder
    this.uploadFiles = []
    this.uploadRatio = 0
    this.uploadFilesSize = 0
    $("#uploadFileModal").modal('show')
  }

  loadFiles(files: any) {
    for (let file of files) {
      // TODO: Check for folders?

      if (file.size == 0) {
        this.notifierService.error('Error', `Cannot upload empty file: ${file.name}`)
        continue
      }
      if (this.uploadFiles.some(f => f.name == file.name)) {
        this.notifierService.error('Error',  `File with the same name has been selected: ${file.name}`)
        continue
      }

      if (this.uploadFilesSize + file.size > 4294967296) {
        this.notifierService.error('Error',  `Cannot upload more than 4GB of files at a time.`)
        return
      }

      this.uploadFilesSize += file.size
      this.uploadFiles.push(file)
    }
  }

  removeUploadFile(file: any) {
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
      this.notifierService.error('Error', 'Please select at least 1 file to upload.')
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
    }).subscribe({
      next: (res: any) => {
        if (res.type === HttpEventType.Response) {
          this.uploadRatio = 100;
          this.uploadingFile = false;
          $("#uploadFileModal").modal('hide')
  
          this.onUploadFinished.emit([res.body.files]);
          if (res.body.error != '') {
            this.notifierService.warn('Warning', res.body.error);
          }
        }
        if (res.type === HttpEventType.UploadProgress) {
            this.uploadRatio = Math.round(100 * res.loaded / res.total);
        } 
      },
      error: (error: any) => {
        this.uploadingFile = false;
        this.notifierService.error('Error', error.message);
      }
    })
  }

  onDragOver(event: any) {
    event.stopPropagation();
    event.preventDefault();
  }

  onDragEnter(event: any) {
    this.dragOver = true;
    event.preventDefault();
  }

  onDragLeave(event: any) {
    this.dragOver = false;
    event.preventDefault();
  }

  onFilesDropped(event: any) {
    this.dragOver = false;
    event.preventDefault();
    this.loadFiles(event.dataTransfer.files);
  }

  onFilesSelected(event: any) {
    event.preventDefault();
    this.loadFiles(event.target.files);
  }

}
