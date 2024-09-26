import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Button } from 'Component';
import { I, S, Storage, translate, U } from 'Lib';

const PageMainVoid = observer(class PageMainVoid extends React.Component<I.PageComponent> {

	node = null;

	render () {
		return (
			<div 
				ref={node => this.node = node}
				className="wrapper"
			>
				<div className="container">
					<div className="iconWrapper">
						<Icon />
					</div>
					<Title text={translate('pageMainVoidTitle')} />
					<Label text={translate('pageMainVoidText')} />
					<Button onClick={this.onClick} className="c36" text={translate('pageMainVoidCreateSpace')} />
				</div>
			</div>
		);
	};

	onClick () {
		S.Popup.open('settings', {
			className: 'isSpaceCreate',
			data: {
				page: 'spaceCreate',
				isSpace: true,
				onCreate: (id) => {
					U.Router.switchSpace(id, '', true, () => Storage.initPinnedTypes());
				},
			},
		});
	};
	
});

export default PageMainVoid;