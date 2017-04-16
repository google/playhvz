import { CordovaOptions } from './decorators';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
/**
 * Checks if plugin/cordova is available
 * @return {boolean | { error: string } }
 * @private
 */
export declare function checkAvailability(pluginRef: string, methodName?: string, pluginName?: string): any;
export declare function checkAvailability(pluginObj: any, methodName?: string, pluginName?: string): any;
/**
 * Checks if _objectInstance exists and has the method/property
 * @private
 */
export declare function instanceAvailability(pluginObj: any, methodName?: string): boolean;
/**
 * Wrap the event with an observable
 * @private
 * @param event even name
 * @param element The element to attach the event listener to
 * @returns {Observable}
 */
export declare function wrapEventObservable(event: string, element?: any): Observable<any>;
/**
 * Certain plugins expect the user to override methods in the plugin. For example,
 * window.cordova.plugins.backgroundMode.onactivate = function() { ... }.
 *
 * Unfortunately, this is brittle and would be better wrapped as an Observable. overrideFunction
 * does just this.
 * @private
 */
export declare function overrideFunction(pluginObj: any, methodName: string, args: any[], opts?: any): Observable<any>;
/**
 * @private
 */
export declare const wrap: (pluginObj: any, methodName: string, opts?: CordovaOptions) => (...args: any[]) => any;
/**
 * @private
 */
export declare function wrapInstance(pluginObj: any, methodName: string, opts?: any): (...args: any[]) => any;
