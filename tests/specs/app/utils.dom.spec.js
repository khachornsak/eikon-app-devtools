import _ from 'lodash';
import { expect } from 'chai';

import { addHeader, createRow } from '../../../app/js/utils/dom';

describe('App', () => {
  describe('Utils: dom', () => {
    describe('addHeader', () => {
      it('should add html to header properly', () => {
        let columns = [
          {},
          { name: 'def', classNames: 'row-e' },
          { classNames: 'row-o', headerTooltip: 'def' },
        ];

        expect(_.partial(addHeader, 'abc', columns), 'should not error even element does not exist')
          .to.not.throw(Error);

        let element = window.document.createElement('thead');
        element.setAttribute('id', 'abc');
        window.document.body.appendChild(element);
        expect(_.partial(addHeader, 'abc', columns), 'should not error when element does exist')
          .to.not.throw(Error);
        addHeader('abc', columns);
        expect(element.innerHTML, 'should render header properly')
          .to.equal([
            '<tr><th class="" title=""></th>',
            '<th class="row-e" title="">def</th>',
            '<th class="row-o" title="def"></th></tr>',
          ].join(''));
        window.document.body.removeChild(element);
      });
    });

    describe('createRow', () => {
      let columns = [
        {},
        { field: 'fid1' },
        { field: 'fid2', classNames: 'row-o' },
      ];

      it('should return row html properly', () => {
        let data = { fid1: 'aaa' };

        expect(createRow(columns), 'should render row with empty cells')
          .to.equal('<tr><td class=""></td><td class=""></td><td class="row-o"></td></tr>');
        expect(createRow(columns, data), 'should return row with data in cells')
          .to.equal('<tr><td class=""></td><td class="">aaa</td><td class="row-o"></td></tr>');
      });
    });
  });
});
