(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const cvid = require("cview-util-cvid");

class BaseView {
  constructor() {
    this.id = cvid.newId;
  }

  _defineView() {
    return {};
  }

  get definition() {
    return this._defineView();
  }

  get created() {
    if (this._view) {
      return this._view;
    } else {
      this._view = $ui.create(this.definition);
      return this._view;
    }
  }

  get view() {
    if (this._view) {
      return this._view;
    } else {
      this._view = $(this.id);
      return this._view;
    }
  }

  add(view) {
    if (view instanceof BaseView) {
      this.view.add(view.definition);
    } else {
      this.view.add(view);
    }
  }
}

module.exports = BaseView;

},{"cview-util-cvid":7}],2:[function(require,module,exports){
const BaseView = require("cview-baseview");
const { ContentView, Label, Button } = require("cview-singleviews");
const SymbolButton = require("cview-symbol-button");
const { getTextWidth } = require("cview-util-ui");

const navBarStyles = {
  hidden: 0,
  minimized: 1,
  normal: 2,
  expanded: 3
};

const navBarLayouts = {
  0: (make, view) => {
    make.left.right.top.inset(0);
    make.height.equalTo(0);
  },
  1: (make, view) => {
    make.left.right.top.inset(0);
    make.bottom.equalTo(view.super.safeAreaTop).inset(-25);
  },
  2: (make, view) => {
    make.left.right.top.inset(0);
    make.bottom.equalTo(view.super.safeAreaTop).inset(-50);
  },
  3: (make, view) => {
    make.left.right.top.inset(0);
    make.bottom.equalTo(view.super.safeAreaTop).inset(-100);
  }
};

class CustomNavigationBar extends BaseView {
  constructor({ props, events = {} } = {}) {
    super();
    this._props = {
      leftBarButtonItems: [],
      rightBarButtonItems: [],
      style: navBarStyles.normal,
      tintColor: $color("primaryText"),
      //bgcolor: $color("clear"),
      ...props
    };
    this._events = events;
  }

  _defineView() {
    /*
    设计思路
    一共5个子视图: 
      - contentView  下有3个子视图
          - leftItemView  popButton或者leftButtonItems
          - rightItemView  rightButtonItems
          - titleView  
      - toolView  
    */
    this.cviews = {};

    // leftItemView
    let leftInset = 0;
    if (this._props.popButtonEnabled) {
      const titleWidth = this._props.popButtonTitle
        ? getTextWidth(this._props.popButtonTitle)
        : 0;
      leftInset = titleWidth + 35;
      const views = [];
      views.push({
        type: "view",
        props: {},
        layout: (make, view) => {
          make.left.top.bottom.inset(0);
          make.width.equalTo(35);
        },
        views: [
          {
            type: "image",
            props: {
              symbol: "chevron.left",
              contentMode: 1,
              tintColor: this._props.tintColor
            },
            layout: make => make.edges.insets($insets(12.5, 10, 12.5, 0))
          }
        ]
      });
      if (this._props.popButtonTitle)
        views.push({
          type: "label",
          props: {
            align: $align.left,
            text: this._props.popButtonTitle,
            font: $font(17),
            textColor: this._props.tintColor
          },
          layout: (make, view) => {
            make.top.bottom.right.inset(0);
            make.left.equalTo(view.prev.right);
          }
        });
      this.cviews.leftItemView = new Button({
        props: {
          bgcolor: $color("clear"),
          cornerRadius: 0
        },
        views,
        layout: (make, view) => {
          make.width.equalTo(leftInset);
          make.left.top.bottom.inset(0);
        },
        events: {
          tapped: sender => {
            if (this._events.popHandler) this._events.popHandler(this);
            $ui.pop();
          },
          longPressed: this._props.popToRootEnabled
            ? sender => {
                if (this._events.popToRootHandler)
                  this._events.popToRootHandler(this);
                $ui.popToRoot();
              }
            : undefined
        }
      });
    } else {
      leftInset = this._calculateItemViewWidth(this._props.leftBarButtonItems);
      this.cviews.leftItemView = new ContentView({
        props: {
          bgcolor: undefined
        },
        layout: (make, view) => {
          make.width.equalTo(leftInset);
          make.left.top.bottom.inset(0);
        },
        views: this._createCviewsOnItemView(this._props.leftBarButtonItems).map(
          n => n.definition
        )
      });
    }

    // rightItemView
    const rightInset = this._calculateItemViewWidth(
      this._props.rightBarButtonItems
    );
    this.cviews.rightItemView = new ContentView({
      props: {
        bgcolor: undefined
      },
      layout: (make, view) => {
        make.width.equalTo(rightInset);
        make.right.top.bottom.inset(0);
      },
      views: this._createCviewsOnItemView(this._props.rightBarButtonItems).map(
        n => n.definition
      )
    });

    // titleView
    const titleViewInset = Math.max(leftInset, rightInset);
    if (this._props.title) {
      this.cviews.titleViewWrapper = new Label({
        props: {
          text: this._props.title,
          font: $font("bold", 17),
          align: $align.center,
          textColor: this._props.tintColor,
          userInteractionEnabled: true
        },
        layout: (make, view) => {
          make.left.right.inset(titleViewInset);
          make.top.bottom.inset(0);
        },
        events: {
          tapped: sender => {
            if (this._events.titleTapped) this._events.titleTapped(this);
          }
        }
      });
    } else {
      this.cviews.titleViewWrapper = new ContentView({
        props: {
          bgcolor: undefined
        },
        layout: (make, view) => {
          make.left.right.inset(titleViewInset);
          make.top.bottom.inset(0);
        },
        views: this._props.titleView && [this._props.titleView.definition]
      });
    }

    // contentView
    this.cviews.contentView = new ContentView({
      props: {
        bgcolor: undefined
      },
      layout: (make, view) => {
        make.left.right.top.inset(0);
        make.height.equalTo(50);
      },
      views: [
        this.cviews.titleViewWrapper.definition,
        this.cviews.leftItemView.definition,
        this.cviews.rightItemView.definition
      ]
    });

    // toolView
    this.cviews.toolViewWrapper = new ContentView({
      props: {
        bgcolor: undefined
      },
      layout: (make, view) => {
        make.left.right.bottom.equalTo(view.super);
        make.top.equalTo(view.super).inset(50);
      },
      views: this._props.toolView && [this._props.toolView.definition]
    });
    return {
      type: this._props.bgcolor ? "view" : "blur",
      props: {
        id: this.id,
        style: this._props.bgcolor ? undefined : 10,
        bgcolor: this._props.bgcolor
      },
      layout: navBarLayouts[this._props.style],
      events: {
        ready: sender => (this.style = this.style)
      },
      views: [
        {
          type: "view",
          props: {},
          layout: $layout.fillSafeArea,
          views: [
            this.cviews.contentView.definition,
            this.cviews.toolViewWrapper.definition
          ]
        },
        {
          type: "view",
          props: {
            bgcolor: $color("separatorColor")
          },
          layout: (make, view) => {
            make.bottom.left.right.inset(0);
            make.height.equalTo(0.5);
          }
        }
      ]
    };
  }

  _calculateItemViewWidth(items) {
    if (!items || items.length === 0) return 0;
    let width = 0;
    items.forEach(n => {
      if (n instanceof BaseView) width += n.width || 50;
      else if (n.title) width += getTextWidth(n.title, { inset: 20 });
      else width += 50;
    });
    return width;
  }

  _createCviewsOnItemView(items) {
    return items.map(n => {
      if (n instanceof BaseView) {
        const width = n.width || 50;
        n._layout = (make, view) => {
          make.top.bottom.inset(0);
          make.width.equalTo(width);
          make.left.equalTo((view.prev && view.prev.right) || 0);
        };
        return n;
      } else if (n.title) {
        const width = getTextWidth(n.title, { inset: 20 });
        return new Button({
          props: {
            title: n.title,
            bgcolor: $color("clear"),
            titleColor: this._props.tintColor,
            cornerRadius: 0
          },
          layout: (make, view) => {
            make.top.bottom.inset(0);
            make.width.equalTo(width);
            make.left.equalTo((view.prev && view.prev.right) || 0);
          },
          events: {
            tapped: n.handler
          }
        });
      } else if (n.symbol || n.image) {
        return new SymbolButton({
          props: {
            symbol: n.symbol,
            image: n.image,
            tintColor: this._props.tintColor
          },
          layout: (make, view) => {
            make.top.bottom.inset(0);
            make.width.equalTo(50);
            make.left.equalTo((view.prev && view.prev.right) || 0);
          },
          events: {
            tapped: n.handler
          }
        });
      }
    });
  }

  get title() {
    return this._props.title;
  }

  set title(title) {
    if (this._props.title === undefined) return;
    this._props.title = title;
    this.cviews.titleViewWrapper.view.text = title;
  }

  _changeLayout(layout, animated) {
    if (animated) {
      this.view.remakeLayout(layout);
      $ui.animate({
        duration: 0.3,
        animation: () => this.view.relayout()
      });
    } else {
      this.view.remakeLayout(layout);
    }
  }

  hide(animated = true) {
    this.view.hidden = false;
    this.cviews.leftItemView.view.hidden = true;
    this.cviews.rightItemView.view.hidden = true;
    this.cviews.toolViewWrapper.view.hidden = true;
    this.cviews.titleViewWrapper.view.hidden = true;
    this.view.remakeLayout(navBarLayouts[navBarStyles.hidden]);
    this.cviews.contentView.view.updateLayout(make => make.height.equalTo(0));
    if (animated) {
      $ui.animate({
        duration: 0.3,
        animation: () => {
          this.view.relayout();
          this.cviews.contentView.view.relayout();
        },
        completion: () => {
          this.view.hidden = true;
          if (this._events.hidden) this._events.hidden(this);
        }
      });
    } else {
      this.view.hidden = true;
      if (this._events.hidden) this._events.hidden(this);
    }
  }

  minimize(animated = true) {
    this.view.hidden = false;
    this.cviews.leftItemView.view.hidden = true;
    this.cviews.rightItemView.view.hidden = true;
    this.cviews.toolViewWrapper.view.hidden = true;
    this.cviews.titleViewWrapper.view.hidden = false;
    this.view.remakeLayout(navBarLayouts[navBarStyles.minimized]);
    this.cviews.contentView.view.updateLayout(make => make.height.equalTo(25));
    if (animated) {
      $ui.animate({
        duration: 0.3,
        animation: () => {
          this.view.relayout();
          this.cviews.contentView.view.relayout();
          if (this._props.title)
            this.cviews.titleViewWrapper.view.font = $font("bold", 14);
        },
        completion: () => {
          if (this._events.minimized) this._events.minimized(this);
        }
      });
    } else {
      if (this._props.title)
        this.cviews.titleViewWrapper.view.font = $font("bold", 14);
      if (this._events.minimized) this._events.minimized(this);
    }
  }

  restore(animated = true) {
    this.view.hidden = false;
    this.cviews.titleViewWrapper.view.hidden = false;
    //this.cviews.toolViewWrapper.view.hidden = true;
    this.view.remakeLayout(navBarLayouts[navBarStyles.normal]);
    this.cviews.contentView.view.updateLayout(make => make.height.equalTo(50));
    if (animated) {
      $ui.animate({
        duration: 0.3,
        animation: () => {
          this.view.relayout();
          this.cviews.contentView.view.relayout();
          if (this._props.title)
            this.cviews.titleViewWrapper.view.font = $font("bold", 17);
        },
        completion: () => {
          this.cviews.leftItemView.view.hidden = false;
          this.cviews.rightItemView.view.hidden = false;
          if (this._events.restored) this._events.restored(this);
        }
      });
    } else {
      this.cviews.leftItemView.view.hidden = false;
      this.cviews.rightItemView.view.hidden = false;
      if (this._props.title)
        this.cviews.titleViewWrapper.view.font = $font("bold", 17);
      if (this._events.restored) this._events.restored(this);
    }
  }

  expand(animated = true) {
    this.view.hidden = false;
    this.cviews.toolViewWrapper.view.hidden = false;
    this.cviews.titleViewWrapper.view.hidden = false;
    this.view.remakeLayout(navBarLayouts[navBarStyles.expanded]);
    this.cviews.contentView.view.updateLayout(make => make.height.equalTo(50));
    if (animated) {
      $ui.animate({
        duration: 0.3,
        animation: () => {
          this.view.relayout();
          this.cviews.contentView.view.relayout();
          if (this._props.title)
            this.cviews.titleViewWrapper.view.font = $font("bold", 17);
        },
        completion: () => {
          this.cviews.leftItemView.view.hidden = false;
          this.cviews.rightItemView.view.hidden = false;
          //this.cviews.toolViewWrapper.view.hidden = false;
          if (this._events.expanded) this._events.expanded(this);
        }
      });
    } else {
      this.cviews.leftItemView.view.hidden = false;
      this.cviews.rightItemView.view.hidden = false;
      //this.cviews.toolViewWrapper.view.hidden = false;
      if (this._props.title)
        this.cviews.titleViewWrapper.view.font = $font("bold", 17);
      if (this._events.expanded) this._events.expanded(this);
    }
  }

  get style() {
    return this._props.style;
  }

  set style(num) {
    this._props.style = num;
    switch (num) {
      case 0: {
        this.hide();
        break;
      }
      case 1: {
        this.minimize();
        break;
      }
      case 2: {
        this.restore();
        break;
      }
      case 3: {
        this.expand();
        break;
      }
      default:
        break;
    }
  }
}

module.exports = CustomNavigationBar;

},{"cview-baseview":1,"cview-singleviews":5,"cview-symbol-button":6,"cview-util-ui":9}],3:[function(require,module,exports){
const Sheet = require("cview-sheet");
const CustomNavigationBar = require("cview-custom-navigationbar");
const { l10n } = require("cview-util-localization");

class DialogSheet extends Sheet {
  constructor({ props }) {
    super({
      presentMode: props.presentMode || $device.isIpad ? 2 : 1,
      bgcolor: props.bgcolor
    });
    this._props = props;
    this._done = false;
  }

  promisify(resolve, reject) {
    this.resolve = resolve;
    this.reject = reject;
  }

  present() {
    this._dismissalHandler = () => {
      if (!this._done && this.reject) this.reject("cancel");
    };
    this._navbar = this._defineNavBar();
    this._props.cview._layout = (make, view) => {
      make.bottom.equalTo(view.super);
      make.left.right.equalTo(view.super.safeArea);
      make.top.equalTo(view.prev.bottom);
    };
    this._view = {
      type: "view",
      props: {},
      views: [this._navbar.definition, this._props.cview.definition]
    };
    super.present();
  }

  done() {
    this._done = true;
    if (this.resolve && this._props.cview.result)
      this.resolve(this._props.cview.result());
    this.dismiss();
  }

  _defineNavBar() {
    return new CustomNavigationBar({
      props: {
        title: this._props.title,
        leftBarButtonItems: [
          { symbol: "xmark", handler: () => this.dismiss() }
        ],
        rightBarButtonItems: [
          { title: l10n("DONE"), handler: () => this.done() }
        ]
      }
    });
  }
}

module.exports = DialogSheet;

},{"cview-custom-navigationbar":2,"cview-sheet":4,"cview-util-localization":8}],4:[function(require,module,exports){
const cvid = require("cview-util-cvid");

const UIModalPresentationStyle = {
  automatic: -2,
  pageSheet: 1,
  formSheet: 2,
  fullScreen: 0,
  currentContext: 3,
  custom: 4,
  overFullScreen: 5,
  overCurrentContext: 6,
  popover: 7,
  none: -1
};

class Sheet {
  constructor({
    presentMode = UIModalPresentationStyle.pageSheet,
    animated = true,
    interactiveDismissalDisabled = false,
    bgcolor = $color("secondarySurface"),
    view,
    dismissalHandler
  } = {}) {
    this._animated = animated;
    this._presentMode = presentMode;
    this._interactiveDismissalDisabled = interactiveDismissalDisabled;
    this._bgcolor = bgcolor;
    this._view = view;
    this._dismissalHandler = dismissalHandler;
    this.id = cvid.newId;
    
  }

  _create() {
    this._define();
    this._PSViewController = $objc(this.id).invoke("alloc.init");
    this._PSViewControllerView = this._PSViewController.$view();
    this._PSViewControllerView.$setBackgroundColor(this._bgcolor);
    this._PSViewController.$setModalPresentationStyle(this._presentMode);
    if (this._interactiveDismissalDisabled)
      this._PSViewController.$setModalInPresentation(true);
    if (this._view) this._add(this._view);
  }

  _define() {
    $define({
      type: this.id + ": UIViewController",
      events: {
        "viewDidDisappear:": () => {
          if (this._dismissalHandler) this._dismissalHandler();
        }
      }
    });
  }

  _add(view) {
    view.layout = $layout.fill
    this._PSViewControllerView.jsValue().add(view);
  }

  present() {
    this._create()
    $ui.vc
      .ocValue()
      .invoke(
        "presentModalViewController:animated",
        this._PSViewController,
        this._animated
      );
  }

  dismiss() {
    this._PSViewController.invoke("dismissModalViewControllerAnimated", true);
  }
}

module.exports = Sheet;

},{"cview-util-cvid":7}],5:[function(require,module,exports){
const BaseView = require("cview-baseview");

class SingleView extends BaseView {
  constructor({ type = "view", props, layout, events, views } = {}) {
    super();
    this._type = type;
    this._props = props;
    this._layout = layout;
    this._events = events;
    this._views = views;
  }

  _defineView() {
    return {
      type: this._type,
      props: {
        ...this._props,
        id: this.id
      },
      layout: this._layout,
      events: this._events,
      views: this._views
    };
  }
}

class RootView extends SingleView {
  constructor({ layout = $layout.fill, events, views } = {}) {
    super({ layout, events, views });
    this._props = { bgcolor: $color("clear") };
  }
}

class ContentView extends SingleView {
  constructor({
    props,
    layout = $layout.fillSafeArea,
    events = {},
    views
  } = {}) {
    super({ layout, events, views });
    this._props = { bgcolor: $color("primarySurface"), ...props };
  }
}

/**
 * 遮挡视图，使得下面的view无法操作并且整体变暗。
 * 设计上此视图不单独使用，而是作为一个子视图
 * events:
 *   - tapped 点击事件，通常用于dismiss
 */
class MaskView extends SingleView {
  constructor({ props, layout = $layout.fill, events, views } = {}) {
    super({ layout, events, views });
    this._props = {
      bgcolor: $rgba(0, 0, 0, 0.2),
      ...props,
      userInteractionEnabled: true
    };
  }
}

class Label extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "label",
      props,
      layout,
      events,
      views
    });
  }
}

