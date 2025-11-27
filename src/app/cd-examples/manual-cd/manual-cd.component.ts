import { Component, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

/**
 * Example: Manual Change Detection
 * 
 * Demonstrates:
 * - detectChanges() - Immediate CD for this component
 * - markForCheck() - Mark component dirty for next CD cycle
 * - OnPush strategy with manual triggers
 */
@Component({
  selector: 'app-manual-cd',
  templateUrl: './manual-cd.component.html',
  styleUrls: ['./manual-cd.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManualCdComponent {
  counter1 = 0;
  counter2 = 0;
  counter3 = 0;
  lastUpdate1: Date | null = null;
  lastUpdate2: Date | null = null;
  lastUpdate3: Date | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  // Example 1: Using detectChanges() - Immediate update
  incrementWithDetectChanges(): void {
    this.counter1++;
    this.lastUpdate1 = new Date();
    // Immediately triggers change detection for this component
    this.cdr.detectChanges();
    console.log('detectChanges() called - CD ran immediately');
  }

  // Example 2: Using markForCheck() - Deferred update
  incrementWithMarkForCheck(): void {
    this.counter2++;
    this.lastUpdate2 = new Date();
    // Marks component dirty, will be checked in next CD cycle
    this.cdr.markForCheck();
    console.log('markForCheck() called - will be checked in next CD cycle');
  }

  // Example 3: No manual trigger - Won't update (OnPush strategy)
  incrementWithoutTrigger(): void {
    this.counter3++;
    this.lastUpdate3 = new Date();
    // No manual trigger - OnPush won't detect this change!
    console.log('No trigger - change NOT detected (OnPush strategy)');
  }

  // Example 4: Multiple updates with single detectChanges()
  incrementMultiple(): void {
    this.counter1 += 5;
    this.counter2 += 5;
    this.counter3 += 5;
    // Single detectChanges() updates all changes at once
    this.cdr.detectChanges();
    console.log('Multiple updates with single detectChanges()');
  }
}
