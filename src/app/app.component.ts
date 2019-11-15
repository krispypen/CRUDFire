import {Component} from '@angular/core';
import {AuthService} from './shared/services/auth.service';
import {Title} from '@angular/platform-browser';
import {environment} from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'crud-fire';

  constructor(public authService: AuthService,
              private titleService: Title) {
    this.title = environment.name;
    titleService.setTitle(this.title);
  }
}
