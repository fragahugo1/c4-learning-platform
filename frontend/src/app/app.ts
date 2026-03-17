import { Component, signal } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { Sidebar } from './sidebar/sidebar';
import { BoardComponent } from './board/board';

@Component({
  selector: 'app-root',
  imports: [DrawerModule, Sidebar, BoardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}