class Button extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "button",
      props,
      layout,
      events,
      views
    });
  }
}

class Input extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "input",
      props,
      layout,
      events,
      views
    });
  }
}

class Slider extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "slider",
      props,
      layout,
      events,
      views
    });
  }
}

class Switch extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "switch",
      props,
      layout,
      events,
      views
    });
  }
}

class Spinner extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "spinner",
      props,
      layout,
      events,
      views
    });
  }
}

class Progress extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "progress",
      props,
      layout,
      events,
      views
    });
  }
}

class Gallery extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "gallery",
      props,
      layout,
      events,
      views
    });
  }
}

class Stepper extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "stepper",
      props,
      layout,
      events,
      views
    });
  }
}

class Text extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "text",
      props,
      layout,
      events,
      views
    });
  }
}

class Image extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "image",
      props,
      layout,
      events,
      views
    });
  }
}

class Video extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "video",
      props,
      layout,
      events,
      views
    });
  }
}

class Scroll extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "scroll",
      props,
      layout,
      events,
      views
    });
  }
}

class Stack extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "stack",
      props,
      layout,
      events,
      views
    });
  }
}

class Tab extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "tab",
      props,
      layout,
      events,
      views
    });
  }
}

class Menu extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "menu",
      props,
      layout,
      events,
      views
    });
  }
}

