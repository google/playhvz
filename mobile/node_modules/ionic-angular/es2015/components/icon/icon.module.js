import { NgModule } from '@angular/core';
import { Icon } from './icon';
/**
 * @hidden
 */
export class IconModule {
    /**
     * @return {?}
     */
    static forRoot() {
        return {
            ngModule: IconModule, providers: []
        };
    }
}
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
IconModule.ctorParameters = () => [];
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