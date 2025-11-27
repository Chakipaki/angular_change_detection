# Angular Change Detection Cheat Sheet

A comprehensive guide to understanding Angular's Change Detection mechanism.

---

## 1. What is Change Detection?

**Change Detection** is Angular's mechanism to detect changes in component data and update the DOM accordingly.

### Simple Example:
```typescript
// Component
export class AppComponent {
  counter = 0;
  
  increment() {
    this.counter++; // Data changes
  }
}
```

```html
<!-- Template -->
<p>Counter: {{ counter }}</p>
<button (click)="increment()">Increment</button>
```

**What happens:**
1. User clicks button → `increment()` executes
2. `counter` value changes from `0` to `1`
3. Angular detects the change
4. DOM updates: `<p>Counter: 1</p>`

**Key Point:** Angular needs to know WHEN to check for changes. This is where Zone.js comes in.

---

## 2. Zone.js and Why Angular CD Needs It

**Zone.js** is a library that patches JavaScript's asynchronous APIs to notify Angular when async operations complete.

### Why Angular Needs Zone.js:

Without Zone.js, Angular wouldn't know when to check for changes:
- ❌ User clicks a button → Angular doesn't know
- ❌ `setTimeout()` completes → Angular doesn't know
- ❌ HTTP request finishes → Angular doesn't know
- ❌ Promise resolves → Angular doesn't know

**Zone.js patches these APIs:**
- `setTimeout`, `setInterval`
- `addEventListener` (DOM events)
- `XMLHttpRequest`, `fetch`
- `Promise.then()`, `Promise.catch()`
- And many more...

### How It Works:
```typescript
// Zone.js patches setTimeout
setTimeout(() => {
  this.counter++; // Zone.js detects this async operation
}, 1000);
// After setTimeout completes, Zone.js triggers Angular CD
```

### Monkey Patching Example:

Zone.js uses **monkey patching** - it replaces native JavaScript functions with its own versions that wrap the original functionality.

```typescript
// Original setTimeout (before Zone.js)
window.setTimeout = function(callback, delay) {
  // Native browser implementation
  return nativeSetTimeout(callback, delay);
};

// After Zone.js patches it:
window.setTimeout = function(callback, delay) {
  const zone = Zone.current; // Get current zone
  
  // Wrap callback to run in zone context
  const wrappedCallback = zone.wrap(callback, 'setTimeout');
  
  // Call original setTimeout
  const id = nativeSetTimeout(() => {
    // Zone.js intercepts the callback
    zone.run(wrappedCallback);
    // After callback, Zone.js can trigger Angular CD
  }, delay);
  
  return id;
};
```

### Real Example - How Zone.js Patches setTimeout:

```typescript
// What you write:
setTimeout(() => {
  this.counter++;
}, 1000);

// What actually happens (simplified):
// 1. Zone.js intercepts setTimeout call
// 2. Wraps your callback in zone.run()
// 3. Calls native setTimeout
// 4. When timeout fires, callback runs inside zone
// 5. Zone.js detects async operation completed
// 6. Triggers onMicrotaskEmpty
// 7. Angular runs change detection
```

### When Zone.js Doesn't Work:

Zone.js **cannot patch** certain APIs or scenarios. In these cases, Angular won't automatically detect changes:

#### 1. **IndexedDB Operations**

```typescript
// ❌ Zone.js doesn't patch IndexedDB
const request = indexedDB.open('myDB', 1);

request.onsuccess = () => {
  this.data = request.result; // Angular doesn't know about this change!
  // Must manually trigger CD:
  this.cdr.detectChanges();
  // OR
  this.appRef.tick();
};

request.onerror = () => {
  this.error = request.error;
  this.cdr.detectChanges(); // Manual CD required
};
```

#### 2. **WebSocket Events**

```typescript
// ❌ WebSocket callbacks aren't patched
const socket = new WebSocket('ws://example.com');

socket.onmessage = (event) => {
  this.message = event.data; // No automatic CD!
  this.cdr.detectChanges(); // Must manually trigger
};

socket.onopen = () => {
  this.connected = true;
  this.cdr.detectChanges(); // Manual CD required
};
```

#### 3. **Third-Party Library Callbacks**

```typescript
// ❌ Third-party libraries often bypass Zone.js
import { SomeLibrary } from 'third-party-lib';

const lib = new SomeLibrary();

lib.onDataReceived((data) => {
  this.data = data; // No automatic CD!
  this.cdr.detectChanges(); // Manual trigger needed
});
```

