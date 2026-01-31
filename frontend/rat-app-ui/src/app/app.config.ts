import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // Import withInterceptors
import { jwtInterceptor } from './core/interceptors/jwt.interceptor'; // Import jwtInterceptor

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([jwtInterceptor])), // Add withInterceptors here
    provideRouter(routes)
  ]
};
