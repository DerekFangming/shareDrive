import { PlatformLocation } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NotifierService } from 'angular-notifier';
import { environment } from 'src/environments/environment';
import { Share } from '../model/share';
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

  loadingPage = true
  editingShares = false
  deletingShare = false

  modalRef: NgbModalRef
  @ViewChild('deleteConfirmModal', { static: true}) deleteConfirmModal: TemplateRef<any>
  @ViewChild('updateShareModal', { static: true}) updateShareModal: TemplateRef<any>

  constructor(private http: HttpClient, public utils: UtilsService, private router: Router, private location: PlatformLocation,
    private notifierService: NotifierService, private modalService: NgbModal) { }

  ngOnInit() {
    let path = this.getDirectoryFromUrl()
    this.editingShares = path == ''
    console.log(path)

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
          this.notifierService.notify('error', error.message);
        })

      }, error => {
        this.loadingPage = false
        this.notifierService.notify('error', error.message);
      })
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

  shareIndefinitely = 'true'
  minDate: any
  shareToDate: any

  editSharePrompt(share: Share) {
    this.selectedShare = share
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

}
