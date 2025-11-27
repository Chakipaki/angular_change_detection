import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-onpush-cd',
  templateUrl: './onpush-cd.component.html',
  styleUrls: ['./onpush-cd.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnpushCdComponent {
  @Input() data: string = '';
  @Input() counter: number = 0;
  
  internalCounter = 0;
  lastChecked: Date | null = null;

  constructor(private cdr: ChangeDetectorRef) {
    this.updateLastChecked();
  }

  incrementInternal(): void {
    this.internalCounter++;
    this.updateLastChecked();
    // With OnPush, we need to manually mark for check
    this.cdr.markForCheck();
  }

  updateLastChecked(): void {
    this.lastChecked = new Date();
  }

  // This method will be called ONLY when component is checked
  ngDoCheck(): void {
    this.updateLastChecked();
    console.log('OnpushCdComponent: DoCheck');
  }
}
