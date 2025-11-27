import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-default-cd',
  templateUrl: './default-cd.component.html',
  styleUrls: ['./default-cd.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DefaultCdComponent {
  @Input() data: string = '';
  @Input() counter: number = 0;
  
  internalCounter = 0;
  lastChecked: Date | null = null;

  constructor() {
    this.updateLastChecked();
  }

  incrementInternal(): void {
    this.internalCounter++;
    this.updateLastChecked();
    // With Default strategy, CD runs automatically
  }

  updateLastChecked(): void {
    this.lastChecked = new Date();
  }

  // This method will be called on EVERY change detection cycle
  ngDoCheck(): void {
    this.updateLastChecked();
    console.log('DefaultCdComponent: DoCheck');
  }
}
