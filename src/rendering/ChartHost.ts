/** Recognize HTML hosts across windows without accessing browser globals at import time. */
export class ChartHost {
  private constructor() {}

  public static isElement(value: unknown): value is HTMLElement {
    if (!value || typeof value !== 'object') {
      return false;
    }
    if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
      return true;
    }
    const elementType = (value as HTMLElement).ownerDocument?.defaultView?.HTMLElement;
    return elementType !== undefined && value instanceof elementType;
  }
}
