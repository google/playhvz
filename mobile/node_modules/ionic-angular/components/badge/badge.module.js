import { NgModule } from '@angular/core';
import { Badge } from './badge';
/**
 * @hidden
 */
var BadgeModule = (function () {
    function BadgeModule() {
    }
    /**
     * @return {?}
     */
    BadgeModule.forRoot = function () {
        return {
            ngModule: BadgeModule, providers: []
        };
    };
    return BadgeModule;
}());
export { BadgeModule };
BadgeModule.decorators = [
    { type: NgModule, args: [{
                declarations: [
                    Badge
                ],
                exports: [
                    Badge
                ]
            },] },
];
/**
 * @nocollapse
 */
BadgeModule.ctorParameters = function () { return []; };
function BadgeModule_tsickle_Closure_declarations() {
    /** @type {?} */
    BadgeModule.decorators;
    /**
     * @nocollapse
     * @type {?}
     */
    BadgeModule.ctorParameters;
}
//# sourceMappingURL=badge.module.js.map