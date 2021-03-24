import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Shareable } from '../model/Shareable';

@Component({
  selector: 'app-directory',
  templateUrl: './directory.component.html',
  styleUrls: ['./directory.component.css']
})
export class DirectoryComponent implements OnInit {

  loadingDirectory = false;
  directory = 'something/abc';
  shareables: Shareable[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.loadDirectory();
  }

  loadDirectory() {
    //let path = this.directory.length == 0 ? '' : this.directory.join('/');
    this.loadingDirectory = true;
    this.http.get<Shareable[]>(environment.urlPrefix + 'api/directory/' + this.directory).subscribe(res => {
      this.loadingDirectory = false;
      this.shareables = res;
    }, error => {
      this.loadingDirectory = false;
      console.log(error.error);
    });
  }

  splitDirectory() {
    let dirs = this.directory == '' ? [] : this.directory.split('/');
    let res: String[] = [];
    let parentDir = '';

    
    console.log(this.directory);
    console.log(dirs);
    for (let dir in dirs) {
      res.push(parentDir + dir);
      parentDir += dir + '/';
    }

    console.log(res);
    return res;
  }

}
