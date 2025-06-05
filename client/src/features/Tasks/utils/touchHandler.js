// Touch handler for mobile drag and drop functionality
// This replaces react-dnd for mobile devices since react-dnd doesn't work well with touch
// TODO: this file is actually not used anywhere. it was part of the reponsive task board improvements. cc cursor chat named "improve mobile reponsiveness for dashboard"

export class TouchHandler {
  constructor() {
    this.isDragging = false;
    this.dragElement = null;
    this.dragData = null;
    this.placeholder = null;
    this.offset = { x: 0, y: 0 };
    this.callbacks = {};
  }

  // Register callbacks
  onDragStart(callback) {
    this.callbacks.onDragStart = callback;
  }

  onDragMove(callback) {
    this.callbacks.onDragMove = callback;
  }

  onDragEnd(callback) {
    this.callbacks.onDragEnd = callback;
  }

  // Initialize touch events for a draggable element
  makeDraggable(element, data) {
    element.addEventListener(
      "touchstart",
      (e) => this.handleTouchStart(e, element, data),
      { passive: false }
    );
    element.addEventListener("touchmove", (e) => this.handleTouchMove(e), {
      passive: false,
    });
    element.addEventListener("touchend", (e) => this.handleTouchEnd(e), {
      passive: false,
    });
  }

  handleTouchStart(e, element, data) {
    if (e.touches.length !== 1) return;

    e.preventDefault();

    const touch = e.touches[0];
    const rect = element.getBoundingClientRect();

    this.isDragging = true;
    this.dragElement = element;
    this.dragData = data;
    this.offset = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };

    // Create visual feedback
    element.style.opacity = "0.5";
    element.style.transform = "scale(1.05)";
    element.style.zIndex = "1000";

    // Create placeholder
    this.createPlaceholder(element);

    // Callback
    if (this.callbacks.onDragStart) {
      this.callbacks.onDragStart(data, {
        x: touch.clientX,
        y: touch.clientY,
      });
    }
  }

  handleTouchMove(e) {
    if (!this.isDragging) return;

    e.preventDefault();

    const touch = e.touches[0];

    // Move the dragged element
    if (this.dragElement) {
      this.dragElement.style.position = "fixed";
      this.dragElement.style.left = `${touch.clientX - this.offset.x}px`;
      this.dragElement.style.top = `${touch.clientY - this.offset.y}px`;
      this.dragElement.style.pointerEvents = "none";
    }

    // Find drop target
    const dropTarget = this.findDropTarget(touch.clientX, touch.clientY);

    // Update placeholder position
    if (dropTarget && this.placeholder) {
      dropTarget.appendChild(this.placeholder);
    }

    // Callback
    if (this.callbacks.onDragMove) {
      this.callbacks.onDragMove(this.dragData, {
        x: touch.clientX,
        y: touch.clientY,
        dropTarget,
      });
    }
  }

  handleTouchEnd(e) {
    if (!this.isDragging) return;

    const touch = e.changedTouches[0];
    const dropTarget = this.findDropTarget(touch.clientX, touch.clientY);

    // Reset element styles
    if (this.dragElement) {
      this.dragElement.style.opacity = "";
      this.dragElement.style.transform = "";
      this.dragElement.style.zIndex = "";
      this.dragElement.style.position = "";
      this.dragElement.style.left = "";
      this.dragElement.style.top = "";
      this.dragElement.style.pointerEvents = "";
    }

    // Remove placeholder
    this.removePlaceholder();

    // Callback
    if (this.callbacks.onDragEnd) {
      this.callbacks.onDragEnd(this.dragData, dropTarget);
    }

    // Reset state
    this.isDragging = false;
    this.dragElement = null;
    this.dragData = null;
    this.offset = { x: 0, y: 0 };
  }

  createPlaceholder(element) {
    this.placeholder = document.createElement("div");
    this.placeholder.className =
      "touch-drag-placeholder bg-muted border-2 border-dashed border-primary/50 rounded-lg";
    this.placeholder.style.height = `${element.offsetHeight}px`;
    this.placeholder.style.margin = "8px 0";
    this.placeholder.innerHTML =
      '<div class="flex items-center justify-center h-full text-muted-foreground text-sm">Drop here</div>';

    // Insert placeholder after the original element
    element.parentNode.insertBefore(this.placeholder, element.nextSibling);
  }

  removePlaceholder() {
    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.parentNode.removeChild(this.placeholder);
      this.placeholder = null;
    }
  }

  findDropTarget(x, y) {
    // Find task columns that can accept drops
    const columns = document.querySelectorAll("[data-column-id]");

    for (let column of columns) {
      const rect = column.getBoundingClientRect();
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        return column;
      }
    }

    return null;
  }

  // Clean up event listeners
  destroy() {
    this.callbacks = {};
    this.removePlaceholder();
  }
}

// Singleton instance
export const touchHandler = new TouchHandler();
