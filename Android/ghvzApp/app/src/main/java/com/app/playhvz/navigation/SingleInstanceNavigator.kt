/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.app.playhvz.navigation

import android.content.Context
import android.os.Bundle
import androidx.fragment.app.FragmentManager
import androidx.navigation.NavDestination
import androidx.navigation.NavOptions
import androidx.navigation.Navigator
import androidx.navigation.fragment.FragmentNavigator

/**
 *  Custom navigator class that reuses a fragment if it's already created instead of creating a new
 *  one. Without this class (aka using the default FragmentNavigator) unexpected things happen.
 *
 *  Namely, on rotation or on activity recreation when the app is resumed:
 *   1. The fragment that was shown calls all it's lifecycle methods
 *   2. That old fragment is destroyed
 *   3. A new fragment is created.
 *   That's bad behavior for us because we're counting on observers only being set up once. When
 *   onCreate() or onCreateView() is called twice we skip creating the firebase observers the second
 *   time because we see that we're already observing the data after the first call... only thing is
 *   the first fragment is destroyed, so effectively we aren't actually listening.
 *
 *   This class checks the fragment we're trying to navigate to. If it matches the fragment we're
 *   already showing then we just reuse that fragment instance. This ensures that onCreate() etc
 *   will only be called once and every fragment can only have one instance on the stack.
 *
 *   During development you can easily test/recreate issues by using the Android Developer setting
 *   for "Don't keep activities".
 */
@Navigator.Name("single_instance_fragment") // name used in xml
class SingleInstanceNavigator(
    private val context: Context,
    private val manager: FragmentManager,
    private val containerId: Int
) : FragmentNavigator(context, manager, containerId) {

    override fun navigate(
        destination: Destination,
        args: Bundle?,
        navOptions: NavOptions?,
        navigatorExtras: Navigator.Extras?
    ): NavDestination? {
        val destinationTag = destination.className
        val tr = manager.beginTransaction()

        var initialNavigate = false
        val currentFragment = manager.primaryNavigationFragment
        if (currentFragment != null && destination.className.equals(currentFragment.javaClass.name)) {
            // The fragment that's currently displayed is the same fragment we're trying to navigate
            // to. So that lifecycle methods aren't called twice, make sure to detach the existing
            // fragment and only use the new instance we're about to create. Note that we only want
            // to detach the fragment if it's the *same*, otherwise we'll mess up backstack
            // navigation by prematurely "popping" a valid fragment from the stack.
            tr.detach(currentFragment)
        } else {
            initialNavigate = true
        }

        val fragment = manager.findFragmentByTag(destinationTag)
        if (fragment == null) {
            // We're creating the fragment for the first time so use the super class method so that
            // back navigation, animations, action bar titles, etc are done correctly.
            tr.commitNow() // pop old fragment if necessary, otherwise no-op
            return super.navigate(destination, args, navOptions, navigatorExtras)
        } else {
            tr.attach(fragment)
        }

        tr.setPrimaryNavigationFragment(fragment)
        tr.setReorderingAllowed(true)
        tr.commitNow()

        return if (initialNavigate) {
            destination
        } else {
            null
        }
    }
}