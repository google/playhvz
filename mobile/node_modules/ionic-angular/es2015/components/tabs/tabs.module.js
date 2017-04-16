import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BadgeModule } from '../badge/badge.module';
import { IconModule } from '../icon/icon.module';
import { Tab } from './tab';
import { TabButton } from './tab-button';
import { TabHighlight } from './tab-highlight';
import { Tabs } from './tabs';
/**
 * @hidden
 */
export class TabsModule {
    /**
     * @return {?}
     */
    static forRoot() {
        return {
            ngModule: TabsModule, providers: []
        };
    }
}
TabsModule.decorators = [
    { type: NgModule, args: [{
                imports: [
                    BadgeModule,
                    CommonModule,
                    IconModule
                ],
                declarations: [
                    Tab,
                    TabButton,
                    TabHighlight,
                    Tabs
                ],
                exports: [
                    Tab,
                    TabButton,
                    TabHighlight,
                    Tabs
                ]
            },] },
];
/**
 * @nocollapse
 */
TabsModule.ctorParameters = () => [];
function TabsModule_tsickle_Closure_declarations() {
    /** @type {?} */
    TabsModule.decorators;
    /**
     * @nocollapse
     * @type {?}
     */
    TabsModule.ctorParameters;
}
//# sourceMappingURL=tabs.module.js.map