#### 4. **MutationObserver**

```typescript
// ⚠️ MutationObserver is patched, but callbacks run outside zone
const observer = new MutationObserver((mutations) => {
  // This callback runs, but might not trigger CD reliably
  this.mutations = mutations;
  this.cdr.detectChanges(); // Safer to manually trigger
});

observer.observe(element, { attributes: true });
```

#### 5. **requestAnimationFrame**

```typescript
// ⚠️ requestAnimationFrame is patched, but in some cases...
requestAnimationFrame(() => {
  // If called from outside Angular zone, won't trigger CD
  this.frameCount++;
  // Better to manually trigger if unsure
  this.cdr.detectChanges();
});
```

#### 6. **Code Running Outside Angular Zone**

```typescript
// ❌ Explicitly running outside zone
this.ngZone.runOutsideAngular(() => {
  setInterval(() => {
    this.counter++; // No automatic CD!
    // Must manually trigger
    this.ngZone.run(() => {
      // Now inside zone, but still need to trigger CD
      this.cdr.detectChanges();
    });
  }, 1000);
});
```

### Solutions When Zone.js Doesn't Work:

#### Option 1: Manual Change Detection
```typescript
import { ChangeDetectorRef } from '@angular/core';

constructor(private cdr: ChangeDetectorRef) {}

handleIndexedDB() {
  const request = indexedDB.open('myDB');
  request.onsuccess = () => {
    this.data = request.result;
    this.cdr.detectChanges(); // Manual trigger
  };
}
```

#### Option 2: ApplicationRef.tick()
```typescript
import { ApplicationRef } from '@angular/core';

constructor(private appRef: ApplicationRef) {}

handleWebSocket() {
  socket.onmessage = (event) => {
    this.message = event.data;
    this.appRef.tick(); // Full app CD
  };
}
```

#### Option 3: Run Inside Zone
```typescript
import { NgZone } from '@angular/core';

constructor(private ngZone: NgZone) {}

handleThirdPartyLib() {
  lib.onDataReceived((data) => {
    this.ngZone.run(() => {
      this.data = data; // Now inside zone
      // CD will trigger automatically
    });
  });
}
```

#### Option 4: Wrap in Observable
```typescript
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Convert WebSocket to Observable
const socket$ = fromEvent(websocket, 'message');

socket$.pipe(takeUntil(this.destroy$)).subscribe(event => {
  this.message = event.data; // Works with AsyncPipe or auto CD
});
```

### Complete Example - IndexedDB with Manual CD:

```typescript
import { Component, ChangeDetectorRef, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-data',
  template: `
    <div>
      <p>Data: {{ data }}</p>
      <button (click)="loadData()">Load from IndexedDB</button>
    </div>
  `
})
export class DataComponent implements OnDestroy {
  data: any = null;
  private db: IDBDatabase | null = null;

  constructor(private cdr: ChangeDetectorRef) {
    this.initDB();
  }

  initDB() {
    const request = indexedDB.open('myDB', 1);
    
    request.onsuccess = () => {
      this.db = request.result;
      // ❌ Zone.js doesn't patch this callback
      this.cdr.detectChanges(); // ✅ Manual CD required
    };
    
    request.onerror = () => {
      console.error('DB error:', request.error);
      this.cdr.detectChanges(); // ✅ Manual CD required
    };
  }

  loadData() {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['store'], 'readonly');
    const store = transaction.objectStore('store');
    const request = store.get(1);
    
    request.onsuccess = () => {
      this.data = request.result;
      // ❌ Zone.js doesn't patch IndexedDB callbacks
      this.cdr.detectChanges(); // ✅ Must manually trigger CD
    };
  }

  ngOnDestroy() {
    this.db?.close();
  }
}
```

### Summary - When Zone.js Works vs Doesn't:

