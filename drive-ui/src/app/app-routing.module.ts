import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DirectoryComponent } from './directory/directory.component';
import { ShareComponent } from './share/share.component';


const routes: Routes = [
  { path: 'directory', children: [
    {
      path: '**',
      component: DirectoryComponent
    }
  ]},
  { path: 'share', children: [
    {
      path: '**',
      component: ShareComponent
    }
  ]},
  { path: '**', redirectTo: '/directory', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
