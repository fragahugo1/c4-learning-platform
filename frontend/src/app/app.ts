import { Component, signal } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { Sidebar } from './sidebar/sidebar';
import { BoardComponent } from './board/board';
import { HorizontalBar } from './horizontal-bar/horizontal-bar';

@Component({
  selector: 'app-root',
  imports: [DrawerModule, Sidebar, HorizontalBar, BoardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {
  protected readonly title = signal('frontend');
}