import { PlatformLocation } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
  shares = [];

  loadingPage = true
  editingShares = false

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

}
