import path from 'path';
import React from 'react';

import ButtonCommand from '../base/button-command';
import EditorContext from '../../adapter/editor-context';

function ButtonPathIcon({className = '', iconFile}) {
	return (
		<EditorContext.Consumer>
			{({editor}) => {
				const nativeEditor = editor.get('nativeEditor');
				const spritemap = nativeEditor.config.spritemap || '';
				const dirname = path.dirname(spritemap);
				const iconPath = path.join(dirname, iconFile);
				const combinedClassName = `ae-svg-icon`;
				// console.debug(`ButtonIcon.<EditorContext.Consumer> ${path}, combinedClassName ${combinedClassName}`);

				return (
					<svg className={combinedClassName} height="18" width="18">
						<use href={iconPath} />
					</svg>
				);
			}}
		</EditorContext.Consumer>
	);
}

/**
 * The ButtonSmiley class provides inserts horizontal line.
 *
 * @class ButtonSmiley
 * @uses ButtonCommand
 */
class ButtonSmiley extends React.Component {
	/**
	 * Lifecycle. Returns the default values of the properties used in the widget.
	 *
	 * @instance
	 * @memberof ButtonSmiley
	 * @method getDefaultProps
	 * @return {Object} The default properties.
	 */
	static defaultProps = {
		command: 'smiley',
	};

	/**
	 * The name which will be used as an alias of the button in the configuration.
	 *
	 * @default smiley
	 * @memberof ButtonSmiley
	 * @property {String} key
	 * @static
	 */
	static key = 'smiley';

	/**
	 * Lifecycle. Renders the UI of the button.
	 *
	 * @instance
	 * @memberof ButtonSmiley
	 * @method render
	 * @return {Object} The content which should be rendered.
	 */
	render() {
		return (
			<button
				aria-label="Smiles"
				className="ae-button"
				data-type="button-smiley"
				onClick={this.execCommand}
				tabIndex={this.props.tabIndex}
				title="Smiles">
				<ButtonPathIcon iconFile="smiley.svg#smiley" />
			</button>
		);
	}
}

export default ButtonCommand(ButtonSmiley);
