import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { Sidebar } from './sidebar/sidebar';
import { HorizontalBar } from './horizontal-bar/horizontal-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DrawerModule, Sidebar, HorizontalBar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
