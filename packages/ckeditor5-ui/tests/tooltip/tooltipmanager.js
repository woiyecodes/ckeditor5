/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* global document, MouseEvent, Event */

import ClassicTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/classictesteditor';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';

import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils';
import View from '../../src/view';
import BalloonPanelView from '../../src/panel/balloon/balloonpanelview';
import TooltipManager from '../../src/tooltipmanager';

describe( 'TooltipManager', () => {
	let editor, element, tooltipManager;

	const utils = getUtils();

	testUtils.createSinonSandbox();

	beforeEach( async () => {
		element = document.createElement( 'div' );
		document.body.appendChild( element );

		editor = await ClassicTestEditor.create( element, {
			plugins: [ Paragraph, Bold, Italic ],
			balloonToolbar: [ 'bold', 'italic' ]
		} );

		tooltipManager = editor.ui.tooltipManager;
	} );

	afterEach( async () => {
		await editor.destroy();

		element.remove();
	} );

	describe( 'constructor()', () => {
		it( 'should have #editor', () => {
			expect( tooltipManager.editor ).to.equal( editor );
		} );

		it( 'should have #tooltipTextView', () => {
			expect( tooltipManager.tooltipTextView ).to.be.instanceOf( View );
			expect( tooltipManager.tooltipTextView.text ).to.equal( '' );
			expect( Array.from( tooltipManager.tooltipTextView.element.classList ) ).to.have.members( [ 'ck', 'ck-tooltip__text' ] );
		} );

		it( 'should have #balloonPanelView', () => {
			expect( tooltipManager.balloonPanelView ).to.be.instanceOf( BalloonPanelView );
			expect( tooltipManager.balloonPanelView.class ).to.equal( 'ck-tooltip' );
			expect( tooltipManager.balloonPanelView.content.first ).to.equal( tooltipManager.tooltipTextView );
		} );
	} );

	describe( 'destroy()', () => {
		it( 'should destroy #balloonPanelView', () => {
			const destroySpy = sinon.spy( tooltipManager.balloonPanelView, 'destroy' );

			tooltipManager.destroy();

			sinon.assert.calledOnce( destroySpy );
		} );

		it( 'should stop listening to events', () => {
			const stopListeningSpy = sinon.spy( tooltipManager, 'stopListening' );

			tooltipManager.destroy();

			sinon.assert.called( stopListeningSpy );
		} );
	} );

	describe( 'displaying tooltips', () => {
		let clock, elements, pinSpy, unpinSpy, defaultPositions;

		beforeEach( () => {
			clock = sinon.useFakeTimers();
			defaultPositions = TooltipManager.defaultPositions;

			elements = getElementsWithTooltips( {
				a: {
					text: 'A'
				},

				b: {
					text: 'B'
				},

				disabled: {
					text: 'DISABLED',
					isDisabled: true
				},

				unrelated: {},

				positionS: {
					text: 'POSITION_S',
					position: 's'
				},

				positionN: {
					text: 'POSITION_N',
					position: 'n'
				},

				positionE: {
					text: 'POSITION_E',
					position: 'e'
				},

				positionW: {
					text: 'POSITION_W',
					position: 'w'
				},

				positionSW: {
					text: 'POSITION_SW',
					position: 'sw'
				},

				positionSE: {
					text: 'POSITION_SE',
					position: 'se'
				}
			} );

			pinSpy = sinon.spy( tooltipManager.balloonPanelView, 'pin' );
			unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );
		} );

		afterEach( () => {
			destroyElements( elements );
			clock.restore();
		} );

		describe( 'on mouseenter', () => {
			it( 'should not work for elements that have no descendant with the data-attribute', () => {
				utils.dispatchMouseEnter( elements.unrelated );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.notCalled( pinSpy );
			} );

			it( 'should not work if an element already has a tooltip', () => {
				utils.dispatchMouseEnter( elements.a );
				utils.waitForTheTooltipToShow( clock );

				utils.dispatchMouseEnter( elements.a );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );
			} );

			// TODO: data- instead maybe?
			it( 'should not work for elements with a .ck-tooltip_hidden CSS class', () => {
				utils.dispatchMouseEnter( elements.disabled );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.notCalled( pinSpy );
			} );

			describe( 'when all conditions are met', () => {
				it( 'should unpin the tooltip first', () => {
					utils.dispatchMouseEnter( elements.a );
					utils.waitForTheTooltipToShow( clock );

					sinon.assert.callOrder( unpinSpy, pinSpy );
				} );

				it( 'should pin a tooltip with a delay', () => {
					utils.dispatchMouseEnter( elements.a );

					sinon.assert.notCalled( pinSpy );

					utils.waitForTheTooltipToShow( clock );

					sinon.assert.calledOnce( pinSpy );
					sinon.assert.calledWith( pinSpy, {
						target: elements.a,
						positions: sinon.match.array
					} );
				} );

				it( 'should show up for the last element the mouse entered (last element has tooltip)', () => {
					utils.dispatchMouseEnter( elements.a );
					utils.dispatchMouseEnter( elements.b );

					utils.waitForTheTooltipToShow( clock );

					sinon.assert.calledOnce( pinSpy );
					sinon.assert.calledWith( pinSpy, {
						target: elements.b,
						positions: sinon.match.array
					} );
				} );

				it( 'should show up for the first element the mouse entered (last element has no tooltip)', () => {
					utils.dispatchMouseEnter( elements.a );
					utils.dispatchMouseEnter( elements.unrelated );

					utils.waitForTheTooltipToShow( clock );

					sinon.assert.calledOnce( pinSpy );
					sinon.assert.calledWith( pinSpy, {
						target: elements.a,
						positions: sinon.match.array
					} );
				} );
			} );
		} );

		describe( 'on focus', () => {
			it( 'should not work for elements that have no descendant with the data-attribute', () => {
				utils.dispatchFocus( elements.unrelated );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.notCalled( pinSpy );
			} );

			it( 'should not work if an element already has a tooltip', () => {
				utils.dispatchFocus( elements.a );
				utils.waitForTheTooltipToShow( clock );

				utils.dispatchFocus( elements.a );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );
			} );

			// TODO: data- instead maybe?
			it( 'should not work for elements with a .ck-tooltip_hidden CSS class', () => {
				utils.dispatchFocus( elements.disabled );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.notCalled( pinSpy );
			} );

			describe( 'when all conditions are met', () => {
				it( 'should unpin the tooltip first', () => {
					utils.dispatchFocus( elements.a );
					utils.waitForTheTooltipToShow( clock );

					sinon.assert.callOrder( unpinSpy, pinSpy );
				} );

				it( 'should pin a tooltip with a delay', () => {
					utils.dispatchFocus( elements.a );

					sinon.assert.notCalled( pinSpy );

					utils.waitForTheTooltipToShow( clock );

					sinon.assert.calledOnce( pinSpy );
					sinon.assert.calledWith( pinSpy, {
						target: elements.a,
						positions: sinon.match.array
					} );
				} );

				it( 'should show up for the last element the mouse entered (last element has tooltip)', () => {
					utils.dispatchFocus( elements.a );
					utils.dispatchFocus( elements.b );

					utils.waitForTheTooltipToShow( clock );

					sinon.assert.calledOnce( pinSpy );
					sinon.assert.calledWith( pinSpy, {
						target: elements.b,
						positions: sinon.match.array
					} );
				} );

				it( 'should show up for the first element the mouse entered (last element has no tooltip)', () => {
					utils.dispatchFocus( elements.a );
					utils.dispatchFocus( elements.unrelated );

					utils.waitForTheTooltipToShow( clock );

					sinon.assert.calledOnce( pinSpy );
					sinon.assert.calledWith( pinSpy, {
						target: elements.a,
						positions: sinon.match.array
					} );
				} );
			} );
		} );

		it( 'should put the #balloonPanelView in the body collection once on demand', () => {
			expect( tooltipManager.balloonPanelView.element ).to.be.null;

			utils.dispatchMouseEnter( elements.a );
			utils.waitForTheTooltipToShow( clock );

			expect( editor.ui.view.body.has( tooltipManager.balloonPanelView ) ).to.be.true;

			utils.dispatchMouseEnter( elements.b );
			utils.waitForTheTooltipToShow( clock );

			expect( editor.ui.view.body.has( tooltipManager.balloonPanelView ) ).to.be.true;
		} );

		describe( 'translation of position name into BalloonPanelView positioning function', () => {
			it( 'should be defined for "s" position', () => {
				utils.dispatchMouseEnter( elements.positionS );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );
				sinon.assert.calledWith( pinSpy, {
					target: elements.positionS,
					positions: [
						defaultPositions.southArrowNorth,
						defaultPositions.southArrowNorthEast,
						defaultPositions.southArrowNorthWest
					]
				} );
			} );

			it( 'should be defined for "n" position', () => {
				utils.dispatchMouseEnter( elements.positionN );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );
				sinon.assert.calledWith( pinSpy, {
					target: elements.positionN,
					positions: [
						defaultPositions.northArrowSouth
					]
				} );
			} );

			it( 'should be defined for "e" position', () => {
				utils.dispatchMouseEnter( elements.positionE );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );
				sinon.assert.calledWith( pinSpy, {
					target: elements.positionE,
					positions: [
						defaultPositions.eastArrowWest
					]
				} );
			} );

			it( 'should be defined for "w" position', () => {
				utils.dispatchMouseEnter( elements.positionW );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );
				sinon.assert.calledWith( pinSpy, {
					target: elements.positionW,
					positions: [
						defaultPositions.westArrowEast
					]
				} );
			} );

			it( 'should be defined for "sw" position', () => {
				utils.dispatchMouseEnter( elements.positionSW );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );
				sinon.assert.calledWith( pinSpy, {
					target: elements.positionSW,
					positions: [
						defaultPositions.southArrowNorthEast
					]
				} );
			} );

			it( 'should be defined for "se" position', () => {
				utils.dispatchMouseEnter( elements.positionSE );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );
				sinon.assert.calledWith( pinSpy, {
					target: elements.positionSE,
					positions: [
						defaultPositions.southArrowNorthWest
					]
				} );
			} );
		} );
	} );

	describe( 'hiding tooltips', () => {
		let clock, elements, pinSpy, unpinSpy;

		beforeEach( () => {
			clock = sinon.useFakeTimers();

			elements = getElementsWithTooltips( {
				a: {
					text: 'A'
				},

				b: {
					text: 'B'
				},

				childOfA: {
					text: 'CHILD_OF_A'
				},

				unrelated: {}
			} );

			pinSpy = sinon.spy( tooltipManager.balloonPanelView, 'pin' );

			elements.a.appendChild( elements.childOfA );
		} );

		afterEach( () => {
			destroyElements( elements );
			clock.restore();
		} );

		describe( 'on mouseleave', () => {
			it( 'should not work for unrelated event targets such as DOM document', () => {
				utils.dispatchMouseEnter( elements.a );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );

				unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );
				utils.dispatchMouseLeave( document );

				sinon.assert.notCalled( unpinSpy );
			} );

			it( 'should not work if the tooltip is currently pinned and the event target is different than the current element', () => {
				utils.dispatchMouseEnter( elements.a );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );

				unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );
				utils.dispatchMouseLeave( elements.b );

				sinon.assert.notCalled( unpinSpy );
			} );

			it( 'should not work if the tooltip is not visible and leaving an element that has nothing to do with tooltips', () => {
				unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );
				utils.dispatchMouseLeave( elements.unrelated );

				sinon.assert.notCalled( unpinSpy );
			} );

			it( 'should unpin the tooltip when moving from one element with a tooltip to another element with a tooltip quickly' +
				'before the tooltip shows for the first tooltip (cancellin the queued pinning)', () => {
				utils.dispatchMouseEnter( elements.a );

				unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );
				utils.dispatchMouseLeave( elements.childOfA, elements.a );

				sinon.assert.calledOnce( unpinSpy );

				utils.waitForTheTooltipToShow( clock );
				sinon.assert.notCalled( pinSpy );
			} );

			it( 'should immediatelly unpin the tooltip otherwise', () => {
				utils.dispatchMouseEnter( elements.a );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );

				unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );
				utils.dispatchMouseLeave( elements.a );

				sinon.assert.calledOnce( unpinSpy );
			} );
		} );

		describe( 'on blur', () => {
			it( 'should not work if a tooltip is pinned but blur ocurred in an unrelated place', () => {
				utils.dispatchMouseEnter( elements.a );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );

				unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );
				utils.dispatchBlur( elements.unrelated );

				sinon.assert.notCalled( unpinSpy );
			} );

			it( 'should unpin if the tooltip was pinned and the blur ocurred on the same element', () => {
				utils.dispatchMouseEnter( elements.a );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );

				unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );
				utils.dispatchBlur( elements.a );

				sinon.assert.calledOnce( unpinSpy );
			} );

			it( 'should unpin if the tooltip was not pinned (cancels the queued pinning)', () => {
				unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );
				utils.dispatchBlur( elements.unrelated );

				sinon.assert.calledOnce( unpinSpy );
			} );
		} );

		describe( 'on scroll', () => {
			it( 'should not unpin the tooltip if not pinned in the first place', () => {
				unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );
				utils.dispatchScroll( elements.a );

				sinon.assert.notCalled( unpinSpy );
			} );

			it( 'should not unpin the tooltip if the scrolled element is a common ancestor of the #balloonPanelView ' +
				'and the element with tooltip', () => {
				utils.dispatchMouseEnter( elements.a );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );

				unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );
				utils.dispatchScroll( document );

				sinon.assert.notCalled( unpinSpy );
			} );

			it( 'should unpin if the scrolled element does not contain the #balloonPanelView', () => {
				utils.dispatchMouseEnter( elements.childOfA );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );

				unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );
				utils.dispatchScroll( elements.a );

				sinon.assert.calledOnce( unpinSpy );
			} );

			it( 'should unpin if the scrolled element does not contain the current element with a tooltip', () => {
				utils.dispatchMouseEnter( elements.a );
				utils.waitForTheTooltipToShow( clock );

				sinon.assert.calledOnce( pinSpy );

				unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );
				utils.dispatchScroll( elements.unrelated );

				sinon.assert.calledOnce( unpinSpy );
			} );
		} );
	} );

	describe( 'updating tooltip position on EditorUI#update', () => {
		let clock, elements, pinSpy, unpinSpy;

		beforeEach( () => {
			clock = sinon.useFakeTimers();

			elements = getElementsWithTooltips( {
				a: {
					text: 'A'
				}
			} );

			pinSpy = sinon.spy( tooltipManager.balloonPanelView, 'pin' );
		} );

		afterEach( () => {
			destroyElements( elements );
			clock.restore();
		} );

		it( 'should start when the tooltip gets pinned', () => {
			utils.dispatchMouseEnter( elements.a );

			editor.ui.update();
			sinon.assert.notCalled( pinSpy );

			utils.waitForTheTooltipToShow( clock );

			sinon.assert.calledOnce( pinSpy );
			sinon.assert.calledWith( pinSpy.firstCall, {
				target: elements.a,
				positions: sinon.match.array
			} );

			editor.ui.update();
			sinon.assert.calledTwice( pinSpy );
			sinon.assert.calledWith( pinSpy.secondCall, {
				target: elements.a,
				positions: sinon.match.array
			} );
		} );

		it( 'should stop when the tooltip gets unpinned', () => {
			utils.dispatchMouseEnter( elements.a );
			utils.waitForTheTooltipToShow( clock );

			sinon.assert.calledOnce( pinSpy );

			editor.ui.update();
			sinon.assert.calledTwice( pinSpy );

			utils.dispatchMouseLeave( elements.a );

			editor.ui.update();
			sinon.assert.calledTwice( pinSpy );
		} );

		it( 'should unpin the tooltip when the target element disappeared', () => {
			utils.dispatchMouseEnter( elements.a );
			utils.waitForTheTooltipToShow( clock );

			sinon.assert.calledOnce( pinSpy );
			unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );

			elements.a.style.display = 'none';

			editor.ui.update();
			sinon.assert.calledOnce( pinSpy );
			sinon.assert.calledOnce( unpinSpy );
		} );

		it( 'should unpin the tooltip when the target element was removed from DOM', () => {
			utils.dispatchMouseEnter( elements.a );
			utils.waitForTheTooltipToShow( clock );

			sinon.assert.calledOnce( pinSpy );
			unpinSpy = sinon.spy( tooltipManager.balloonPanelView, 'unpin' );

			elements.a.remove();

			editor.ui.update();
			sinon.assert.calledOnce( pinSpy );
			sinon.assert.calledOnce( unpinSpy );
		} );
	} );

	describe( '#defaultPositions', () => {
		it( 'should be defined', () => {

		} );
	} );
} );

