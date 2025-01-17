/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import SelectAll from '../src/selectall.js';
import SelectAllEditing from '../src/selectallediting.js';
import SelectAllUI from '../src/selectallui.js';

describe( 'SelectAll', () => {
	it( 'should require SelectAllEditing and SelectAllUI', () => {
		expect( SelectAll.requires ).to.deep.equal( [ SelectAllEditing, SelectAllUI ] );
	} );

	it( 'should be named', () => {
		expect( SelectAll.pluginName ).to.equal( 'SelectAll' );
	} );
} );
