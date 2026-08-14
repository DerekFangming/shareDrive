import { CommonModule } from '@angular/common'
import { HttpClient, HttpEventType } from '@angular/common/http'
import { ChangeDetectorRef, Component, Output, OnInit, EventEmitter } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterOutlet, RouterModule } from '@angular/router'
import { environment } from '../../../environments/environment'
import { UploadResult } from '../../model/upload-result'
import { Shareable } from '../../model/shareable'
import { UtilsService } from '../../utils.service'
import { NotificationsService } from 'angular2-notifications'
import { throwError, timeout } from 'rxjs'

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
  currentUploadName = ''
  savingToStorage = false

  directory = ''
  uploadToSharedFolder = false
  
  dragOver = false
  uploadingFile = false

  plusImage = '/assets/plus.png'

  private readonly maxRetries = 2
  // Abort if the browser reports no upload/download activity for this long.
  private readonly stallTimeoutMs = 120000

  @Output() onUploadFinished: EventEmitter<any> = new EventEmitter()

  constructor(
    private http: HttpClient,
    private notifierService: NotificationsService,
    public utils: UtilsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {}

  showModal(directory: string, uploadToSharedFolder = false) {
    this.directory = directory
    this.uploadToSharedFolder = uploadToSharedFolder
    this.uploadFiles = []
    this.uploadRatio = 0
    this.uploadFilesSize = 0
    this.uploadRemaining = ''
    this.currentUploadName = ''
    this.savingToStorage = false
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

  async uploadSelectedFiles() {
    if (this.uploadFiles.length == 0) {
      this.notifierService.error('Error', 'Please select at least 1 file to upload.')
      return
    }

    this.uploadingFile = true
    this.savingToStorage = false
    this.uploadRatio = 0
    this.uploadRemaining = '-'

    const uploadedFiles: Shareable[] = []
    let errors = ''
    let uploadedBytes = 0
    const totalBytes = this.uploadFilesSize
    let previousRatio = 0
    const progressTimer = setInterval(() => {
      if (this.savingToStorage) {
        this.uploadRemaining = '-'
      } else {
        const newProgress = this.uploadRatio - previousRatio
        previousRatio = this.uploadRatio
        if (newProgress <= 0) {
          this.uploadRemaining = '-'
        } else {
          const remainingSeconds = (100 - this.uploadRatio) / newProgress
          this.uploadRemaining = this.utils.secondsToStr(remainingSeconds)
        }
      }
      this.cdr.detectChanges()

      if (this.uploadRatio == 100 || !this.uploadingFile) {
        clearInterval(progressTimer)
      }
    }, 1000)

    try {
      for (const file of this.uploadFiles) {
        this.currentUploadName = file.name
        this.savingToStorage = false
        this.cdr.detectChanges()
        try {
          const result = await this.uploadSingleFileWithRetry(file, (loaded) => {
            const sent = Math.min(loaded, file.size)
            if (file.size > 0 && sent >= file.size) {
              this.savingToStorage = true
            }
            const ratio = totalBytes > 0 ? Math.round(100 * (uploadedBytes + sent) / totalBytes) : 100
            // Cap at 99% until the server finishes writing to storage and responds.
            this.uploadRatio = Math.min(99, ratio)
            this.cdr.detectChanges()
          })
          this.savingToStorage = false
          if (result.files?.length) {
            uploadedFiles.push(...result.files)
          }
          if (result.error) {
            errors += result.error
          }
          uploadedBytes += file.size
          this.uploadRatio = totalBytes > 0 ? Math.round(100 * uploadedBytes / totalBytes) : 100
          this.cdr.detectChanges()
        } catch (error: any) {
          this.savingToStorage = false
          errors += `File named ${file.name} failed to be uploaded, ${this.getErrorMessage(error)};`
        }
      }
    } finally {
      clearInterval(progressTimer)
      this.uploadingFile = false
      this.savingToStorage = false
      this.currentUploadName = ''
      this.uploadRatio = 100
      this.cdr.detectChanges()
    }

    if (uploadedFiles.length > 0) {
      $("#uploadFileModal").modal('hide')
      this.onUploadFinished.emit([uploadedFiles])
    }

    if (errors) {
      this.notifierService.warn('Warning', errors)
    } else if (uploadedFiles.length > 0) {
      this.notifierService.success('Success', 'Upload completed.')
    }
  }

  private async uploadSingleFileWithRetry(file: File, onProgress: (loaded: number) => void): Promise<UploadResult> {
    let lastError: any
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.uploadSingleFile(file, onProgress)
      } catch (error: any) {
        lastError = error
        if (attempt < this.maxRetries && this.isRetryableError(error)) {
          await this.delay(1000 * (attempt + 1))
          continue
        }
        break
      }
    }
    throw lastError
  }

  private uploadSingleFile(file: File, onProgress: (loaded: number) => void): Promise<UploadResult> {
    const body = new FormData()
    body.append('files', file)
    const uploadUrl = this.uploadToSharedFolder ? 'api/upload-shared-file/' : 'api/upload-file/'

    // Allow more time after bytes are sent while the server writes to storage.
    const responseWaitMs = Math.min(
      Math.max(this.stallTimeoutMs, Math.ceil(file.size / 50) + 60_000),
      600_000
    )

    return new Promise((resolve, reject) => {
      let uploadComplete = false
      this.http.post<UploadResult>(environment.urlPrefix + uploadUrl + this.directory, body, {
        reportProgress: true,
        observe: 'events'
      }).pipe(
        timeout({
          each: responseWaitMs,
          with: () => throwError(() => ({
            status: 0,
            message: uploadComplete
              ? 'Timed out while saving file to storage'
              : 'Upload stalled'
          }))
        })
      ).subscribe({
        next: (res: any) => {
          if (res.type === HttpEventType.UploadProgress) {
            // Browsers sometimes omit `total` for FormData; always use loaded bytes.
            const loaded = res.loaded ?? 0
            onProgress(loaded)
            if (file.size > 0 && loaded >= file.size) {
              uploadComplete = true
              this.savingToStorage = true
              this.cdr.detectChanges()
            }
          } else if (res.type === HttpEventType.ResponseHeader) {
            uploadComplete = true
            this.savingToStorage = true
            this.cdr.detectChanges()
          } else if (res.type === HttpEventType.Response) {
            resolve(res.body as UploadResult)
          }
        },
        error: (error: any) => reject(error)
      })
    })
  }

  private getErrorMessage(error: any): string {
    if (!error) {
      return 'Unknown error'
    }
    if (typeof error === 'string') {
      return error
    }
    if (error.name === 'TimeoutError' || error.message === 'Upload stalled') {
      return error.message || 'Upload stalled'
    }
    if (typeof error.message === 'string' && error.message.includes('saving file to storage')) {
      return error.message
    }
    if (error.status === 0) {
      return error.message || 'Network connection lost'
    }
    return error.error?.message || error.message || error.error || 'Unknown error'
  }

  private isRetryableError(error: any): boolean {
    if (!error) {
      return true
    }
    if (error.name === 'TimeoutError' || error.message === 'Upload stalled') {
      return true
    }
    const status = error.status
    if (status === 0 || status >= 500) {
      return true
    }
    const message = this.getErrorMessage(error).toLowerCase()
    return message.includes('network') || message.includes('timeout') || message.includes('incomplete upload') || message.includes('stalled')
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
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
