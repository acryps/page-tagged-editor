# page tagged editor
Create templates visually with ease.

## usage
Add the editor to your component.
Define your tags by passing them to the component.

```
export class BroadcastMailComposer extends Component {
	mail: MailTemplate;

	onload() {
		// load your template and prepare the component
	}
	
	render() {
		return <ui-composer>
			<ui-title>
				Broadcast Mail
			</ui-title>

			{new TaggedEditor(
				mail.template,
				[
					new Tag('Recipient Mail', 'address', '${recipient}'),
					new Tag('Given Name', 'name', '${name:given}'),
					new Tag('Family Name', 'name', '${name:family}'),
				],
				template => {
					mail.template = template;

					// save your template
				}
			)}
		</ui-composer>;
	}
}
```

We do not provide default styling, but the editor requires some controlling styles to work properly, include them from `source/index.scss`.

The `type` argument of a `Tag` will be set as an attribute, which can be used to style the tag by type
```
&[ui-type="address"] {
	color: #f00;
}

&[ui-type="name"] { 
	color: #0f0; 
}
```

`renderTagList`, `renderTag` and `extractValue` may be overwritten by creating a custom subclass

```
class GroupedTaggedEditor extends TaggedEditor {
	constructor(
		private source: string,
		private groups: Map<string, Tag[]>
		private save: (value: string) => void
	) {
		super(source, [...groups.values()], save);
	}

	renderTagList() {
		return <ui-tag-template>
			{this.groups.entries().map((group, tags) => <ui-group>
				<ui-name>
					{group}
				</ui-name>
			
				<ui-tags>
					{this.renderTag(tag)}
				</ui-tags>
			</ui-group>)}
		</ui-tag-template>
	}
}
```
