import { assert } from 'chai';

import { createRow } from '../../app/scripts/utils/dom';

describe('Utils: dom', () => {
  describe('createRow', () => {
    let columns = [
      {},
      { field: 'fid1' },
      { field: 'fid2', classNames: 'row-o' },
    ];

    it('should return row html properly without data', () => {
      assert.equal('<tr><td class=""></td><td class=""></td><td class="row-o"></td></tr>',
        createRow(columns));
    });

    it('should return row html properly with data', () => {
      let data = { fid1: 'aaa' };
      assert.equal('<tr><td class=""></td><td class="">aaa</td><td class="row-o"></td></tr>',
        createRow(columns, data));
    });
  });
});
