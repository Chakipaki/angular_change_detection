import { Component } from '@angular/core';

/**
 * Example: Async Operations and Change Detection
 * 
 * Demonstrates:
 * - setTimeout - Zone.js patches it, auto CD
 * - setInterval - Zone.js patches it, auto CD
 * - Promise - Zone.js patches it, auto CD
 * - async/await - Zone.js patches it, auto CD
 */
@Component({
  selector: 'app-async-cd',
  templateUrl: './async-cd.component.html',
  styleUrls: ['./async-cd.component.css']
})
export class AsyncCdComponent {
  setTimeoutCounter = 0;
  setIntervalCounter = 0;
  promiseCounter = 0;
  asyncCounter = 0;
  intervalId: any = null;

  // Example 1: setTimeout - Auto CD (Zone.js patched)
  startSetTimeout(): void {
    setTimeout(() => {
      this.setTimeoutCounter++;
      console.log('setTimeout: Counter updated, CD will run automatically');
    }, 1000);
  }

  // Example 2: setInterval - Auto CD (Zone.js patched)
  startSetInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      return;
    }

    this.intervalId = setInterval(() => {
      this.setIntervalCounter++;
      console.log('setInterval: Counter updated, CD runs automatically');
    }, 1000);
  }

  // Example 3: Promise - Auto CD (Zone.js patched)
  startPromise(): void {
    Promise.resolve().then(() => {
      this.promiseCounter++;
      console.log('Promise: Counter updated, CD will run automatically');
    });
  }

  // Example 4: async/await - Auto CD (Zone.js patched)
  async startAsync(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.asyncCounter++;
    console.log('async/await: Counter updated, CD will run automatically');
  }

  // Example 5: Multiple async operations
  startMultipleAsync(): void {
    // All these will trigger CD automatically
    setTimeout(() => this.setTimeoutCounter++, 500);
    Promise.resolve().then(() => this.promiseCounter++);
    setTimeout(() => this.asyncCounter++, 1000);
    console.log('Multiple async operations - all will trigger CD');
  }
}
