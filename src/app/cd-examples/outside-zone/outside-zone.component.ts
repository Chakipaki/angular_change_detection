import { Component, NgZone, ChangeDetectorRef, ApplicationRef } from '@angular/core';

/**
 * Example: Code Running Outside Angular Zone
 * 
 * Demonstrates:
 * - runOutsideAngular() - Run code without triggering CD
 * - Manual CD triggers when outside zone
 * - Performance optimization use cases
 */
@Component({
  selector: 'app-outside-zone',
  templateUrl: './outside-zone.component.html',
  styleUrls: ['./outside-zone.component.css']
})
export class OutsideZoneComponent {
  insideZoneCounter = 0;
  outsideZoneCounter = 0;
  outsideZoneWithManualCounter = 0;
  animationFrameCounter = 0;
  animationId: number | null = null;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private appRef: ApplicationRef
  ) {}

  // Example 1: Inside Zone - Auto CD
  incrementInsideZone(): void {
    this.insideZoneCounter++;
    console.log('Inside zone - CD will run automatically');
  }

  // Example 2: Outside Zone - No CD
  incrementOutsideZone(): void {
    this.ngZone.runOutsideAngular(() => {
      this.outsideZoneCounter++;
      console.log('Outside zone - CD will NOT run');
    });
  }

  // Example 3: Outside Zone with Manual CD
  incrementOutsideZoneWithManual(): void {
    this.ngZone.runOutsideAngular(() => {
      this.outsideZoneWithManualCounter++;
      // Manually trigger CD
      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });
      console.log('Outside zone - Manual CD triggered');
    });
  }

  // Example 4: Performance Optimization - Animation Loop
  startAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      return;
    }

    // Run animation outside zone for performance
    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        this.animationFrameCounter++;
        this.animationId = requestAnimationFrame(animate);
        
        // Only trigger CD every 10 frames for performance
        if (this.animationFrameCounter % 10 === 0) {
          this.ngZone.run(() => {
            this.cdr.detectChanges();
          });
        }
      };
      animate();
    });
  }

  // Example 5: Heavy Computation Outside Zone
  heavyComputation(): void {
    this.ngZone.runOutsideAngular(() => {
      // Simulate heavy computation
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += i;
      }
      this.outsideZoneWithManualCounter = result % 1000;
      
      // Trigger CD after computation
      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });
      console.log('Heavy computation done - CD triggered manually');
    });
  }

  // Example 6: ApplicationRef.tick() - Full app CD
  triggerFullAppCD(): void {
    this.ngZone.runOutsideAngular(() => {
      this.outsideZoneCounter++;
      // Trigger CD for entire app
      this.appRef.tick();
      console.log('Full app CD triggered');
    });
  }
}
