/**
 * SPDX-FileCopyrightText: © 2014 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

if (!CKEDITOR.plugins.get('ae_autolink')) {
	// Disables the auto URL detection feature in IE, their lacks functionality:
	// They convert the links only on space. We do on space, comma, semicolon and Enter.
	if (/MSIE ([^;]*)|Trident.*; rv:([0-9.]+)/.test(navigator.userAgent)) {
		document.execCommand('AutoUrlDetect', false, false);
	}

	const KEY_BACK = 8;

	const KEY_COMMA = 188;

	const KEY_ENTER = 13;

	const KEY_SEMICOLON = 186;

	const KEY_SPACE = 32;

	const DELIMITERS = [KEY_COMMA, KEY_ENTER, KEY_SEMICOLON, KEY_SPACE];

	const REGEX_LAST_WORD = /[^\s]+/gim;

	// Seen at https://stackoverflow.com/a/5717133/2103996
	const REGEX_URL =
		'^(https?:\\/\\/)?' + // protocol
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
		'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
		'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
		'(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
		'(\\#[-a-z\\d_]*)?$';

	const REGEX_EMAIL = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/i;

	/**
	 * CKEditor plugin which automatically generates links when user types text which looks like URL.
	 *
	 * @class CKEDITOR.plugins.ae_autolink
	 * @constructor
	 */
	CKEDITOR.plugins.add('ae_autolink', {
		/**
		 * Initialization of the plugin, part of CKEditor plugin lifecycle.
		 * The function registers the `keyup` event on the editing area.
		 *
		 * @instance
		 * @memberof CKEDITOR.plugins.ae_autolink
		 * @method init
		 * @param {Object} editor The current editor instance
		 */
		init(editor) {
			editor.once('contentDom', () => {
				const editable = editor.editable();

				editable.attachListener(
					editable,
					'keyup',
					this._onKeyUp,
					this,
					{
						editor,
					}
				);
			});

			editor.on('paste', event => {
				if (event.data.method === 'paste') {
					if (
						event.data.dataValue.indexOf('<') > -1 ||
						event.data.dataValue.indexOf('&lt;') > -1
					) {
						if (
							event.data.dataValue.indexOf('<u><font color="') >
							-1
						) {
							event.data.dataValue = event.data.dataValue.replace(
								/<u><font color="#(.*?)">|<\/font><\/u>/g,
								''
							);
						}
						return;
					}

					const instance = this;

					event.data.dataValue = event.data.dataValue.replace(
						RegExp(REGEX_URL, 'gim'),
						url => {
							if (instance._isValidURL(url)) {
								if (instance._isValidEmail(url)) {
									return (
										'<a href="mailto:' +
										url +
										'">' +
										url +
										'</a>'
									);
								} else {
									return (
										'<a href="' + url + '">' + url + '</a>'
									);
								}
							}
						}
					);
				}
			});
		},

		/**
		 * Retrieves the last word introduced by the user. Reads from the current
		 * caret position backwards until it finds the first white space.
		 *
		 * @instance
		 * @memberof CKEDITOR.plugins.ae_autolink
		 * @method _getLastWord
		 * @protected
		 * @return {String} The last word introduced by user
		 */
		_getLastWord(editor) {
			const selection = editor.getSelection();
			const range = selection ? selection.getRanges()[0] : null;
/*

			const range = editor.getSelection().getRanges()[0];
*/

			if (!range) {
				return;
			}

			const offset = range.startOffset;

			let previousText = '';

			// The user pressed Enter, so we have to look on the previous node
			if (this._currentKeyCode === KEY_ENTER) {
				let previousNode = range.startContainer.getPrevious();

				let lastChild;

				if (previousNode) {
					// If previous node is a SPACE, (it does not have 'getLast' method),
					// ignore it and find the previous text node
					while (!previousNode.getLast) {
						previousNode = previousNode.getPrevious();
					}

					lastChild = previousNode.getLast();

					// Depending on the browser, the last child node may be a <BR>
					// (which does not have 'getText' method),
					// so ignore it and find the previous text node
					while (lastChild && !lastChild.getText()) {
						lastChild = lastChild.getPrevious();
					}
				}

				// Check if the lastChild is already a link
				if (!(lastChild && lastChild.$.href)) {
					this._startContainer = lastChild;
					previousText = lastChild ? lastChild.getText() : '';
					this._offset = previousText.length;
				}
			} else {
				this._startContainer = range.startContainer;

				// Last character is the delimiter, ignore it
				previousText = this._startContainer
					.getText()
					.substring(0, offset - 1);

				this._offset = offset - 1;
			}

			let lastWord = '';

			const match = previousText.match(REGEX_LAST_WORD);

			if (match) {
				lastWord = match.pop();
			}

			return lastWord;
		},

		/**
		 * Checks if the given link is a valid Email.
		 *
		 * @instance
		 * @memberof CKEDITOR.plugins.ae_autolink
		 * @method isValidEmail
		 * @param {String} link The email we want to know if it is a valid Email
		 * @protected
		 * @return {Boolean} Returns true if the email is a valid Email, false otherwise
		 */
		_isValidEmail(email) {
			return REGEX_EMAIL.test(email);
		},

		/**
		 * Checks if the given link is a valid URL.
		 *
		 * @instance
		 * @memberof CKEDITOR.plugins.ae_autolink
		 * @method isValidURL
		 * @param {String} link The link we want to know if it is a valid URL
		 * @protected
		 * @return {Boolean} Returns true if the link is a valid URL, false otherwise
		 */
		_isValidURL(link) {
			return RegExp(REGEX_URL, 'i').test(link);
		},

		/**
		 * Listens to the `keydown` event and if the keycode is `Backspace`, removes the previously
		 * created link.
		 *
		 * @instance
		 * @memberof CKEDITOR.plugins.ae_autolink
		 * @method _onKeyDown
		 * @param {EventFacade} event EventFacade object
		 * @protected
		 */
		_onKeyDown(event) {
			const nativeEvent = event.data.$;

			const editor = event.listenerData.editor;

			const editable = editor.editable();

			editable.removeListener('keydown', this._onKeyDown);

			if (nativeEvent.keyCode === KEY_BACK) {
				event.cancel();
				event.data.preventDefault();

				this._removeLink(editor);
			}

			this._ckLink = null;
		},

		/**
		 * Listens to the `Enter` and `Space` key events in order to check if the last word
		 * introduced by the user should be replaced by a link element.
		 *
		 * @instance
		 * @memberof CKEDITOR.plugins.ae_autolink
		 * @method _onKeyUp
		 * @param {EventFacade} event EventFacade object
		 * @protected
		 */
		_onKeyUp(event) {
			const nativeEvent = event.data.$;

			this._currentKeyCode = nativeEvent.keyCode;

			if (DELIMITERS.indexOf(this._currentKeyCode) !== -1) {
				const editor = event.listenerData.editor;

				const lastWord = this._getLastWord(editor);

				if (this._isValidURL(lastWord)) {
					this._replaceContentByLink(editor, lastWord);
				}
			}
		},

		/**
		 * Replaces content by a link element.
		 *
		 * @fires CKEDITOR.plugins.ae_autolink#autolinkAdd
		 * @instance
		 * @memberof CKEDITOR.plugins.ae_autolink
		 * @method _replaceContentByLink
		 * @param {String} content The text that has to be replaced by an link element
		 * @protected
		 */
		_replaceContentByLink(editor, content) {
			let range = editor.createRange();
			const node = CKEDITOR.dom.element.get(this._startContainer);
			const offset = this._offset;

			// Select the content, so CKEDITOR.Link can properly replace it
			range.setStart(node, offset - content.length);
			range.setEnd(node, offset);
			range.select();

			const ckLink = new CKEDITOR.Link(editor);
			ckLink.create(content);
			this._ckLink = ckLink;

			const linkNode = ckLink.getFromSelection();
			editor.fire('autolinkAdd', linkNode);

			this._subscribeToKeyEvent(editor);

			// Now range is on the link and it is selected. We have to
			// return focus to the caret position.
			/*range = editor.getSelection().getRanges()[0];*/
			const selection = editor.getSelection();
			range = selection ? selection.getRanges()[0] : null;
			if(!range) {
				return null;
			}
			// If user pressed `Enter`, get the next editable node at position 0,
			// otherwise set the cursor at the next character of the link (the white space)
			if (this._currentKeyCode === KEY_ENTER) {
				const nextEditableNode = range.getNextEditableNode();

				range.setStart(nextEditableNode, 0);
				range.setEnd(nextEditableNode, 0);
			} else {
				const enclosedNode = range.getEnclosedNode();

				range.setStart(enclosedNode, 0);
				range.setEnd(enclosedNode, 0);
			}

			range.select();
		},

		/**
		 * Fired when a URL is detected in text and converted to a link.
		 *
		 * @event CKEDITOR.plugins.ae_autolink#autolinkAdd
		 * @memberof CKEDITOR.plugins.ae_autolink
		 * @param {CKEDITOR.dom.element} el Node of the created link.
		 */

		/**
		 * Removes the created link element, and replaces it by its text.
		 *
		 * @instance
		 * @memberof CKEDITOR.plugins.ae_autolink
		 * @method _removeLink
		 * @protected
		 */
		_removeLink(editor) {
			const selection = editor.getSelection();
			const range = selection ? selection.getRanges()[0] : null;
			if(!range) {
				return null;
			}
			/*const range = editor.getSelection().getRanges()[0];*/
			const caretOffset = range.startOffset;

			// Select the link, so CKEDITOR.Link can properly remove it
			const linkNode =
				this._startContainer.getNext() || this._startContainer;

			const newRange = editor.createRange();
			newRange.setStart(linkNode, 0);
			newRange.setEndAfter(linkNode);
			newRange.select();

			this._ckLink.remove();

			// Return focus to the caret position
			range.setEnd(range.startContainer, caretOffset);
			range.setStart(range.startContainer, caretOffset);

			range.select();
		},

		/**
		 * Subscribe to a key event of the editable aria.
		 *
		 * @instance
		 * @memberof CKEDITOR.plugins.ae_autolink
		 * @method _subscribeToKeyEvent
		 * @protected
		 */
		_subscribeToKeyEvent(editor) {
			const editable = editor.editable();

			// Change the priority of keydown listener - 1 means the highest priority.
			// In Chrome on pressing `Enter` the listener is not being invoked.
			// See http://dev.ckeditor.com/ticket/11861 for more information.
			editable.attachListener(
				editable,
				'keydown',
				this._onKeyDown,
				this,
				{
					editor,
				},
				1
			);
		},
	});
}
