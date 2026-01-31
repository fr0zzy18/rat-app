import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import { LoginComponent } from './components/login/login.component'; // Removed Login Component import

@Component({
  selector: 'app-root',
  standalone: true, // It's already standalone
  imports: [RouterOutlet], // Removed LoginComponent here
  template: `
    <router-outlet></router-outlet>
  `,
  styles: [`
    /* Basic global styles if needed, otherwise leave empty */
  `]
})
export class App {
  protected readonly title = signal('rat-app-ui');
}
