package com.app.playhvz.common

import android.app.AlertDialog
import android.app.Dialog
import android.os.Bundle
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.EditText
import androidx.fragment.app.DialogFragment
import com.app.playhvz.R

class TextInputDialog(title: String? = null, hint: String? = null, draftText: String? = null, isMultiline: Boolean = false) : DialogFragment() {

    companion object {
        private val TAG = TextInputDialog::class.qualifiedName
    }

    private var title: String? = null
    private var draftText: String? = null
    private var hintText: String? = null
    private var supportsMultiline = false

    private lateinit var customView: View
    lateinit var editText: EditText
    var onOk: (() -> Unit)? = null
    var onCancel: (() -> Unit)? = null

    init {
        this.title = title
        this.hintText = hint
        this.draftText = draftText
        this.supportsMultiline = isMultiline
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?,
                              savedInstanceState: Bundle?): View? {
        // Return already inflated custom view
        return customView
    }

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        customView = activity!!.layoutInflater.inflate(R.layout.dialog_text_input, null)

        editText = customView.findViewById(R.id.editText)
        editText.hint = hintText

        if (supportsMultiline) {
            editText.minLines = 3
            editText.inputType = InputType.TYPE_TEXT_FLAG_MULTI_LINE or InputType.TYPE_TEXT_FLAG_CAP_SENTENCES or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
        }

        if (draftText != null) {
            editText.append(draftText)
        }

        val builder = AlertDialog.Builder(context!!)
                .setTitle(title)
                .setView(customView)
                .setPositiveButton(android.R.string.ok) { _, _ ->
                    onOk?.invoke()
                }
                .setNegativeButton(android.R.string.cancel) { _, _ ->
                    onCancel?.invoke()
                }
        val dialog = builder.create()
        dialog.window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE)
        return dialog
    }

    fun setPositiveButtonCallback(okayCallback: () -> Unit) {
        onOk = okayCallback
    }

    fun setNegativeButtonCallback(negativeCallback: () -> Unit) {
        onCancel = negativeCallback
    }

    fun getNameProposal(): String {
        return editText.text.toString()
    }
}