| API/Scenario | Zone.js Patched? | Auto CD? | Solution |
|-------------|------------------|----------|----------|
| `setTimeout` / `setInterval` | ✅ Yes | ✅ Yes | Automatic |
| DOM Events (`click`, etc.) | ✅ Yes | ✅ Yes | Automatic |
| `Promise.then()` | ✅ Yes | ✅ Yes | Automatic |
| `fetch()` / `XMLHttpRequest` | ✅ Yes | ✅ Yes | Automatic |
| `async/await` | ✅ Yes | ✅ Yes | Automatic |
| **IndexedDB** | ❌ No | ❌ No | `detectChanges()` or `tick()` |
| **WebSocket** | ❌ No | ❌ No | `detectChanges()` or `tick()` |
| **Third-party callbacks** | ❌ Usually No | ❌ No | `detectChanges()` or `run()` |
| `requestAnimationFrame` | ⚠️ Partial | ⚠️ Sometimes | `detectChanges()` if unsure |
| `runOutsideAngular()` | ❌ Explicitly disabled | ❌ No | `run()` + `detectChanges()` |

**Key Point:** Zone.js creates a "zone" around your application and intercepts all async operations, then notifies Angular to run change detection. However, some APIs (like IndexedDB, WebSocket) aren't patched, requiring manual change detection triggers.

---

## 3. View, Root View, Mark Dirty, Dirty View

### What is a View?

A **View** is Angular's internal representation of a component and its template. Each component has one view.

```
Component Tree:
AppComponent (root view)
  └── ChildComponent (child view)
      └── GrandChildComponent (grandchild view)
```

### Root View

The **root view** is the topmost view in the component tree (usually your `AppComponent`).

### Mark Dirty / Dirty View

When a component's data changes, Angular **marks the view as dirty**:

```typescript
export class AppComponent {
  counter = 0;
  
  increment() {
    this.counter++; // This marks the view as "dirty"
  }
}
```

**Dirty View** = A view that has changes and needs to be checked/updated.

**Key Point:** Angular doesn't immediately update the DOM. It marks views as dirty and processes them during the next change detection cycle.

---

## 4. What Makes a Component Dirty?

A component becomes dirty when:

### 1. **Input Properties Change** (for OnPush components)
```typescript
@Input() data: string;
// When parent changes this.data, component becomes dirty
```

### 2. **Events from Component or Children**
```typescript
@HostListener('click')
onClick() {
  this.counter++; // Marks component dirty
}
```

### 3. **Component Output Events** (@Output)
```typescript
// Child Component
@Output() dataChanged = new EventEmitter<string>();

updateData() {
  this.dataChanged.emit('new value'); // Marks child component dirty
}
```

```typescript
// Parent Component
onDataChanged(value: string) {
  this.data = value; // Marks parent component dirty
}
```

```html
<!-- Parent Template -->
<app-child (dataChanged)="onDataChanged($event)"></app-child>
```

**Key Point:** When a child component emits an output event, the parent's event handler runs, which marks the parent component as dirty. The child component itself is also marked dirty when the output is emitted.

### 4. **Observable Emissions** (with AsyncPipe)
```typescript
data$ = new BehaviorSubject(0);
// In template: {{ data$ | async }}
// When observable emits, component becomes dirty
```

### 5. **Manual Marking** (for OnPush)
```typescript
constructor(private cdr: ChangeDetectorRef) {}

update() {
  this.data = 'new';
  this.cdr.markForCheck(); // Manually mark as dirty
}
```

### 6. **ApplicationRef.tick()** (forces all views dirty)

**Key Point:** In Default strategy, Angular checks ALL components. In OnPush, only dirty components are checked.

---

## 5. How Angular Runs tick()

`tick()` is Angular's change detection cycle that checks and updates dirty views.

### The Process:

```
1. Zone.js detects async operation completes
   ↓
2. Zone.js emits onMicrotaskEmpty event (subscription fires)
   ↓
3. Angular's ApplicationRef.tick() is triggered
   ↓
4. Angular traverses component tree (top to bottom)
   ↓
5. For each component:
   - Check if view is dirty (or Default strategy)
   - Compare old vs new values
   - Update DOM if changed
   ↓
6. Clear dirty flags
```

### Internal Flow:

```typescript
// Simplified Angular internal code
function tick() {
  // 1. Get root view
  const rootView = getRootView();
  
  // 2. Traverse tree
  checkAndUpdateView(rootView);
  
  // 3. For each view
  function checkAndUpdateView(view) {
    if (view.isDirty || strategy === Default) {
      // Check bindings
      updateBindings(view);
      
      // Update DOM
      updateDOM(view);
      
      // Check children
      view.children.forEach(child => {
        checkAndUpdateView(child);
      });
    }
  }
}
```

