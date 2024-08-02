import { CommonModule, PlatformLocation } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { Router, RouterModule, RouterOutlet } from '@angular/router'
import { Share } from '../model/share'
import { Shareable } from '../model/shareable'
import { User } from '../model/user'
import { UtilsService } from '../utils.service'
import { FormsModule } from '@angular/forms'
import { environment } from '../../environments/environment'
import { NotificationsService } from 'angular2-notifications'
import { UploadModalComponent } from '../components/upload-modal/upload-modal.component'
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap'

declare var $: any

@Component({
  selector: 'app-share',
  standalone: true,
  imports: [RouterOutlet, FormsModule, CommonModule, RouterModule, UploadModalComponent, NgbDatepickerModule],
  templateUrl: './share.component.html',
  styleUrl: './share.component.css'
})
export class ShareComponent implements OnInit {

  me: User | undefined
  selectedShare: Share = new Share()
  shares:Share[] = []
  shareIndefinitely = 'true'
  shareName = ''
  directory = ''
  minDate: any
  shareToDate: any
  shareLoadError: any
  shareDetails = ''
  shareables: Shareable[] = []
  selectedFile: Shareable | undefined

  loadingPage = true
  editingShares = false
  deletingShare = false
  shareWriteAccess = false
  updatingShare = false

  constructor(private http: HttpClient, public utils: UtilsService, private router: Router, private location: PlatformLocation,
    private notifierService: NotificationsService) { }

  ngOnInit() {
    let path = this.getDirectoryFromUrl()
    this.editingShares = path == ''

    this.loadingPage = true
    if (this.editingShares) {
      this.http.get<User>(environment.urlPrefix + 'me').subscribe({
        next: (me: User) => {
          this.me = me
          if (this.me.avatar == null) this.me.avatar ='https://i.imgur.com/lkAhvIs.png'
  
          // Loading shares
          this.http.get<Share[]>(environment.urlPrefix + 'api/shares').subscribe({
            next: (shares: Share[]) => {
              this.loadingPage = false
              this.shares = shares
            },
            error: (error: any) => {
              this.loadingPage = false
              this.notifierService.error('Error', error.message)
            }
          })
        },
        error: (error: any) => {
          this.loadingPage = false
          this.notifierService.error('Error', error.message)
        }
      })
    } else {
      this.loadDirectory(path)
    }

    this.location.onPopState(() => {
      this.loadDirectory(this.getDirectoryFromUrl())
    })
  }

  loadDirectory(directory: string) {
    this.shareLoadError = null
    this.router.navigateByUrl('/share/' + directory)
    this.directory = directory
    this.http.get<Shareable[]>(environment.urlPrefix + 'api/shared-directory/' + directory, {observe: 'response' as 'response'}).subscribe({
      next: (res: any) => {
        this.loadingPage = false
        this.shareDetails = res.headers.get('X-Share-Details')
        this.shareables = res.body.map((s:Shareable) => this.utils.parseFileType(s))
          .sort((a:Shareable, b:Shareable) => a.isFile == b.isFile ? a.name!.localeCompare(b.name!) : a.isFile ? 1 : -1)
  
        if (this.shareDetails.startsWith('f')) {
          this.selectedFile = this.shareables[0]
        }
      },
      error: (error: any) => {
        this.loadingPage = false
        this.shareLoadError = error.message
      }
    })
  }

  loadFolderContent(shareable: Shareable) {
    if (!shareable.isFile) {
      this.loadDirectory(shareable.path!)
    }
  }

  getDirectoryFromUrl() {
    let path = this.location.pathname.replace('/share', '')
    if (path.startsWith('/')) path = path.substring(1)
    return decodeURI(path)
  }

  getShareName(share: Share) {
    if (share.name == null || share.name == '') {
      if (share.path) {
        let parts = share.path!.split('/')
        return parts[parts.length - 1]
      }
    }
    return share.name
  }

  deleteSharePrompt(share: Share) {
    this.selectedShare = share
    this.deletingShare = false
    $("#deleteConfirmModal").modal('show')
  }

  deleteSelectedShare() {
    this.deletingShare = true
    this.http.delete(environment.urlPrefix + 'api/shares/' + this.selectedShare!.id).subscribe({
      next: (res: any) => {
        this.deletingShare = false
        $("#deleteConfirmModal").modal('hide')
        var index = this.shares.indexOf(this.selectedShare!)
        if (index !== -1) {
          this.shares.splice(index, 1)
        }
      },
      error: (error: any) => {
        this.deletingShare = false
        this.notifierService.error('Error', error.message)
      }
    })
  }

  editSharePrompt(share: Share) {
    this.selectedShare = share
    this.shareName = share.name!
    this.shareWriteAccess = share.writeAccess!
    const current = new Date()
    this.minDate= { year: current.getFullYear(), month: current.getMonth() + 1, day: current.getDate()}
    if (share.expiration == null) {
      this.shareIndefinitely = 'true'
      this.shareToDate = null
    } else {
      this.shareIndefinitely = 'false'
      let expiration = new Date(share.expiration)
      console.log(expiration)
      this.shareToDate = { year: expiration.getFullYear(), month: expiration.getMonth() + 1, day: expiration.getDate()}
    }
    $("#updateShareModal").modal('show')
  }

  getShareLink(id: string) {
    return (environment.production ? 'https://share.fmning.com/share/' : 'http://localhost:4200/share/') + id
  }

  copyToClipboard(id: string) {
    navigator.clipboard.writeText(this.getShareLink(id)).then().catch(e => console.error(e))
  }

  updateShare() {
    this.updatingShare = true;
    let updatedShare = new Share({id: this.selectedShare!.id, name: this.shareName, writeAccess: this.shareWriteAccess})
    if (this.shareIndefinitely == 'false') {
      updatedShare.expiration = new Date(this.shareToDate.year + '-' + this.shareToDate.month + '-' + (this.shareToDate.day + 1)).toISOString()
    }

    this.http.put<Share>(environment.urlPrefix + 'api/shares', updatedShare).subscribe({
      next: (res: any) => {
        this.updatingShare = false
        var index = this.shares.indexOf(this.selectedShare!)
        if (index !== -1) {
          this.shares[index] = res
        }
        $("#updateShareModal").modal('hide')
      },
      error: (error: any) => {
        this.updatingShare = false
        this.notifierService.error('Error', error.message)
      }
    })
  }

  downloadFile(shareable: Shareable) {
    this.selectedFile = shareable
    this.downloadSelectedFile()
  }

  downloadSelectedFile() {
    if (this.selectedFile!.isFile) {
      window.open(environment.urlPrefix + "api/download-shared-file/" + this.selectedFile!.path);
    }
  }

  uploadFinished(event: any) {
    let shareables: Shareable[] = event[0]
    this.shareables = [ ...this.shareables, ...shareables]
    this.shareables = this.shareables.map(s => this.utils.parseFileType(s)).sort((a, b) => a.isFile == b.isFile ? a.name!.localeCompare(b.name!) : a.isFile ? 1 : -1)
  }

}
