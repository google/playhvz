(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@angular/core", "./icon"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core_1 = require("@angular/core");
    var icon_1 = require("./icon");
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
    IconModule.decorators = [
        { type: core_1.NgModule, args: [{
                    declarations: [
                        icon_1.Icon
                    ],
                    exports: [
                        icon_1.Icon
                    ]
                },] },
    ];
    /**
     * @nocollapse
     */
    IconModule.ctorParameters = function () { return []; };
    exports.IconModule = IconModule;
    function IconModule_tsickle_Closure_declarations() {
        /** @type {?} */
        IconModule.decorators;
        /**
         * @nocollapse
         * @type {?}
         */
        IconModule.ctorParameters;
    }
});
//# sourceMappingURL=icon.module.js.map