**Key Point:** `tick()` runs synchronously and checks the entire component tree from root to leaves.

---

## 5.5. Compiled Components and Change Detection

Angular compiles your components into optimized JavaScript code that includes change detection logic directly in the compiled output.

### How Angular Compiles Components

When Angular compiles a component, it:
1. **Analyzes the template** and creates binding instructions
2. **Generates update functions** that check and update bindings
3. **Embeds change detection logic** directly in the compiled code

### Source Component Example:

```typescript
@Component({
  selector: 'app-counter',
  template: `
    <div>
      <p>Count: {{ counter }}</p>
      <button (click)="increment()">Increment</button>
      <p>Name: {{ name }}</p>
    </div>
  `
})
export class CounterComponent {
  counter = 0;
  name = 'Angular';
  
  increment() {
    this.counter++;
  }
}
```

### Compiled Component (Simplified):

Angular compiles this into something like:

```typescript
// Simplified compiled output
export class CounterComponent {
  counter = 0;
  name = 'Angular';
  
  increment() {
    this.counter++;
  }
  
  // Generated by Angular compiler
  static ɵcmp = ɵɵdefineComponent({
    type: CounterComponent,
    selectors: [['app-counter']],
    decls: 4, // Number of DOM nodes
    vars: 2,  // Number of bindings
    template: function CounterComponent_Template(rf, ctx) {
      // rf = RenderFlags (Create or Update)
      // ctx = Component context (this)
      
      if (rf & RenderFlags.Create) {
        // Create DOM structure
        ɵɵelementStart(0, 'div');
        ɵɵelementStart(1, 'p');
        ɵɵtext(2); // Text node for {{ counter }}
        ɵɵelementEnd();
        ɵɵelementStart(3, 'button');
        ɵɵlistener('click', function() { return ctx.increment(); });
        ɵɵtext(4, 'Increment');
        ɵɵelementEnd();
        ɵɵelementStart(5, 'p');
        ɵɵtext(6); // Text node for {{ name }}
        ɵɵelementEnd();
        ɵɵelementEnd();
      }
      
      if (rf & RenderFlags.Update) {
        // Update bindings - THIS IS CHANGE DETECTION
        ɵɵadvance(2); // Move to counter text node
        ɵɵtextInterpolate1('Count: ', ctx.counter, '');
        
        ɵɵadvance(4); // Move to name text node
        ɵɵtextInterpolate1('Name: ', ctx.name, '');
      }
    },
    // Change detection function
    detectChangesInternal: function(rf, ctx) {
      if (rf & RenderFlags.Update) {
        // Check if component is dirty or uses Default strategy
        if (this.cdState & ChangeDetectorStatus.CheckAlways) {
          // Run update function
          this.template(rf, ctx);
        }
      }
    }
  });
}
```

### How Change Detection Fires in Compiled Code:

#### 1. **Initial Render (Create Phase):**

```typescript
// First render - Create phase
function renderComponent(component) {
  const view = createView(component);
  // RenderFlags.Create = 1
  component.ɵcmp.template(RenderFlags.Create, component);
  // DOM is created
}
```

#### 2. **Update Phase (Change Detection):**

```typescript
// Subsequent renders - Update phase
function checkAndUpdateComponent(view) {
  const component = view.component;
  
  // Check if component needs update
  if (view.state & ViewState.CheckAlways || 
      view.state & ViewState.Dirty) {
    
    // RenderFlags.Update = 2
    component.ɵcmp.template(RenderFlags.Update, component);
    // Bindings are checked and DOM updated
  }
}
```

### Binding Update Mechanism:

```typescript
// When counter changes from 0 to 1:

// 1. Property update
this.counter = 1; // Component property changes

// 2. During tick(), Angular calls:
component.ɵcmp.template(RenderFlags.Update, component);

// 3. Inside template function:
if (rf & RenderFlags.Update) {
  ɵɵadvance(2); // Navigate to counter text node
  ɵɵtextInterpolate1('Count: ', ctx.counter, '');
  // ↑ This compares old value (0) with new value (1)
  // ↑ If different, updates DOM text node
}
```

### Change Detection in Action:

