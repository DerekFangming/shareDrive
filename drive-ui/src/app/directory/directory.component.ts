import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-directory',
  templateUrl: './directory.component.html',
  styleUrls: ['./directory.component.css']
})
export class DirectoryComponent implements OnInit {

  // posts: Post[];
  remainingPosts: string;
  previewedImgSrc: string;

  constructor(private http: HttpClient) { }

  ngOnInit() {
  }

}