class Map extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "map",
      props,
      layout,
      events,
      views
    });
  }
}

class Web extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "web",
      props,
      layout,
      events,
      views
    });
  }
}

class List extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "list",
      props,
      layout,
      events,
      views
    });
  }
}

class Matrix extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "matrix",
      props,
      layout,
      events,
      views
    });
  }
}

class Blur extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "blur",
      props,
      layout,
      events,
      views
    });
  }
}

class Gradient extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "gradient",
      props,
      layout,
      events,
      views
    });
  }
}

class DatePicker extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "datepicker",
      props,
      layout,
      events,
      views
    });
  }
}

class Picker extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "picker",
      props,
      layout,
      events,
      views
    });
  }
}

class Canvas extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "canvas",
      props,
      layout,
      events,
      views
    });
  }
}

class Markdown extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "markdown",
      props,
      layout,
      events,
      views
    });
  }
}

class Lottie extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "lottie",
      props,
      layout,
      events,
      views
    });
  }
}

class Chart extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "chart",
      props,
      layout,
      events,
      views
    });
  }
}

class Code extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "code",
      props,
      layout,
      events,
      views
    });
  }
}

class Runtime extends SingleView {
  constructor({ props, layout, events, views } = {}) {
    super({
      type: "runtime",
      props,
      layout,
      events,
      views
    });
  }
}

