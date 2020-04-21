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
import android.graphics.Typeface.BOLD
import android.graphics.Typeface.ITALIC
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.style.RelativeSizeSpan
import android.text.style.StrikethroughSpan
import android.text.style.StyleSpan
import android.util.AttributeSet
import androidx.emoji.widget.EmojiTextView

class MarkdownTextView : EmojiTextView {
    companion object {
        enum class TagType {
            BOLD,
            ITALIC,
            STRIKE_THROUGH,
            HEADING
        }
    }

    constructor(context: Context) : this(context, null)
    constructor(context: Context, attrs: AttributeSet?) : this(context, attrs, 0)
    constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int) : super(
        context,
        attrs,
        defStyleAttr
    ) {
    }

    @Override
    override fun setText(text: CharSequence?, type: BufferType?) {
        if (text.isNullOrEmpty()) {
            super.setText(text, type)
            return
        }
        var spannable: SpannableStringBuilder = SpannableStringBuilder(text)

        for (tag in TagType.values()) {
            spannable = styleTag(tag, spannable)
        }
        super.setText(spannable, BufferType.SPANNABLE)
    }

    private fun styleTag(
        tagType: TagType,
        spannableBuilder: SpannableStringBuilder
    ): SpannableStringBuilder {
        val tag = Tag(tagType)
        var spannable = spannableBuilder
        var startIndex = 0
        val regex: Regex = Regex(tag.getRegex())

        while (startIndex < spannable.length) {
            val result = regex.find(spannable, startIndex)
            if (result != null) {
                startIndex = Math.min(result.range.last, spannable.length)
                spannable = tag.styleSpan(result, spannable)
            } else {
                startIndex = spannable.length + 1
            }
        }
        return spannable
    }


    class Tag(val type: TagType) {
        companion object {
            const val BOLD_REGEX_TAG = "\\*\\*"
            const val ITALIC_REGEX_TAG = "__"
            const val STRIKE_THROUGH_REGEX_TAG = "~~"
            const val HEADING_REGEX_TAG = "(^|\\s)(#{1,6})(\\s.*?)?(\\n|$)"
        }

        fun getRegex(): String {
            val tagString = when (type) {
                TagType.BOLD -> {
                    BOLD_REGEX_TAG
                }
                TagType.ITALIC -> {
                    ITALIC_REGEX_TAG
                }
                TagType.STRIKE_THROUGH -> {
                    STRIKE_THROUGH_REGEX_TAG
                }
                else -> {
                    return HEADING_REGEX_TAG
                }
            }
            return "$tagString(\\S.*?)?\\S$tagString"
        }

        fun getSpanStyle(relativeSize: Float = 1f): Any {
            return when (type) {
                TagType.BOLD -> {
                    StyleSpan(BOLD)
                }
                TagType.ITALIC -> {
                    StyleSpan(ITALIC)
                }
                TagType.STRIKE_THROUGH -> {
                    StrikethroughSpan()
                }
                else -> {
                    RelativeSizeSpan(relativeSize)
                }
            }
        }

        fun styleSpan(
            regexMatch: MatchResult,
            spannable: SpannableStringBuilder
        ): SpannableStringBuilder {
            if (type != TagType.HEADING) {
                return styleNonHeadingSpan(regexMatch, spannable)
            }
            return styleHeadingSpan(regexMatch, spannable)
        }

        private fun styleNonHeadingSpan(
            regexMatch: MatchResult,
            spannable: SpannableStringBuilder
        ): SpannableStringBuilder {
            var startTagStartInclusive = regexMatch.range.first
            if (spannable[startTagStartInclusive].isWhitespace()) {
                // The starting space or ending space is counted in the result range, skip it
                startTagStartInclusive++
            }
            val startTagEndExclusive = startTagStartInclusive + 2
            var endTagEndExclusive = Math.min(regexMatch.range.last + 1, spannable.length)
            if (spannable[endTagEndExclusive - 1].isWhitespace()) {
                endTagEndExclusive--
            }
            val endTagStartInclusive = endTagEndExclusive - 2
            // Contrary to what you'd think, the spannable inclusive/exclusive tag has nothing
            // to do with the start and end index you supply, it only matters for whether text
            // inserted in those spots will be styled... the start and end indexes should always
            // be inclusive,exclusive no matter what the tag you use says.
            spannable.setSpan(
                HiddenSpan(),
                startTagStartInclusive,
                startTagEndExclusive,
                Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
            )
            spannable.setSpan(
                getSpanStyle(),
                startTagEndExclusive,
                endTagStartInclusive,
                Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
            )
            spannable.setSpan(
                HiddenSpan(),
                endTagStartInclusive,
                endTagEndExclusive,
                Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
            )
            return spannable
        }

        private fun styleHeadingSpan(
            regexMatch: MatchResult,
            spannable: SpannableStringBuilder
        ): SpannableStringBuilder {
            val numberOfHashtagsInclusive = regexMatch.groupValues[2].length
            val startTagStartInclusive = regexMatch.range.first
            // +1 because we need this to be exclusive not inclusive
            var startTagEndExclusive = startTagStartInclusive + numberOfHashtagsInclusive + 1
            if (spannable[startTagEndExclusive].isWhitespace()) {
                // Make sure to include the space after the "#" as part of the header tag. For some
                // reason I don't really care enough to figure out, the space isn't counted if there
                // was a newline before the heading tag, but it is already counted if we were at the
                // start of the string (\n vs ^ in regex).
                startTagEndExclusive++
            }
            var endOfContentExclusive = Math.min(regexMatch.range.last + 1, spannable.length)
            if (spannable[endOfContentExclusive - 1].isWhitespace()) {
                endOfContentExclusive--
            }

            // The more #, the smaller the heading.
            val textSizeMultiplier = (3.2f - (0.35f * numberOfHashtagsInclusive))

            // Contrary to what you'd think, the spannable inclusive/exclusive tag has nothing
            // to do with the start and end index you supply, it only matters for whether text
            // inserted in those spots will be styled... the start and end indexes should always
            // be inclusive,exclusive no matter what the tag you use says.
            spannable.setSpan(
                HiddenSpan(),
                startTagStartInclusive,
                startTagEndExclusive,
                Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
            )
            spannable.setSpan(
                getSpanStyle(textSizeMultiplier),
                startTagEndExclusive,
                endOfContentExclusive,
                Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
            )
            return spannable
        }
    }
}