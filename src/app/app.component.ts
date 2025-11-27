import { Component, OnInit, AfterViewInit, AfterContentInit, NgZone } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public counter = 0;
  public data = 'Initial Data';
  private checkCDCount = 0;

  constructor(private ngZone: NgZone) {
    this.ngZone.onMicrotaskEmpty.subscribe(() => {
      console.log('AppComponent: Microtask empty');
    });
  }

  public increment(): void {
    this.counter++;
  }

  public updateData(): void {
    this.data = `Updated at ${new Date().toLocaleTimeString()}`;
  }

  /**
   * ⚠️ WARNING: This method is called in the template {{ checkCD() }}
   * 
   * WHY IT RUNS MULTIPLE TIMES ON INITIAL RENDER:
   * 
   * Angular runs change detection MULTIPLE times during component initialization:
   * 
   * 1. FIRST CD RUN (Count: 1)
   *    - Component is created
   *    - Constructor runs
   *    - Angular runs initial change detection to render the view
   *    - Template is evaluated for the first time
   * 
   * 2. SECOND CD RUN (Count: 2)
   *    - After ngOnInit() lifecycle hook
   *    - Angular ensures all initialization is complete
   *    - Template is evaluated again
   * 
   * 3. THIRD CD RUN (Count: 3)
   *    - After ngAfterContentInit() lifecycle hook (if content projection exists)
   *    - After content projection is initialized
   *    - Angular checks if content initialization caused any changes
   *    - Template is evaluated again
   * 
   * 4. FOURTH CD RUN (Count: 4)
   *    - After ngAfterViewInit() lifecycle hook
   *    - After view queries are resolved
   *    - Final check to ensure everything is synchronized
   *    - Template is evaluated one more time
   * 
   * ADDITIONAL RUNS:
   * - Any async operations during initialization (setTimeout, Promises, etc.)
   * - Zone.js detecting async operations and triggering CD
   * 
   * ⚠️ IMPORTANT: Calling methods in templates is ANTI-PATTERN!
   * - Method runs on EVERY change detection cycle
   * - Causes performance issues
   * - Use properties/getters instead
   */
  public checkCD(): null {
    this.checkCDCount++;
    console.log('AppComponent: Change detection ran', this.checkCDCount);
    return null;
  }
}
