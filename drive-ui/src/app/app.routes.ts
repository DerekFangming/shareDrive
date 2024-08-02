import { Routes, RouterModule } from '@angular/router'
import { DirectoryComponent } from './directory/directory.component'
import { ShareComponent } from './share/share.component'


export const routes: Routes = [
  { path: 'directory', children: [
    { path: '**', component: DirectoryComponent }
  ]},
  { path: 'share', children: [
    { path: '**', component: ShareComponent }
  ]},
  { path: '**', redirectTo: '/directory', pathMatch: 'full' }
]