function getElementsWithTooltips( definitions ) {
	const elements = {};

	for ( const name in definitions ) {
		const element = document.createElement( 'div' );
		const def = definitions[ name ];

		if ( def.text ) {
			element.dataset.ckeTooltipText = def.text;
		}

		if ( def.position ) {
			element.dataset.ckeTooltipPosition = def.position;
		}

		if ( def.isDisabled ) {
			element.classList.add( 'ck-tooltip_hidden' );
		}

		element.id = name;

		document.body.appendChild( element );

		elements[ name ] = element;
	}

	return elements;
}

function destroyElements( elements ) {
	for ( const name in elements ) {
		elements[ name ].remove();
	}
}

function getUtils() {
	return {
		waitForTheTooltipToShow: clock => {
			clock.tick( 650 );
		},

		dispatchMouseEnter: element => {
			element.dispatchEvent( new MouseEvent( 'mouseenter' ) );
		},

		dispatchMouseLeave: ( element, relatedTarget ) => {
			element.dispatchEvent( new MouseEvent( 'mouseleave', { relatedTarget } ) );
		},

		dispatchFocus: element => {
			element.dispatchEvent( new Event( 'focus' ) );
		},

		dispatchBlur: element => {
			element.dispatchEvent( new Event( 'blur' ) );
		},

		dispatchScroll: element => {
			element.dispatchEvent( new Event( 'scroll' ) );
		}
	};
}