module.exports = {
  RootView,
  ContentView,
  MaskView,
  Label,
  Button,
  Input,
  Slider,
  Switch,
  Spinner,
  Progress,
  Gallery,
  Stepper,
  Text,
  Image,
  Video,
  Scroll,
  Stack,
  Tab,
  Menu,
  Map,
  Web,
  List,
  Matrix,
  Blur,
  Gradient,
  DatePicker,
  Picker,
  Canvas,
  Markdown,
  Lottie,
  Chart,
  Code,
  Runtime
};

},{"cview-baseview":1}],6:[function(require,module,exports){
const BaseView = require("cview-baseview");

/**
 * 创建可以自动规范symbol大小的button，兼容image，可以设定insets
 * props:
 *   - symbol
 *   - image
 *   - tintColor
 *   - insets
 * events:
 *   - tapped
 */
class SymbolButton extends BaseView {
  constructor({ props, layout, events = {} } = {}) {
    super();
    this._props = {
      insets: $insets(12.5, 12.5, 12.5, 12.5),
      tintColor: $color("primaryText"),
      ...props
    };
    this._layout = layout;
    this._events = events;
  }

  _defineView() {
    return {
      type: "button",
      props: {
        radius: 0,
        bgcolor: $color("clear"),
        id: this.id
      },
      views: [
        {
          type: "image",
          props: {
            id: "image",
            symbol: this._props.symbol,
            image: this._props.image,
            src: this._props.src,
            tintColor: this._props.tintColor,
            contentMode: 1
          },
          layout: (make, view) => {
            make.edges.insets(this._props.insets);
            make.centerX.equalTo(view.super);
            make.width.equalTo(view.height);
          }
        }
      ],
      layout: this._layout,
      events: {
        ...this._events
      }
    };
  }

  set tintColor(tintColor) {
    this.view.get("image").tintColor = tintColor;
  }

  set symbol(symbol) {
    this._props.symbol = symbol;
    this.view.get("image").symbol = symbol;
  }

  get symbol() {
    return this._props.symbol;
  }
}

module.exports = SymbolButton;

},{"cview-baseview":1}],7:[function(require,module,exports){
function makeid(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

class ID {
  constructor({ prefix = "id_", startNumber = 0 } = {}) {
    this.prefix = prefix;
    this.number = startNumber;
    this._aliasIds = {};
  }

  get newId() {
    return this.generateNewIdWithAlias();
  }

  generateNewIdWithAlias(alias) {
    const number = this.number;
    this.number++;
    const id = this.prefix + number;
    if (alias) {
      this._addIdToAlias(alias, id);
    }
    return id;
  }

  getAliasId(alias) {
    const ids = this._aliasIds[alias];
    if (ids) {
      return ids[0];
    } else {
      return;
    }
  }

  getAliasAllIds(alias) {
    const ids = this._aliasIds[alias];
    if (ids) {
      return ids;
    } else {
      return;
    }
  }

  _addIdToAlias(alias, id) {
    if (!this._aliasIds[alias]) this._aliasIds[alias] = [];
    this._aliasIds[alias].push(id);
  }
}

const cvid = new ID({ prefix: makeid(8) + "_" });

module.exports = cvid;

},{}],8:[function(require,module,exports){
const language = $device.info.language

const strings = {
  "zh-Hans": {
    "DUPLICATE_VALUES": "取值重复",
    "DONE": "完成",
    "ADD": "添加",
    "SEARCH": "搜索",
    "PREVIOUS": "上一步",
    "NEXT": "下一步",
    "REMOVE": "移除",
    "EDIT": "编辑",
    "FINISHED": "完成",
    "INVALID_VALUES": "取值不合法",
    "CANCEL": "取消",
    "CLIPBOARD": "剪贴板",
    "OK": "好的"
  },
  "en": {
    "DUPLICATE_VALUES": "Duplicate values",
    "DONE": "Done",
    "ADD": "Add",
    "SEARCH": "Search",
    "PREVIOUS": "Previous",
    "NEXT": "Next",
    "REMOVE": "Remove",
    "EDIT": "Edit",
    "FINISHED": "Finished",
    "INVALID_VALUES": "Invalid values",
    "CANCEL": "Cancel",
    "CLIPBOARD": "Clipboard",
    "OK": "OK"
  }
}

function l10n(key) {
  if (!strings[language]) return key;
  const value = strings[language][key]
  return value || key
}

module.exports = {
  strings,
  l10n
}
},{}],9:[function(require,module,exports){
// 立即获得window size
function getWindowSize() {
  const window = $objc("UIWindow").$keyWindow().jsValue();
  return window.size;
}

// 获取单行字符串应有的宽度
// 默认额外添加3 inset
function getTextWidth(text, { font = $font(17), inset = 3 } = {}) {
  return (
    Math.ceil(
      $text.sizeThatFits({
        text,
        width: 10000,
        font,
        lineSpacing: 0
      }).width
    ) + inset
  );
}

// 获取字符串指定宽度后应有的高度
// 默认额外添加3 inset
function getTextHeight(
  text,
  { width = 300, font = $font(17), inset = 3 } = {}
) {
  return (
    Math.ceil(
      $text.sizeThatFits({
        text,
        width,
        font,
        lineSpacing: 0
      }).height
    ) + inset
  );
}

// 计算某个view在某个上级view（若不指定则为UIWindow）上的绝对frame
// 此方法不考虑旋转变形等特殊情况
// P.S. 结合rect.center($rect)即可得到中点
function absoluteFrame(view, endView) {
  const frame = view.frame;
  let superView = view.super;
  while (superView) {
    frame.x += superView.frame.x - superView.bounds.x;
    frame.y += superView.frame.y - superView.bounds.y;
    if (endView && superView === endView) break;
    superView = superView.super;
  }
  return frame;
}

const commonOptions = {
  none: {
    cornerRadius: 0,
    shadowRadius: 0,
    shadowOpacity: 0,
    shadowOffset: $size(0, 0),
    shadowColor: $color("clear")
  },
  roundedShadow: {
    cornerRadius: 12,
    shadowRadius: 10,
    shadowOpacity: 1,
    shadowOffset: $size(0, 0),
    shadowColor: $color("black")
  },
  textShadow: {
    cornerRadius: 0,
    shadowRadius: 1.2,
    shadowOpacity: 1,
    shadowOffset: $size(0, 1),
    shadowColor: $color("black")
  },
  circleViewShadow: {
    cornerRadius: 25,
    shadowRadius: 3,
    shadowOpacity: 0.6,
    shadowOffset: $size(0, 3),
    shadowColor: $color("black")
  },
  toastShadows: {
    cornerRadius: 15,
    shadowRadius: 8,
    shadowOpacity: 0.35,
    shadowOffset: $size(0, 0),
    shadowColor: $color("black")
  }
};

// 在layout中使用
// 所应用的view不可以指定radius和clipTobounds，否则无效
function setLayer(
  view,
  {
    cornerRadius = 0,
    shadowRadius = 0,
    shadowOpacity = 0,
    shadowOffset = $size(0, 0),
    shadowColor = $color("clear")
  } = {}
) {
  const layer = view.runtimeValue().invoke("layer");
  layer.invoke("setCornerRadius", cornerRadius);
  layer.invoke("setShadowRadius", shadowRadius);
  layer.invoke("setShadowOpacity", shadowOpacity);
  layer.invoke("setShadowOffset", shadowOffset);
  layer.invoke("setShadowColor", shadowColor.runtimeValue().invoke("CGColor"));
}


module.exports = {
  getWindowSize,
  getTextWidth,
  getTextHeight,
  absoluteFrame,
  commonOptions,
  setLayer
};

},{}],10:[function(require,module,exports){
const { Web: WebView, ContentView } = require("cview-singleviews");
const Sheet = require("cview-dialog-sheet");
const SymbolButton = require("cview-symbol-button");

function getAllCookies(webView) {
  return new Promise((resolve, reject) => {
    const httpCookieStore = webView
      .ocValue()
      .invoke("configuration")
      .invoke("websiteDataStore")
      .invoke("httpCookieStore");
    const handler = $block("void, NSArray *", function (array) {
      const list = [];
      const length = array.$count();
      for (let index = 0; index < length; index++) {
        const element = array.$objectAtIndex_(index);
        list.push(element);
      }
      resolve(
        list.map(n => {
          return {
            domain: n.$domain().jsValue(),
            path: n.$path().jsValue(),
            version: n.$version(),
            sessionOnly: n.$sessionOnly(),
            name: n.$name().jsValue(),
            value: n.$value().jsValue(),
            HTTPOnly: n.$HTTPOnly(),
            secure: n.$secure()
          };
        })
      );
    });
    httpCookieStore.$getAllCookies_(handler);
  });
}

function presentSheet(url) {
  let flagLoading = false;
  const loadButton = new SymbolButton({
    props: {
      symbol: "arrow.counterclockwise"
    },
    events: {
      tapped: sender => {
        if (flagLoading) webView.view.stopLoading();
        else webView.view.reload();
      }
    }
  });
  const startLoading = () => {
    flagLoading = true;
    loadButton.symbol = "xmark";
  };
  const stopLoading = () => {
    flagLoading = false;
    loadButton.symbol = "arrow.counterclockwise";
  };
  const footerbar = new ContentView({
    props: {
      bgcolor: $color("tertiarySurface")
    },
    layout: (make, view) => {
      make.left.right.bottom.inset(0);
      make.top.equalTo(view.super.safeAreaBottom).inset(-50);
    },
    views: [
      {
        type: "stack",
        props: {
          axis: $stackViewAxis.horizontal,
          distribution: $stackViewDistribution.equalSpacing,
          stack: {
            views: [
              new SymbolButton({
                props: {
                  symbol: "chevron.left"
                },
                events: {
                  tapped: sender => webView.view.goBack()
                }
              }).definition,
              new SymbolButton({
                props: {
                  symbol: "chevron.right"
                },
                events: {
                  tapped: sender => webView.view.goForward()
                }
              }).definition,
              loadButton.definition,
              new SymbolButton({
                props: {
                  symbol: "square.and.arrow.up"
                },
                events: {
                  tapped: sender => $share.sheet(webView.view.url)
                }
              }).definition
            ]
          }
        },
        layout: $layout.fillSafeArea
      }
    ]
  });
  const webView = new WebView({
    props: {
      url
    },
    layout: (make, view) => {
      make.bottom.equalTo(footerbar.view.top);
      make.top.left.right.equalTo(view.super.safeArea);
    },
    events: {
      decideNavigation: (sender, action) => {
        if (action.type === 0) {
          sender.url = action.requestURL;
          return false;
        }
        return true;
      },
      didStart: (sender, navigation) => startLoading(),
      didFinish: (sender, navigation) => stopLoading(),
      didFail: (sender, navigation, error) => stopLoading()
    }
  });

  const view = new ContentView({
    props: {
      bgcolor: $color("secondarySurface")
    },
    views: [footerbar.definition, webView.definition]
  });
  view.result = () => {
    return getAllCookies(webView.view);
  };
  const sheet = new Sheet({
    props: {
      presentMode: 1,
      title: "登录",
      cview: view
    }
  });
  return new Promise((resolve, reject) => {
    sheet.promisify(resolve, reject);
    sheet.present();
  });
}

async function getCookies(url) {
  const cookies = await presentSheet(url);
  return cookies;
}

module.exports = getCookies;

},{"cview-dialog-sheet":3,"cview-singleviews":5,"cview-symbol-button":6}],11:[function(require,module,exports){
const getCookies = require(".")

getCookies("https://bean.m.jd.com").then(result => {
  const cookieString = result.filter((n) => n.domain.includes("jd.com"))
  .map((n) => n.name + "=" + n.value)
  .join("; ");
  $ui.alert({
    title: "已获取Cookie",
    actions: [
      {
        title: "取消",
        style: $alertActionType.destructive
      },
      {
        title: "复制",
        handler: function() {
          $clipboard.text = cookieString
        }
      }
    ]
  });
});
},{".":10}]},{},[11]);
