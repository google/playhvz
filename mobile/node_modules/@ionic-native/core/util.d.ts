/**
 * @private
 */
export declare function get(obj: any, path: any): any;
/**
 * @private
 */
export declare function getPromise(cb: any): Promise<{}>;
/**
 * @private
 * @param pluginRef
 * @returns {null|*}
 */
export declare function getPlugin(pluginRef: string): any;
/**
 * @private
 */
export declare const pluginWarn: (pluginName: string, plugin?: string, method?: string) => void;
/**
 * @private
 * @param pluginName
 * @param method
 */
export declare const cordovaWarn: (pluginName: string, method?: string) => void;
