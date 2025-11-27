import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Example: Observables and Change Detection
 * 
 * Demonstrates:
 * - Observable with AsyncPipe - Auto CD
 * - Observable without AsyncPipe - Manual CD needed
 * - OnPush strategy with observables
 */
@Component({
  selector: 'app-observable-cd',
  templateUrl: './observable-cd.component.html',
  styleUrls: ['./observable-cd.component.css']
})
export class ObservableCdComponent {
  // Example 1: Observable with AsyncPipe (auto CD)
  dataWithAsyncPipe$ = new BehaviorSubject<string>('Initial Value');

  // Example 2: Observable without AsyncPipe (manual CD needed)
  dataWithoutAsyncPipe$ = new BehaviorSubject<number>(0);
  dataWithoutAsyncPipeValue: number = 0;

  // Example 3: Interval Observable with AsyncPipe
  interval$ = interval(1000).pipe(
    map(value => `Tick: ${value}`)
  );

  // Example 4: OnPush component with observable
  onPushData$ = new BehaviorSubject<string>('OnPush Value');

  constructor(private cdr: ChangeDetectorRef) {
    // Subscribe without AsyncPipe - need manual CD
    this.dataWithoutAsyncPipe$.subscribe(value => {
      this.dataWithoutAsyncPipeValue = value;
      // Manual CD required!
      this.cdr.detectChanges();
    });
  }

  // Update observable with AsyncPipe
  updateWithAsyncPipe(): void {
    this.dataWithAsyncPipe$.next(`Updated: ${new Date().toLocaleTimeString()}`);
    console.log('Observable updated - AsyncPipe handles CD automatically');
  }

  // Update observable without AsyncPipe
  updateWithoutAsyncPipe(): void {
    this.dataWithoutAsyncPipe$.next(this.dataWithoutAsyncPipeValue + 1);
    console.log('Observable updated - Manual CD in subscription');
  }

  // Update OnPush observable
  updateOnPush(): void {
    this.onPushData$.next(`OnPush Updated: ${new Date().toLocaleTimeString()}`);
    console.log('OnPush observable updated - AsyncPipe handles CD');
  }
}
