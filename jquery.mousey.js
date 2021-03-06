(function($) {

   /**
    * Examples:
    * <code>
    *    var $point3 = $('#point3');
    *
    *    function efx() {
    *       // do something amazing
    *    }
    *
    *    // set a global property (affects all calls to mousey)
    *    $.fn.mousey.defaults.hoverEffect = false; // disables the hover animation for all mousey objects
    *
    *    $('#mousey')
    *        // set the animation duration for this mousey object, don't animate anything yet
    *        // (calling init is optional)
    *        .mousey( 'init', {duration: 750} )
    *
    *        // click on center of point 1
    *        .mousey( '#point1' )
    *
    *        // move mousey to top left of point 2, then run `efx`, disable the click animation
    *        .mousey( { at: 'left top', of: '#point2', clickEffect: false, complete: efx } )
    *
    *        // pause at point 2 for 2 seconds by "moving" it nowhere
    *        .mousey( { at: 'left top', of: '#point2', duration: 2000, clickEffect: false, mouseImage: 'hourglass.gif' } )
    *
    *        // move mousey to the coords 100,100 on the document with a custom duration
    *        .mousey( { at: '100 100', duration: 250 } )
    *
    *        // click on center of point 3, then hide the mousey
    *        .mousey( { of: $point3, hide: 100 } );
    *
    * </code>
    *
    * The first time mousey() is called, the mousey image is created and the object is initialized, even if you
    * do not call init first.
    *
    * Any of the parameters found in $.fn.mousey.defaults can be passed to mousey for init or during any animation.
    *
    * Global parameters can be overridden using $.fn.mousey.defaults.optionName = value;
    *
    * @param {Object}               [opts]  if dest === 'init', this overrides default properties (see description)
    */
   $.fn.mousey = function(opts) {
      var init = (opts === 'init'), props = _init(this, init? arguments[1] : opts);
      if( !init ) {
         // can't be done in init since the images may differ per call
         _preload(props);

         // restores the original mousey image whenever a new animation starts, must be in the queue because if not
         // then it may get restored immediately (before prior queued events run to alter it) which would be bad
         this.queue(function(next) {
            $(this).find('.mousey-mouseImage').attr('src', props.mouseImage);
            next();
         })

            // reveal our mousey and run the animation to move it appropriately
            .show().animate(_pos(props), _animProps(props));

         if( props.click ) {
            // simply queue up the click effect to occur directly after our animate() call is completed
            this.queue(function(next) {
               props.clickEffect.call(this, props);
               if( props.realClick ) {
                  _realClick($(opts.of), $(this).offset);
               }
               next();
            });
         }

         if( props.hide === 0 || props.hide ) {
            // simply queue up our hide effect to occur directly after the animate and possibly the click event
            this.queue(function(next) {
               $(this).hide(props.hide, function() {
                  // when we hide the mouse, deactivate all hover effects
                  _checkHoveredElements(_bounds($(this)), props.shared.hovered, true);
               });
               next();
            });
         }
      }
      return this;
   };

   /**
    * Determine if rectangle `a` is inside of rectangle `b` (it must be completely inside)
    *
    * Both `a` and `b` are hash objects (jQuery.isPlainObject) and must have attributes {int} top/left/bottom/right.
    *
    * @static
    * @param {object} a
    * @param {object} b
    * @return {Boolean}
    */
   $.fn.mousey.inside = function(a, b) {
      return(a.left < b.right && a.right > b.left &&
            a.top < b.bottom && a.bottom > b.top);
   };

   $.fn.mousey.defaults = {
      /** @var {String} the "left top" positions, which can be any of 'left|middle|center|right|integer top|middle|center|bottom|integer' */
      at: 'center center',

      /** @var {jQUery|string} the element mousey will begin moving away from initially (and for other calls, what it moves towards) */
      of:  'body',

      /** @var {string} url to the default mouse image */
      mouseImage:  'pointer-arrow.png',

      /** @var {string} url to image we display in hoverEffect */
      hoverImage:   'pointer-hand.png',

      /** @var {string} url to image we display in clickEffect */
      clickImage:  'clicky.png',

      /** @var {int} ensures mousey appears above other layers */
      zIndex: 9999,

      /** @var {bool} true means show the click effect, false means disable it */
      click: true,

      /** @var {bool} true means show the hover effect, false means disable it */
      hover: true,

      /**
       * If click === true, this is the effect used. `this` is set to the mousey object, the config
       * options are passed as an argument to the function call
       *
       * @var {Function}
       */
      clickEffect: function(opts) {
         var $c = $('<img src="'+opts.clickImage+'" />').css('display', 'none').appendTo('body'), off = _clickOff($(this), $c);
         $c.offset(off).css({position: 'absolute', zIndex: opts.zIndex-1, display: 'block'})
               .fadeOut(Math.max(Math.min(750, opts.duration), 10), function() {
                  $c.remove(); $c = null;
               });
      },

      /**
       * If hover === true, this is invoked when mousey determines that we have entered the bounds of the container
       * @var {Function}
       */
      hoverIn:     function(opts) {
         $(opts.of).addClass(opts.hoverStyles).trigger('mouseenter');
         $(this).find('.mousey-mouseImage').attr('src', opts.hoverImage);
      },

      /**
       * If hover === true, this is invoked when mousey determines that we have left the bounds of the container
       * @var {Function}
       */
      hoverOut: function(opts) {
         $(opts.of).removeClass(opts.hoverStyles).trigger('mouseleave');
         $(this).find('.mousey-mouseImage').attr('src', opts.mouseImage);
      },

      /** @var {string} CSS classes added by hoverIn() and hoverOut() */
      hoverStyles: 'active hover',

      /** @var {int} this is passed straight to jQuery.fn.animate */
      duration:    800,

      /** @var {String} this is passed straight to jQuery.fn.animate */
      easing:      'swing',

      /** @var {Function} this is passed straight to jQuery.fn.animate */
      complete:    null,

      /** @var {bool|int} if set to an int value (0 is okay), the mousey is hidden after movement completes */
      hide: false,

      /** @var {bool} if true, click() event is actually fired on target (listeners must be declared with jQuery.fn.click(fx)) */
      realClick: false
   };

   /**
    * The first time this is called, it initializes the mousey object and caches it using jQuery.fn.data, overriding
    * any defaults supplied by `opts`. After the initial call, this simply loads the defaults, overrides anything
    * provided in opts, and returns the combined set.
    *
    * @param {jQuery}  $e
    * @param {object}  opts hash of values to override `$.fn.mousey.defaults`
    * @return {object} hash containing the merged defaults for this instance
    * @private
    */
   function _init($e, opts) {
      var props = $e.data('mouseyProps'), $p;
      if( !$.isPlainObject(opts) ) { opts = {of: opts}; }
      if( !props ) {
         $p = $e.parent();
         props = $.extend({}, $.fn.mousey.defaults, opts, {shared: {hovered: []}});
         $e.css({display: 'none', position: 'absolute', zIndex: props.zIndex})
               .addClass('Mousey')
               .append('<img class="mousey-mouseImage" src="'+props.mouseImage+'" />')
               .data('mouseyProps', props);
         if( !$p.length || $p.get(0).tagName.toLowerCase() != 'body' ) {
            $e.appendTo('body');
         }
         $e.offset(_pos(props));
      }
      return $.extend({}, props, opts, {ofBox: null, isIn: false});
   }

   /**
    * True if $e is the `window` or `document` global variable
    * @param {jQuery} $e
    * @return {Boolean}
    */
   function isWinOrDoc($e) {
      var e = $e.get(0);
      return e === window || e === document;
   }

   /**
    * Get width of `$e`, including padding but sans margins, taking care with document and window
    * objects (which don't have innerWidth())
    * @param {jQuery} $e
    * @return {int}
    * @private
    */
   function _width($e) {
      return $e.width();//isWinOrDoc($e)? $e.width() : $e.innerWidth();
   }

   /**
    * Get height of `$e`, including padding but sans margins, taking care with document and window
    * objects (which don't have innerHeight())
    * @param {jQuery} $e
    * @return {int}
    * @private
    */
   function _height($e) {
      return $e.height(); //isWinOrDoc($e)? $e.height() : $e.innerHeight();
   }

   /**
    * Chains callbacks recursively so each gets called, with last added called first
    *
    * SIDE EFFECT: modifies opts object
    *
    * @param {object} opts
    * @param {string} fxName
    * @param {function} fxB
    * @private
    */
   function _ext(opts, fxName, fxB) {
      var fxA = opts[fxName];
      opts[fxName] = function() {
         var args = $.makeArray(arguments);
         fxB.apply(this, args);
         if( fxA ) { fxA.apply(this, args); }
      };
   }

   /**
    * Wraps effects as necessary
    *
    * SIDE EFFECT: modifies opts object
    *
    * @param {object} opts
    * @private
    */
   function _effects(opts) {
      _ext(opts, 'step', function(now, fx) { _hoverStep.call(this, opts); });
   }

   /**
    * Normally, this should not be overridden (except to disable the hover effect). This method determines
    * if mousey is inside the container and a hover should be shown. It should always call hoverIn and hoverOut
    * when mousey enters/leaves the container.
    *
    * It also does some magical caching of everything hovered, so that even if we don't leave the element until
    * the mousey is hidden or the next mousey event moves it, they still get un-hovered later.
    */
   function _hoverStep(opts) {
      // unfortunately, `bounds` can't be cached because it changes with each step (i.e. mousey moves one step closer)
      var $this = $(this), hovered = opts.shared.hovered, bounds = _bounds($this);

      // here we are taking the list of currently "inside" elements, checking each one, and
      // running hoverOut on each
      _checkHoveredElements(bounds, hovered);

      if( opts.hover && !opts.isIn ) {
         if( !opts.ofBox ) {
            // store the reference box so it doesn't have to be calculated during each call
            opts.ofBox = _bounds($(opts.of));
         }
         if( $.fn.mousey.inside(bounds, opts.ofBox) ) {
            opts.isIn = true;
            // pushing an array which contains itself (hovered is inside the shared array)
            // causes Firebug to crash with infinite recursion (even if you don't log the array!)
            // http://code.google.com/p/fbug/issues/detail?id=3663
            //
            // so here, we extend the opts and remove shared to prevent any recursion (also keeps any
            // handlers from modifying opts inadvertently)
            hovered.push($.extend({}, opts, {shared: null}));
            opts.hoverIn && opts.hoverIn.call(this, opts);
         }
      }
   }

   /**
    * Positions click image ($img) over $e
    * @param {jQuery} $e
    * @param {jQuery} $img
    * @return {Object} hash containing {int} left/top attributes
    * @private
    */
   function _clickOff($e, $img) {
      var off = _base($e), h = Math.floor($img.innerHeight()/2), w = Math.floor($img.innerWidth()/2);
      return {left: off.left-w, top: off.top-h}
   }

   /**
    * Wraps animate properties and inserts callbacks as needed
    *
    * SIDE EFFECT: modifies opts object
    *
    * @param {object} opts
    * @return {Object}
    * @private
    */
   function _animProps(opts) {
      var k, keys = ['easing', 'duration', 'complete', 'step'], i = keys.length, out = {};
      _effects(opts);
      while(i--) {
         k = keys[i];
         if( opts.hasOwnProperty(k) && opts[k] ) {
            out[k] = opts[k];
         }
      }
      return out;
   }

   /**
    * @param {object} opts
    * @return {Array} 0=horizontal, 1=vertical
    * @private
    */
   function _at(opts) {
      //todo
      //todo switch this for $.ws.Position lib
      //todo
      var at = opts.at.split(' ');
      if( at[0] === 'top' || at[0] === 'bottom' || at[1] === 'left' || at[1] === 'right' ) {
         at.reverse();
      }
      return at;
   }

   /**
    * Essentially, returns the offset of $e, but takes into account window and document objects, which do not
    * have an offset() method available to them.
    * @param {jQuery} $e
    * @return {object} with {int}top/left attributes
    * @private
    */
   function _base($e) { //todo make mousey use our new Position utility some day
      var e = $e.get(0);
      if( !e || e === document ) {
         return {left: 0, top: 0};
      }
      else if( e === window ) {
         return {left: $e.scrollLeft(), top: $e.scrollTop()};
      }
      else {
         return $e.offset();
      }
   }

   function _bounds($e) {
      var off = _base($e);
      return $.extend(off, {bottom: off.top+_height($e), right: off.left+_width($e)});
   }

   /**
    * Get the top/left coords where mousey should be positioned, based on opts.of and opts.at
    * @param opts
    * @return {Object}
    * @private
    */
   function _pos(opts) {
      var $e = $(opts.of), base = _base($e), at = _at(opts);
      return {left: _left($e, base, at[0]), top: _top($e, base, at[1])};
   }

   /**
    * Get the left coord relative to `base`, offset by `at`
    * @param {jQuery}     $e
    * @param {object}     base with keys {int}top/left
    * @param {int|string} at  {string}left|right|middle|center or {int}pixels
    * @return {int}
    * @private
    */
   function _left($e, base, at) {
      var left = base.left, w = _width($e);
      switch(at) {
         case 'left':
            return left;
         case 'right':
            return left+w;
         case 'middle':
         // fall through
         case 'center':
            return left + Math.floor(w/2);
         default: // treat it as a css value
            return left + ~~at;
      }
   }

   /**
    * Get the top coord relative to `base`, offset by `at`
    * @param {jQuery}     $e
    * @param {object}     base with keys {int}top/left
    * @param {int|string} at  {string}top|bottom|middle|center or {int}pixels
    * @return {int}
    * @private
    */
   function _top($e, base, at) {
      var top = base.top, h = _height($e);
      switch(at) {
         case 'top':
            return top;
         case 'bottom':
            return top+h;
         case 'middle':
         // fall through
         case 'center':
            return top + Math.floor(h/2);
         default: // treat it as a css value
            return top + ~~at;
      }
   }

   /**
    * Preload images
    * @param {Object} opts
    * @private
    */
   function _preload(opts) {
      if( opts.mouseImage ) {$('<img />')[0].src = opts.mouseImage; }
      if( opts.hoverImage ) {$('<img />')[0].src = opts.hoverImage; }
      if( opts.clickImage ) {$('<img />')[0].src = opts.clickImage; }
   }

   /**
    * Hide any items which are currently being hovered if we have left the bounding box
    *
    * @param {Array} hovered
    * @param {boolean} [all] when true, just call hoverOut on everything (don't check the position)
    */
   function _checkHoveredElements(bounds, hovered, all) {
      var opts, i = hovered.length;
      while(i--) {
         opts = hovered[i];
         if(all || !$.fn.mousey.inside(bounds, opts.ofBox) ) {
            opts.isIn = false;
            opts.hoverOut && opts.hoverOut.call(opts.of, opts);
            _remove(hovered, i);
         }
      }
   }

   function _realClick($e, offset) {
      // filter anything that doesn't have a click event and see if any are left
      var hasClick = $e.filter(':Event(!click)').length;
      if( $e.is('[data-toggle="dropdown"]') ) {
         $e.closest('.dropdown').addClass('open');
      }
      else if( !hasClick && $e.is('[href]') ) {
         window.location = $e.attr('href');
      }
      else {
         $e.click().focus();//$.Event('click', {pageX: offset.left, pageY: offset.top}));
      }
   }

   function _remove(array, from, to) {
      var rest = array.slice((to || from) + 1 || array.length);
      array.length = from < 0 ? array.length + from : from;
      return array.push.apply(array, rest);
   };

})(jQuery);