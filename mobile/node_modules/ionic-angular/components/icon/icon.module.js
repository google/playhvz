import { NgModule } from '@angular/core';
import { Icon } from './icon';
/**
 * @hidden
 */
var IconModule = (function () {
    function IconModule() {
    }
    /**
     * @return {?}
     */
    IconModule.forRoot = function () {
        return {
            ngModule: IconModule, providers: []
        };
    };
    return IconModule;
}());
export { IconModule };
IconModule.decorators = [
    { type: NgModule, args: [{
                declarations: [
                    Icon
                ],
                exports: [
                    Icon
                ]
            },] },
];
/**
 * @nocollapse
 */
IconModule.ctorParameters = function () { return []; };
function IconModule_tsickle_Closure_declarations() {
    /** @type {?} */
    IconModule.decorators;
    /**
     * @nocollapse
     * @type {?}
     */
    IconModule.ctorParameters;
}
//# sourceMappingURL=icon.module.js.map