```typescript
// Simplified flow when button is clicked:

// 1. User clicks button
button.addEventListener('click', () => {
  // 2. Event handler executes
  component.increment(); // counter: 0 → 1
  
  // 3. Zone.js detects event completion
  // 4. onMicrotaskEmpty fires
  // 5. ApplicationRef.tick() runs
  
  // 6. For each component, Angular calls:
  checkAndUpdateView(componentView);
  
  // 7. Inside checkAndUpdateView:
  if (needsCheck(componentView)) {
    // 8. Call compiled template with Update flag
    component.ɵcmp.template(
      RenderFlags.Update,  // Update mode
      component            // Component instance (ctx)
    );
    
    // 9. Inside template function:
    // - Compare old counter (0) vs new counter (1)
    // - Update DOM: textContent = "Count: 1"
  }
});
```

### Property Binding Example:

```typescript
// Source template:
<p [class.active]="isActive">{{ message }}</p>

// Compiled update function (simplified):
if (rf & RenderFlags.Update) {
  // Check isActive binding
  ɵɵadvance(0); // Move to <p> element
  ɵɵclassProp('active', ctx.isActive); // Update class
  
  // Check message binding
  ɵɵadvance(1); // Move to text node
  ɵɵtextInterpolate(ctx.message); // Update text
}
```

### Event Binding Example:

```typescript
// Source template:
<button (click)="handleClick()">Click</button>

// Compiled code:
ɵɵelementStart(0, 'button');
ɵɵlistener('click', function($event) {
  return ctx.handleClick();
});
ɵɵtext(1, 'Click');
ɵɵelementEnd();
```

### OnPush Strategy in Compiled Code:

```typescript
// OnPush component compiled differently:

static ɵcmp = ɵɵdefineComponent({
  // ... other properties
  onPush: true, // Change detection strategy
  
  detectChangesInternal: function(rf, ctx) {
    // Only update if explicitly dirty
    if (this.cdState & ChangeDetectorStatus.Dirty ||
        this.cdState & ChangeDetectorStatus.CheckOnce) {
      this.template(RenderFlags.Update, ctx);
      // Clear dirty flag after check
      this.cdState &= ~ChangeDetectorStatus.Dirty;
    }
  }
});
```

### Key Points:

1. **Compiled templates are functions** that take `RenderFlags` and component context
2. **Create phase** (first render) builds DOM structure
3. **Update phase** (change detection) compares and updates bindings
4. **Bindings are checked individually** - Angular knows exactly which bindings to check
5. **OnPush optimization** is built into the compiled code
6. **Change detection is embedded** - no runtime interpretation needed

### Performance Benefits:

- ✅ **No template parsing at runtime** - templates are pre-compiled
- ✅ **Direct property access** - no reflection needed
- ✅ **Optimized binding checks** - only changed bindings are updated
- ✅ **Tree-shakeable** - unused code is eliminated

**Key Point:** Angular's compiler embeds change detection logic directly into your component code, making it highly optimized. The compiled code knows exactly which bindings to check and how to update them efficiently.

---

## 6. ZoneJS onMicrotaskEmpty

`onMicrotaskEmpty` is a Zone.js observable/event emitter that emits when the microtask queue is empty.

### What are Microtasks?

Microtasks include:
- Promise callbacks
- `queueMicrotask()`
- MutationObserver callbacks

### How Angular Uses It:

```typescript
// Angular's internal setup (simplified)
NgZone.onMicrotaskEmpty.subscribe(() => {
  // All microtasks are done
  // Safe to run change detection
  ApplicationRef.tick();
});
```

### Example Flow:

```typescript
// 1. User clicks button
button.addEventListener('click', () => {
  // 2. Event handler runs (microtask)
  this.counter++;
  
  // 3. setTimeout (macrotask, not microtask)
  setTimeout(() => {
    this.name = 'Updated';
  }, 0);
});

// 4. After all microtasks complete
// → onMicrotaskEmpty subscription fires
// → Angular runs tick()
```

**Key Point:** Angular waits for microtasks to complete before running change detection to ensure all synchronous updates are done.

---

## 7. applicationRef.tick()

`ApplicationRef.tick()` manually triggers a change detection cycle.

### When to Use:

- **Outside Angular Zone:** When code runs outside Zone.js
- **Testing:** To manually trigger CD in tests
- **Third-party Libraries:** When libraries don't trigger CD automatically

### Example:

```typescript
import { ApplicationRef } from '@angular/core';

constructor(private appRef: ApplicationRef) {}

updateOutsideZone() {
  // This runs outside Angular zone
  setTimeout(() => {
    this.counter++;
    // Angular doesn't know about this change
    // Manually trigger CD
    this.appRef.tick();
  });
}
```

