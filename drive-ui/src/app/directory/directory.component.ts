import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Shareable } from '../model/Shareable';
import { UtilsService } from '../utils.service';

@Component({
  selector: 'app-directory',
  templateUrl: './directory.component.html',
  styleUrls: ['./directory.component.css']
})
export class DirectoryComponent implements OnInit {

  loadingDirectory = false;
  directory = '';
  shareables: Shareable[] = [];

  constructor(private http: HttpClient, public utils: UtilsService) { }

  ngOnInit() {
    this.loadDirectory('');
  }

  loadDirectory(directory: string) {
    this.directory = directory;
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
    let res: Shareable[] = [];
    let parentDir = '';

    for (let dir of dirs) {
      res.push(new Shareable({name: dir, path: parentDir + dir}));
      parentDir += dir + '/';
    }

    return res;
  }

}
