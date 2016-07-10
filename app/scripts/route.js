import $ from 'jquery';

let $content;
let $sidebar;

const route = {
  init() {
    $content = $('.wrapper > .content-wrapper');
    $sidebar = $('.sidebar-menu');
    const currentLocation = window.top.location.hash;
    let $node = $sidebar.find('a').first();
    $sidebar.find('a').each((i, el) => {
      let $el = $(el);
      if ($el.attr('href') === currentLocation) {
        $node = $el;
        return false;
      }
      return true;
    });
    route.select($node);
    $sidebar.find('a').click((e) => {
      route.select($(e.currentTarget));
    });
  },

  select($node) {
    $sidebar.children().removeClass('active');
    $node.parent().addClass('active');
    let name = $node.attr('href').slice(2);
    $content.attr('show', name);
    if (window.top !== window) {
      window.top.location.hash = `/${name}`;
    }
  },
};

export default route;