### vs Zone.js Automatic:

```typescript
// Automatic (inside zone)
setTimeout(() => {
  this.counter++; // Zone.js triggers CD automatically
}, 1000);

// Manual (outside zone)
this.ngZone.runOutsideAngular(() => {
  setTimeout(() => {
    this.counter++; // No automatic CD
    this.appRef.tick(); // Must manually trigger
  }, 1000);
});
```

**Key Point:** `tick()` forces a full change detection cycle immediately, bypassing Zone.js's automatic triggering.

---

## 7.5. ChangeDetectorRef.detectChanges()

`ChangeDetectorRef.detectChanges()` immediately runs change detection **only for the current component and its children**, without waiting for Zone.js or the next tick cycle.

### When to Use:

- **Immediate Updates:** When you need instant DOM updates
- **Performance Optimization:** To check specific component without full tree traversal
- **Outside Zone:** When code runs outside Angular zone
- **Testing:** To verify component state in tests

### Example:

```typescript
import { ChangeDetectorRef } from '@angular/core';

constructor(private cdr: ChangeDetectorRef) {}

updateData() {
  this.data = 'updated';
  // Without detectChanges(), update might not show immediately
  this.cdr.detectChanges(); // Forces immediate CD for this component
}
```

### detectChanges() vs markForCheck():

```typescript
// markForCheck() - Marks as dirty, waits for next tick()
this.cdr.markForCheck();
// Component will be checked in next change detection cycle

// detectChanges() - Immediately checks this component
this.cdr.detectChanges();
// Component is checked RIGHT NOW
```

### detectChanges() vs ApplicationRef.tick():

```typescript
// ApplicationRef.tick() - Checks ENTIRE component tree
this.appRef.tick();
// All components in the app are checked

// detectChanges() - Checks ONLY this component + children
this.cdr.detectChanges();
// Only this component and its children are checked
```

### With OnPush Strategy:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnPushComponent {
  constructor(private cdr: ChangeDetectorRef) {}
  
  update() {
    this.data = 'new';
    // OnPush won't check automatically
    this.cdr.detectChanges(); // Force immediate check
  }
}
```

### Common Use Cases:

**1. Third-party Library Integration:**
```typescript
ngAfterViewInit() {
  // Third-party library updates DOM
  this.chart.update();
  // Angular doesn't know about the change
  this.cdr.detectChanges(); // Sync Angular's view
}
```

**2. WebSocket Updates:**
```typescript
this.socket.on('message', (data) => {
  this.messages.push(data);
  // Runs outside Angular zone
  this.cdr.detectChanges(); // Update immediately
});
```

**3. Performance Optimization:**
```typescript
// Instead of checking entire app
this.appRef.tick(); // Checks all components

