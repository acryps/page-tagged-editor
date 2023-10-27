import { Component } from "@acryps/page";

export class Tag {
	constructor(
		public name: string,
		public type: string,
		public templateToken: string
	) {}
}

export class TaggedEditor extends Component {
	// gets inserted between tags to allow the user to place the cursor between them
	// zero width unicode space
	readonly safetyCharacter = '\u200b';

	constructor(
		private source: string,
		private tags: Tag[],
		private save: (value: string) => void,
		private multiline = false
	) {
		super();
	
		this.source = this.source ?? '';
	}

	render() {
		let source: (string | Tag)[] = [this.source];

		for (let tag of this.tags) {
			const stack = [];

			for (let part of source) {
				if (typeof part == 'string') {
					const delimiters = part.split(tag.templateToken);

					for (let index = 0; index < delimiters.length; index++) {
						stack.push(delimiters[index]);

						if (index < delimiters.length - 1) {
							stack.push(tag);
						}
					}
				} else {
					stack.push(part);
				}
			}

			source = stack.filter(part => part != '');
		}

		// insert safety characters between two tags
		source = source.flatMap((part, index) => {
			if (!source[index + 1]) {
				return [part];
			}

			return [part, this.safetyCharacter];
		});

		let input: HTMLElement;

		requestAnimationFrame(() => {
			input.contentEditable = 'true';

			// allow drop
			input.ondragover = event => {
				const tagValue = event.dataTransfer.getData('text/plain');
				const tag = this.tags.find(tag => tag.templateToken == tagValue);

				if (!tag) {
					return;
				}

				event.preventDefault();
			};

			input.ondrop = () => {
				requestAnimationFrame(() => {
					this.source = this.extractValue(input);
					this.save(this.source);
					
					this.update();
				});
			};

			input.onkeydown = event => {
				if (event.key == 'Tab') {
					event.preventDefault();
				}

				if (event.key == 'Enter') {
					event.preventDefault();
					
					if (this.multiline) {
						const selection = window.getSelection();
						const range = selection.getRangeAt(0);
						const cursorPosition = range.startOffset;

						// insert new line
						range.startContainer.textContent = range.startContainer.textContent.slice(0, cursorPosition) + '\n' + range.startContainer.textContent.slice(cursorPosition);

						// advance cursor
						range.setStart(range.startContainer, cursorPosition + 1);
						range.setEnd(range.startContainer, cursorPosition + 1);
						
						selection.removeAllRanges();
						selection.addRange(range);
					}
				}
			}

			input.onkeyup = () => {
				this.source = this.extractValue(input);
				this.save(this.source);
			}
		});

		return <ui-tagged-editor>
			{input = <ui-tag-input>{source.map(part => {
				if (typeof part == 'string') {
					return part;
				}

				return this.renderTag(part);
			})}</ui-tag-input>}

			<ui-tag-template>
				{this.tags.map(tag => this.renderTag(tag))}
			</ui-tag-template>
		</ui-tagged-editor>
	}

	renderTag(tag: Tag) {
		const element: HTMLElement = <ui-tag ui-type={tag.type} ui-token={tag.templateToken}>
			{tag.name}
		</ui-tag>;

		element.contentEditable = 'false';
		element.draggable = true;

		element.addEventListener('dragstart', event => {
			event.dataTransfer.setData('text/plain', tag.templateToken);
		});

		return element;
	}

	extractValue(input: HTMLElement) {
		let content = [...input.childNodes].map(node => node.nodeType == Node.TEXT_NODE ? node.textContent : (node as HTMLElement).getAttribute('ui-token')).join('');

		// remove safety characters
		content = content.replaceAll(this.safetyCharacter, '');

		// chrome inserts a non-breaking space when an element is dropped sometimes, just remove it
		content = content.replaceAll('\u00a0', '');

		return content;
	}
}