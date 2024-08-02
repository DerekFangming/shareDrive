import { provideClientHydration } from '@angular/platform-browser'
import { ApplicationConfig, importProvidersFrom } from '@angular/core'
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { AuthenticationInterceptor } from './authentication-interceptor'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideRouter } from '@angular/router'
import { SimpleNotificationsModule } from 'angular2-notifications'
import { routes } from './app.routes'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide:HTTP_INTERCEPTORS,
      useClass:AuthenticationInterceptor,
      multi:true
    },
    provideAnimations(),
    importProvidersFrom(SimpleNotificationsModule.forRoot({
      position: ['bottom', 'left'],
      timeOut: 5000,
    }))
  ]
}
