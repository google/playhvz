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

package com.app.playhvz.screens.quiz

import android.view.MenuInflater
import android.view.MenuItem
import android.view.View
import androidx.appcompat.widget.PopupMenu
import com.app.playhvz.R
import com.app.playhvz.common.globals.CrossClientConstants.Companion.QUIZ_BLANK_ORDER

class OrderingController(
    val overflowButton: View,
    val menuLayout: Int,
    val canRemoveOrder: Boolean,
    val onChangeOrder: (position: Int, modification: OrderModification) -> Unit?,
    val onOtherItemSelected: (adapterPosition: Int, menuItemId: Int) -> Boolean
) {

    enum class OrderModification {
        MOVE_UP,
        REMOVE,
        MOVE_DOWN
    }

    private var adapterPosition = QUIZ_BLANK_ORDER
    private var currentOrder = QUIZ_BLANK_ORDER
    private var isLast = false

    init {
        overflowButton.setOnClickListener {
            triggerOverflowPopup()
        }
    }

    fun onBind(adapterPosition: Int, currentOrder: Int, isLast: Boolean) {
        this.adapterPosition = adapterPosition
        this.currentOrder = currentOrder
        this.isLast = isLast
    }

    private fun triggerOverflowPopup() {
        val popup = PopupMenu(overflowButton.context, overflowButton)
        val inflater: MenuInflater = popup.menuInflater
        inflater.inflate(menuLayout, popup.menu)
        if (currentOrder == 0 || currentOrder == QUIZ_BLANK_ORDER) {
            popup.menu.findItem(R.id.move_up_option).isVisible = false
        }
        if (!canRemoveOrder || currentOrder == QUIZ_BLANK_ORDER) {
            popup.menu.findItem(R.id.remove_order_option).isVisible = false
        }
        if (isLast && currentOrder != QUIZ_BLANK_ORDER) {
            // Allow this for the last blank-order option so that we can give it an order again.
            popup.menu.findItem(R.id.move_down_option).isVisible = false
        }
        popup.setOnMenuItemClickListener { item -> handleOverflowPopupSelection(item) }
        popup.show()
    }

    private fun handleOverflowPopupSelection(item: MenuItem): Boolean {
        when (item.itemId) {
            R.id.move_up_option -> {
                onChangeOrder(adapterPosition, OrderModification.MOVE_UP)
                return true
            }
            R.id.remove_order_option -> {
                onChangeOrder(adapterPosition, OrderModification.REMOVE)
                return true
            }
            R.id.move_down_option -> {
                onChangeOrder(adapterPosition, OrderModification.MOVE_DOWN)
                return true
            }
            else -> return onOtherItemSelected.invoke(adapterPosition, item.itemId)
        }
    }
}