import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { IndexComponent } from './index/index.component';
import { DirectoryComponent } from './directory/directory.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NotifierModule } from 'angular-notifier';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthenticationInterceptor } from './authentication-interceptor';
import { ShareComponent } from './share/share.component';
import { UploadModalComponent } from './components/upload-modal/upload-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    IndexComponent,
    DirectoryComponent,
    ShareComponent,
    UploadModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgbModule,
    FormsModule,
    NotifierModule.withConfig({
      behaviour: {
        autoHide: 10000
      },
      position: {
        horizontal: {
          position: 'right'
        }
      }
    })
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthenticationInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
