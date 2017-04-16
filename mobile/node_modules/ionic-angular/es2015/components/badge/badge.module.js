import { NgModule } from '@angular/core';
import { Badge } from './badge';
/**
 * @hidden
 */
export class BadgeModule {
    /**
     * @return {?}
     */
    static forRoot() {
        return {
            ngModule: BadgeModule, providers: []
        };
    }
}
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
BadgeModule.ctorParameters = () => [];
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