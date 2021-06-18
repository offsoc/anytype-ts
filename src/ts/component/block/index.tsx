import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, C, DataUtil, keyboard, focus, Storage, translate } from 'ts/lib';
import { DropTarget, ListChildren, Icon } from 'ts/component';
import { observer } from 'mobx-react';
import { menuStore, blockStore } from 'ts/store';

import BlockDataview from './dataview';
import BlockText from './text';
import BlockImage from './image';
import BlockIconPage from './iconPage';
import BlockIconUser from './iconUser';
import BlockVideo from './video';
import BlockFile from './file';
import BlockBookmark from './bookmark';
import BlockLink from './link';
import BlockCover from './cover';
import BlockDiv from './div';
import BlockRelation from './relation';
import BlockFeatured from './featured';
import BlockType from './type';

interface Props extends I.BlockComponent, RouteComponentProps<any> {
	index?: any;
	css?: any;
	className?: string;
	iconSize?: number;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const SNAP = 0.02;

@observer
class Block extends React.Component<Props, {}> {

	public static defaultProps = {
		align: I.BlockAlign.Left,
	};

	_isMounted: boolean = false;
		
	constructor (props: any) {
		super(props);
		
		this.onToggle = this.onToggle.bind(this);
		this.onToggleClick = this.onToggleClick.bind(this);
		this.onEmptyClick = this.onEmptyClick.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onMenuDown = this.onMenuDown.bind(this);
		this.onMenuClick = this.onMenuClick.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onResize = this.onResize.bind(this);
		this.onResizeEnd = this.onResizeEnd.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { rootId, css, index, className, block, readOnly } = this.props;
		const { id, type, fields, content, align, bgColor } = block;

		if (!id) {
			return null;
		};

		const { style, checked } = content || {};
		const childrenIds = blockStore.getChildrenIds(rootId, id);

		let canSelect = true;
		let canDrop = !readOnly;
		let cn: string[] = [ 'block', 'align' + align, DataUtil.blockClass(block) ];
		let cd: string[] = [ 'wrapContent' ];
		let blockComponent = null;
		let empty = null;
		
		if (className) {
			cn.push(className);
		};
		if (index) {
			cn.push('index-' + index);
		};
		if (fields.isUnwrapped) {
			cn.push('isUnwrapped');
		};
		if (readOnly) {
			cn.push('isReadOnly');
		};

		if (bgColor) {
			cd.push('bgColor bgColor-' + bgColor);
		};
		
		switch (type) {
			case I.BlockType.Text:
				if (block.isTextCheckbox() && checked) {
					cn.push('isChecked');
				};

				if (block.isTextToggle() && !childrenIds.length && !readOnly) {
					empty = (
						<div className="emptyToggle" onClick={this.onToggleClick}>{translate('blockTextToggleEmpty')}</div>
					);
				};

				blockComponent = <BlockText {...this.props} onToggle={this.onToggle} />;
				break;

			case I.BlockType.Layout:
				canSelect = false;
				break;
				
			case I.BlockType.IconPage:
				canSelect = false;
				canDrop = false;
				blockComponent = <BlockIconPage {...this.props} />;
				break;
				
			case I.BlockType.IconUser:
				canSelect = false;
				canDrop = false;
				blockComponent = <BlockIconUser {...this.props} />;
				break;
				
			case I.BlockType.File:
				switch (content.type) {
					default: 
					case I.FileType.File: 
						blockComponent = <BlockFile {...this.props} />;
						break;
						
					case I.FileType.Image: 
						blockComponent = <BlockImage {...this.props} />;
						break;
						
					case I.FileType.Video: 
						blockComponent = <BlockVideo {...this.props} />;
						break;
				};
				break;
				
			case I.BlockType.Bookmark:
				blockComponent = <BlockBookmark {...this.props} />;
				break;
			
			case I.BlockType.Dataview:
				canSelect = false;
				blockComponent = <BlockDataview {...this.props} />;
				break;
				
			case I.BlockType.Div:
				blockComponent = <BlockDiv {...this.props} />;
				break;
				
			case I.BlockType.Link:
				blockComponent = <BlockLink {...this.props} />;
				break;
				
			case I.BlockType.Cover:
				canSelect = false;
				blockComponent = <BlockCover {...this.props} />;
				break;

			case I.BlockType.Relation:
				blockComponent = <BlockRelation {...this.props} />;
				break;

			case I.BlockType.Featured:
				blockComponent = <BlockFeatured {...this.props} />;
				break;

			case I.BlockType.Type:
				canSelect = false;
				blockComponent = <BlockType {...this.props} />;
				break;
		};
		
		let object = null;

		if (canDrop) {
			object = (
				<DropTarget {...this.props} rootId={rootId} id={id} style={style} type={type} dropType={I.DragItem.Block}>
					{blockComponent}
				</DropTarget>
			);
		} else {
			object = (
				<div className="dropTarget">
					{blockComponent}
				</div>
			);
		};
		
		if (canSelect) {
			object = (
				<div id={'selectable-' + id} className="selectable" data-id={id}>
					{object}
					<div className="selectionOver" />
					<div className="menuOver" />
				</div>
			);
		} else {
			object = (
				<div className="selectable">
					{object}
				</div>
			);
		};

		let rowDropTargets = null;
		if (block.isLayoutRow()) {
			if (readOnly) {
				rowDropTargets = (
					<React.Fragment>
						<div className="dropTarget targetTop" />
						<div className="dropTarget targetBot" />
					</React.Fragment>
				);
			} else {
				rowDropTargets = (
					<React.Fragment>
						<DropTarget {...this.props} className="targetTop" rootId={rootId} id={id} style={style} type={type} dropType={I.DragItem.Block} />
						<DropTarget {...this.props} className="targetBot" rootId={rootId} id={id} style={style} type={type} dropType={I.DragItem.Block} />
					</React.Fragment>
				);
			};
		};

		return (
			<div id={'block-' + id} data-id={id} className={cn.join(' ')} style={css}>
				<div className="wrapMenu">
					<Icon id={'button-block-menu-' + id} className="dnd" draggable={true} onDragStart={this.onDragStart} onMouseDown={this.onMenuDown} onClick={this.onMenuClick} onContextMenu={this.onMenuClick} />
				</div>
				
				<div className={cd.join(' ')}>
					{object}
					{rowDropTargets}
					{empty}

					<ListChildren {...this.props} onMouseMove={this.onMouseMove} onMouseLeave={this.onMouseLeave} onResizeStart={this.onResizeStart} />
					
					{block.isLayoutColumn() ? (
						<div className="columnEmpty" onClick={this.onEmptyClick} />
					) : ''}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.initToggle();
	};
	
	componentDidUpdate () {
		const { block, dataset } = this.props;
		const { id } = block;
		const { selection } = dataset || {};
		const { focused } = focus.state;
		
		if (selection) {
			selection.set(selection.get());
		};

		if (focused == id) {
			focus.apply();
		};

		this.initToggle();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	initToggle () {
		const { rootId, block } = this.props;
		const node = $(ReactDOM.findDOMNode(this));

		if (block.id && block.isTextToggle()) {
			Storage.checkToggle(rootId, block.id) ? node.addClass('isToggled') : node.removeClass('isToggled');
		};
	};
	
	onToggle (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { rootId, block } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		
		blockStore.toggle(rootId, block.id, !node.hasClass('isToggled'));
		focus.apply();
	};
	
	onToggleClick (e: any) {
		const { rootId, block } = this.props;
		const { id } = block;
		const param = {
			type: I.BlockType.Text
		};
		
		C.BlockCreate(param, rootId, id, I.BlockPosition.Inner, (message: any) => {
			focus.set(message.blockId, { from: 0, to: 0 });
			focus.apply();
		});
	};
	
	onDragStart (e: any) {
		e.stopPropagation();

		if (!this._isMounted) {
			return;
		};
		
		const { dataset, block } = this.props;
		const { selection, onDragStart } = dataset || {};
		
		if (!selection || !onDragStart) {
			return;
		};
		
		if (!block.isDraggable()) {
			e.preventDefault();
			return;
		};
		
		selection.preventSelect(true);
		selection.preventClear(true);
		
		const ids: string[] = DataUtil.selectionGet(block.id, false, this.props);
		onDragStart(e, I.DragItem.Block, ids, this);
	};
	
	onMenuDown (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		
		if (selection) {
			selection.preventClear(true);
		};

		focus.clear(true);
	};
	
	onMenuClick (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { dataset, rootId, block } = this.props;
		const { selection } = dataset || {};
		const elementId = `#button-block-menu-${block.id}`;
		const element = $(elementId);
		const offset = element.offset();
		const rect = { x: offset.left, y: keyboard.mouse.page.y, width: element.width(), height: 0 };

		menuStore.open('blockAction', { 
			offsetX: element.outerWidth(),
			rect: rect,
			data: {
				blockId: block.id,
				blockIds: DataUtil.selectionGet(block.id, true, this.props),
				rootId: rootId,
				dataset: dataset,
			},
			onClose: () => {
				selection.clear(true);
				focus.apply();
			}
		});
	};
	
	onResizeStart (e: any, index: number) {
		e.stopPropagation();

		const { dataset, rootId, block, readOnly } = this.props;

		if (!this._isMounted || readOnly) {
			return;
		};

		const { id } = block;
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		const { selection } = dataset || {};
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const prevBlockId = childrenIds[index - 1];
		const offset = (prevBlockId ? node.find('#block-' + prevBlockId).offset().left : 0) + Constant.size.blockMenu ;
		const add = $('#button-add');
		
		if (selection) {
			selection.preventSelect(true);
			selection.clear(true);
		};

		this.unbind();
		node.addClass('isResizing');
		$('body').addClass('colResize');
		keyboard.setResize(true);
		add.css({ opacity: 0 });
		
		node.find('.colResize.active').removeClass('active');
		node.find('.colResize.c' + index).addClass('active');
		
		win.on('mousemove.block', (e: any) => { this.onResize(e, index, offset); });
		win.on('mouseup.block', (e: any) => { this.onResizeEnd(e, index, offset); });
		
		node.find('.resizable').trigger('resizeStart', [ e ]);
	};

	onResize (e: any, index: number, offset: number) {
		if (!this._isMounted) {
			return;
		};
		
		e.preventDefault();
		e.stopPropagation();
		
		const { rootId, block } = this.props;
		const { id } = block;
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		
		const node = $(ReactDOM.findDOMNode(this));
		const prevBlockId = childrenIds[index - 1];
		const currentBlockId = childrenIds[index];
		
		const prevNode = node.find('#block-' + prevBlockId);
		const currentNode = node.find('#block-' + currentBlockId);
		const res = this.calcWidth(e.pageX - offset, index);

		if (!res) {
			return;
		};
		
		const w1 = res.percent * res.sum;
		const w2 = (1 - res.percent) * res.sum;
		
		prevNode.css({ width: w1 * 100 + '%' });
		currentNode.css({ width: w2 * 100 + '%' });
		
		node.find('.resizable').trigger('resize', [ e ]);
	};

	onResizeEnd (e: any, index: number, offset: number) {
		if (!this._isMounted) {
			return;
		};
		
		const { dataset, rootId, block } = this.props;
		const { id } = block;
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		const { selection } = dataset || {};
		const node = $(ReactDOM.findDOMNode(this));
		const prevBlockId = childrenIds[index - 1];
		const currentBlockId = childrenIds[index];
		const res = this.calcWidth(e.pageX - offset, index);

		if (!res) {
			return;
		};
		
		if (selection) {
			selection.preventSelect(false);	
		};
		this.unbind();
		node.removeClass('isResizing');
		$('body').removeClass('colResize');
		keyboard.setResize(false);
		
		node.find('.colResize.active').removeClass('active');
		
		C.BlockListSetFields(rootId, [
			{ blockId: prevBlockId, fields: { width: res.percent * res.sum } },
			{ blockId: currentBlockId, fields: { width: (1 - res.percent) * res.sum } },
		]);
		
		node.find('.resizable').trigger('resizeEnd', [ e ]);
	};
	
	calcWidth (x: number, index: number) {
		const { rootId, block, getWrapperWidth } = this.props;
		const { id } = block;
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		
		const prevBlockId = childrenIds[index - 1];
		const prevBlock = blockStore.getLeaf(rootId, prevBlockId);
		
		const currentBlockId = childrenIds[index];
		const currentBlock = blockStore.getLeaf(rootId, currentBlockId);

		if (!prevBlock || !currentBlock) {
			return;
		};

		const width = getWrapperWidth();
		const dw = 1 / childrenIds.length;
		const sum = (prevBlock.fields.width || dw) + (currentBlock.fields.width || dw);
		const offset = Constant.size.blockMenu * 2;
		
		x = Math.max(offset, x);
		x = Math.min(sum * width - offset, x);
		x = x / (sum * width);
		
		// Snap
		if (x > 0.5 - SNAP && x < 0.5) {
			x = 0.5;
		};
		if (x < 0.5 + SNAP && x > 0.5) {
			x = 0.5;
		};
		
		return { sum: sum, percent: x };
	};
	
	onMouseMove (e: any) {
		if (!this._isMounted|| keyboard.isResizing) {
			return;
		};
		
		const { rootId, block, readOnly } = this.props;
		const { id } = block;
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!block.isLayoutRow() || keyboard.isDragging || readOnly) {
			return;
		};
		
		const width = $('#editorWrapper').width();
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		const length = childrenIds.length;
		const children = blockStore.getChildren(rootId, id);
		const rect = node.get(0).getBoundingClientRect() as DOMRect;
		const p = (e.pageX - rect.x) / (width + Constant.size.blockMenu);
		
		let c = 0;
		let num = 0;
		
		for (let i in children) {
			const child = children[i];
			
			c += child.fields.width || 1 / length;
			if ((p >= c - 0.1) && (p <= c + 0.1)) {
				num = Number(i) + 1;
				break;
			};
		};
		
		node.find('.colResize.active').removeClass('active');
		if (num) {
			node.find('.colResize.c' + num).addClass('active');
		};
	};
	
	onMouseLeave (e: any) {
		if (!keyboard.isResizing) {
			$('.colResize.active').removeClass('active');
		};
	};
	
	unbind () {
		$(window).unbind('mousemove.block mouseup.block');
	};
	
	onEmptyClick () {
		const { rootId, block } = this.props;
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		
		if (!block.isLayoutColumn() || !childrenIds.length) {
			return;
		};
		
		const param =  {
			type: I.BlockType.Text,
			style: I.TextStyle.Paragraph,
		};
		
		C.BlockCreate(param, rootId, childrenIds[childrenIds.length - 1], I.BlockPosition.Bottom, (message: any) => {
			focus.set(message.blockId, { from: 0, to: 0 });
			focus.apply();
		});
	};
	
};

export default Block;