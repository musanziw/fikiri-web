import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly _onDismiss: ReplaySubject<string> = new ReplaySubject<string>(1);
  private readonly _onShow: ReplaySubject<string> = new ReplaySubject<string>(1);

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Getter for onDismiss
   */
  get onDismiss() {
    return this._onDismiss.asObservable();
  }

  /**
   * Getter for onShow
   */
  get onShow() {
    return this._onShow.asObservable();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Dismiss the alert
   *
   * @param name
   */
  dismiss(name: string): void {
    // Return if the name is not provided
    if (!name) {
      return;
    }

    // Execute the observable
    this._onDismiss.next(name);
  }

  /**
   * Show the dismissed alert
   *
   * @param name
   */
  show(name: string): void {
    // Return if the name is not provided
    if (!name) {
      return;
    }

    // Execute the observable
    this._onShow.next(name);
  }
}
