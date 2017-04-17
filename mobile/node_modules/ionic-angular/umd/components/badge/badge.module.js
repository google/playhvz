(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@angular/core", "./badge"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core_1 = require("@angular/core");
    var badge_1 = require("./badge");
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
    BadgeModule.decorators = [
        { type: core_1.NgModule, args: [{
                    declarations: [
                        badge_1.Badge
                    ],
                    exports: [
                        badge_1.Badge
                    ]
                },] },
    ];
    /**
     * @nocollapse
     */
    BadgeModule.ctorParameters = function () { return []; };
    exports.BadgeModule = BadgeModule;
    function BadgeModule_tsickle_Closure_declarations() {
        /** @type {?} */
        BadgeModule.decorators;
        /**
         * @nocollapse
         * @type {?}
         */
        BadgeModule.ctorParameters;
    }
});
//# sourceMappingURL=badge.module.js.map