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

package com.app.playhvz.common.ui

import android.content.Context
import android.content.ContextWrapper
import android.graphics.Canvas
import android.graphics.Rect
import android.util.AttributeSet
import android.view.MotionEvent
import androidx.core.content.ContextCompat
import androidx.emoji.widget.EmojiEditText
import androidx.fragment.app.FragmentActivity
import com.app.playhvz.R
import com.app.playhvz.common.MarkdownInfoDialog

/** An edit text that has an information button build in that shows the markdown hint dialog. */
class MarkdownEditText(
    context: Context?,
    attrs: AttributeSet?
) : EmojiEditText(context, attrs) {
    companion object {
        private val TAG = MarkdownEditText::class.qualifiedName
    }

    // Left = 0, Top = 1, Right = 2, Bottom = 3
    private val RIGHT = 2
    private var rect = Rect()

    init {
        val infoIcon = ContextCompat.getDrawable(context!!, R.drawable.ic_info)!!
        infoIcon.mutate().setTint(ContextCompat.getColor(context, R.color.secondary_icon_button))
        setCompoundDrawablesWithIntrinsicBounds(
            null,
            null,
            infoIcon,
            null
        )
        compoundDrawablePadding =
            context.resources.getDimensionPixelSize(R.dimen.markdown_icon_padding)

        setOnTouchListener { v, event ->
            val view = v as MarkdownEditText
            if (event.action == MotionEvent.ACTION_UP) {
                if (event.rawX >= (view.right - view.compoundDrawables[RIGHT].bounds.width())) {
                    showMarkdownHintDialog()
                    return@setOnTouchListener true
                }
            }
            return@setOnTouchListener false
        }
    }

    /**
     * Forces the drawable to appear at the top right corner of the view.
     */
    override fun dispatchDraw(canvas: Canvas?) {
        super.dispatchDraw(canvas)
        val centerOfTextView = height / 2
        getLineBounds(0, rect)
        val heightOfTextLine: Int = rect.bottom - rect.top
        val centerOfLine = heightOfTextLine / 2
        val topOfDrawable = centerOfLine - centerOfTextView
        val compoundDrawables = compoundDrawables
        val drawableRight = compoundDrawables[RIGHT]
        val padding = compoundDrawablePadding / 2
        drawableRight?.setBounds(
            0 - padding,
            topOfDrawable + padding,
            drawableRight.intrinsicWidth - padding,
            drawableRight.intrinsicHeight + topOfDrawable + padding
        )
    }

    private fun showMarkdownHintDialog() {
        getActivity()!!.supportFragmentManager.let { MarkdownInfoDialog().show(it, TAG) }
    }

    private fun getActivity(): FragmentActivity? {
        var context = context
        while (context is ContextWrapper) {
            if (context is FragmentActivity) {
                return context
            }
            context = context.baseContext
        }
        return null
    }
}