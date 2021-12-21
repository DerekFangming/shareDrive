import { PlatformLocation } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NotifierService } from 'angular-notifier';
import { environment } from 'src/environments/environment';
import { UploadModalComponent } from '../components/upload-modal/upload-modal.component';
import { Share } from '../model/share';
import { Shareable } from '../model/shareable';
import { User } from '../model/user';
import { UtilsService } from '../utils.service';

@Component({
  selector: 'app-share',
  templateUrl: './share.component.html',
  styleUrls: ['./share.component.css']
})
export class ShareComponent implements OnInit {

  me: User
  selectedShare: Share
  shares = []
  shareIndefinitely = 'true'
  shareName = ''
  directory = ''
  minDate: any
  shareToDate: any
  shareLoadError: any
  shareDetails = ''
  shareables: Shareable[] = [];
  selectedFile: Shareable;

  loadingPage = true
  editingShares = false
  deletingShare = false
  shareWriteAccess = false
  updatingShare = false

  modalRef: NgbModalRef
  @ViewChild('deleteConfirmModal', { static: true}) deleteConfirmModal: TemplateRef<any>
  @ViewChild('updateShareModal', { static: true}) updateShareModal: TemplateRef<any>
  @ViewChild('uploadFileModal', { static: true}) uploadFileModal: UploadModalComponent;

  constructor(private http: HttpClient, public utils: UtilsService, private router: Router, private location: PlatformLocation,
    private notifierService: NotifierService, private modalService: NgbModal) { }

  ngOnInit() {
    let path = this.getDirectoryFromUrl()
    this.editingShares = path == ''

    this.loadingPage = true
    if (this.editingShares) {
      this.http.get<User>(environment.urlPrefix + 'me').subscribe(me => {
        this.me = me
        if (this.me.avatar == null) this.me.avatar ='https://i.imgur.com/lkAhvIs.png'
        
        // Loading shares
        this.http.get<Share[]>(environment.urlPrefix + 'api/shares').subscribe(shares => {
          this.loadingPage = false
          this.shares = shares
        }, error => {
          this.loadingPage = false
          this.notifierService.notify('error', error.message)
        })

      }, error => {
        this.loadingPage = false
        this.notifierService.notify('error', error.message)
      })
    } else {
      this.loadDirectory(path)
    }

    this.location.onPopState(() => {
      this.loadDirectory(this.getDirectoryFromUrl());
    });
  }

  loadDirectory(directory: string) {
    this.shareLoadError = null
    this.router.navigateByUrl('/share/' + directory);
    this.directory = directory
    this.http.get<Shareable[]>(environment.urlPrefix + 'api/shared-directory/' + directory, {observe: 'response' as 'response'}).subscribe(res => {
      this.loadingPage = false
      this.shareDetails = res.headers.get('X-Share-Details')
      this.shareables = res.body.map(s => this.utils.parseFileType(s)).sort((a, b) => a.isFile == b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1)

      if (this.shareDetails.startsWith('f')) {
        this.selectedFile = this.shareables[0]
      }
    }, error => {
      this.loadingPage = false
      this.shareLoadError = error.message
    })
  }

  loadFolderContent(shareable: Shareable) {
    if (!shareable.isFile) {
      this.loadDirectory(shareable.path)
    }
  }

  getDirectoryFromUrl() {
    let path = this.location.pathname.replace(environment.contextPath + '/share', '')
    if (path.startsWith('/')) path = path.substring(1)
    return decodeURI(path)
  }

  getShareName(share: Share) {
    if (share.name == null || share.name == '') {
      let parts = share.file.split('/')
      return parts[parts.length - 1]
    }
    return share.name
  }

  deleteSharePrompt(share: Share) {
    this.selectedShare = share
    this.deletingShare = false
    this.modalRef = this.modalService.open(this.deleteConfirmModal, {
      backdrop : 'static',
      keyboard : false,
      centered: true,
    })
  }

  deleteSelectedShare() {
    this.deletingShare = true;
    this.http.delete(environment.urlPrefix + 'api/shares/' + this.selectedShare.id).subscribe(res => {
      this.deletingShare = false;
      this.modalRef.close();
      var index = this.shares.indexOf(this.selectedShare);
      if (index !== -1) {
        this.shares.splice(index, 1);
      }
    }, error => {
      this.deletingShare = false;
      this.notifierService.notify('error', error.message);
    });
  }

  editSharePrompt(share: Share) {
    this.selectedShare = share
    this.shareName = share.name
    this.shareWriteAccess = share.writeAccess
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
    this.modalRef = this.modalService.open(this.updateShareModal, {
      backdrop : 'static',
      keyboard : false,
      centered: true,
    })
  }

  getShareLink(id: string) {
    return (environment.production ? 'https://fmning.com/drive/share/' : 'http://localhost:4200/share/') + id
  }

  copyToClipboard(id: string) {
    this.utils.copyToClipboard(document, this.getShareLink(id))
  }

  updateShare() {
    this.updatingShare = true;
    let updatedShare = new Share({id: this.selectedShare.id, name: this.shareName, writeAccess: this.shareWriteAccess})
    if (this.shareIndefinitely == 'false') {
      updatedShare.expiration = new Date(this.shareToDate.year + '-' + this.shareToDate.month + '-' + (this.shareToDate.day + 1)).toISOString()
    }

    this.http.put<Share>(environment.urlPrefix + 'api/shares', updatedShare).subscribe(res => {
      this.updatingShare = false;
      var index = this.shares.indexOf(this.selectedShare);
      if (index !== -1) {
        this.shares[index] = res
      }
      this.modalRef.close()
    }, error => {
      this.updatingShare = false;
      this.notifierService.notify('error', error.message);
    });
  }

  downloadFile(shareable) {
    this.selectedFile = shareable
    this.downloadSelectedFile()
  }

  downloadSelectedFile() {
    if (this.selectedFile.isFile) {
      if (environment.production) {
        window.open(environment.urlPrefix + environment.contextPath + "/api/download-shared-file/" + this.selectedFile.path);
      } else {
        window.open(environment.urlPrefix + "api/download-shared-file/" + this.selectedFile.path);
      }
    }
  }

  uploadFinished(shareables: Shareable[]){
    this.shareables = [ ...this.shareables, ...shareables]
    this.shareables = this.shareables.map(s => this.utils.parseFileType(s)).sort((a, b) => a.isFile == b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1)
  }

}