// Check only this component
this.cdr.detectChanges(); // Checks only this + children
```

**Key Point:** `detectChanges()` runs change detection immediately for the current component and its children, while `tick()` checks the entire application. Use `detectChanges()` when you need immediate, localized updates.

---

## 8. OnPush vs Default Strategy

### Default Strategy (CheckAlways)

```typescript
@Component({
  selector: 'app-child',
  // No changeDetection specified = Default
})
```

**Behavior:**
- ✅ Checks component on **every** change detection cycle
- ✅ Checks even if no inputs changed
- ✅ Checks even if no events occurred
- ⚠️ Less performant for large apps

**When it checks:**
- Every async operation (click, setTimeout, HTTP, etc.)
- Every `tick()` call

### OnPush Strategy (CheckOnce)

```typescript
@Component({
  selector: 'app-child',
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

**Behavior:**
- ✅ Checks component **only when:**
  - Input reference changes
  - Event from component or its children
  - Observable emits (with AsyncPipe)
  - `markForCheck()` called
- ✅ Much more performant
- ⚠️ Requires careful data management

### Comparison Example:

```typescript
// Parent Component
export class ParentComponent {
  data = { value: 1 };
  
  updateSibling() {
    // This updates a sibling component
    this.siblingData++;
  }
}

// Child with Default
@Component({
  selector: 'app-child-default',
  // Default strategy
})
export class ChildDefaultComponent {
  @Input() data: any;
  // ✅ Will be checked even if data didn't change
}

// Child with OnPush
@Component({
  selector: 'app-child-onpush',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChildOnPushComponent {
  @Input() data: any;
  // ❌ Won't be checked if data reference is same
  // ✅ Will be checked if data reference changes
}
```

### When to Use OnPush:

✅ Use OnPush when:
- Component receives data via `@Input()`
- Data is immutable
- Performance is critical

❌ Avoid OnPush when:
- Component frequently mutates internal state
- You're not comfortable with immutability

**Key Point:** OnPush is an optimization that skips change detection unless specific conditions are met.

---

## 9. Async Pipe

The **AsyncPipe** subscribes to Observables/Promises and automatically triggers change detection when values emit.

### How It Works:

```typescript
// Component
export class AppComponent {
  data$ = new BehaviorSubject<string>('Initial');
  
  update() {
    this.data$.next('Updated');
  }
}
```

```html
<!-- Template -->
<p>{{ data$ | async }}</p>
```

### What AsyncPipe Does:

1. **Subscribes** to the observable
2. **Marks component dirty** when value emits
3. **Unsubscribes** automatically on destroy
4. **Triggers change detection** for OnPush components

### With OnPush:

```typescript
@Component({
  selector: 'app-child',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChildComponent {
  @Input() data$: Observable<string>;
}
```

```html
<!-- AsyncPipe makes OnPush work with observables -->
<p>{{ data$ | async }}</p>
```

**Without AsyncPipe:**
```typescript
// Manual subscription (not recommended)
ngOnInit() {
  this.data$.subscribe(value => {
    this.data = value;
    this.cdr.markForCheck(); // Must manually mark
  });
}
```

**With AsyncPipe:**
```html
<!-- Automatic -->
<p>{{ data$ | async }}</p>
```

### Benefits:

✅ Automatic subscription management  
✅ Automatic change detection triggering  
✅ Works with OnPush strategy  
✅ No memory leaks (auto-unsubscribe)

**Key Point:** AsyncPipe is the recommended way to handle observables in templates, especially with OnPush strategy.

---

## Summary: Change Detection Flow

```
1. Async Operation Occurs (click, setTimeout, HTTP, etc.)
   ↓
2. Zone.js Detects It
   ↓
3. onMicrotaskEmpty Subscription Fires
   ↓
4. Angular's ApplicationRef.tick() Runs
   ↓
5. Angular Traverses Component Tree (Root → Leaves)
   ↓
6. For Each Component:
   - Default Strategy: Always Check
   - OnPush Strategy: Check if Dirty
   ↓
7. Compare Old vs New Values
   ↓
8. Update DOM if Changed
   ↓
9. Clear Dirty Flags
```

---

## Quick Reference

| Concept | Description |
|--------|-------------|
| **Change Detection** | Angular's mechanism to detect data changes and update DOM |
| **Zone.js** | Patches async APIs to notify Angular of changes |
| **View** | Internal representation of component + template |
| **Dirty View** | View that has changes and needs checking |
| **tick()** | Change detection cycle that checks/updates views |
| **Default Strategy** | Checks component on every CD cycle |
| **OnPush Strategy** | Checks component only when specific conditions met |
| **AsyncPipe** | Automatically handles observables and triggers CD |
| **markForCheck()** | Manually mark OnPush component as dirty |
| **detectChanges()** | Immediately run CD for current component + children |
| **@Output** | Component output events mark parent component as dirty |
| **Compiled Components** | Angular compiles templates into optimized CD functions |
| **Monkey Patching** | Zone.js replaces native APIs with wrapped versions |
| **IndexedDB/WebSocket** | Not patched by Zone.js - requires manual CD |

---

## Practice Exercises

1. Create a component with Default strategy and observe when it's checked
2. Convert it to OnPush and see when checks stop
3. Use `markForCheck()` to manually trigger OnPush components
4. Compare performance: Default vs OnPush with many components
5. Use AsyncPipe with OnPush components
6. Run code outside Zone.js and use `tick()` manually
7. Use `detectChanges()` to update a single component immediately
8. Test component output events and observe when parent becomes dirty
9. Inspect compiled component code (use Angular DevTools or build with source maps) to see how CD is embedded
10. Create a component that uses IndexedDB or WebSocket and observe when manual CD is required
11. Compare automatic CD (with Zone.js) vs manual CD (detectChanges/tick) in different scenarios

---

**Version:** Angular 16.2.0 with Zone.js 0.13.0
