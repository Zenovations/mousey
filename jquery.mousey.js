
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
    * @param {Object|String|jQuery} dest    the next place to send the mousey (see description)
    * @param {Object}               [opts]  if dest === 'init', this overrides default properties (see description)
    */
   $.fn.mousey = function(dest, opts) {
      var combinedOpts, $img, init = (dest === 'init'),
            props = _init(this, opts);
      if( !init ) {
         combinedOpts = $.extend({}, props, $.isPlainObject(dest)? dest : {of: dest}, {inside: null});

         _preload(combinedOpts);

         // restores the original mousey image whenever a new animation starts, must be in the queue because if not
         // then it may get restored immediately (before queued events run to alter it)
         this.queue(function(next) {
            $(this).find('.mousey-mouseImage').attr('src', combinedOpts.mouseImage);
            next();
         })
            // reveal our mousey and run the animation to move it appropriately
               .show().animate(_off(combinedOpts), _animProps(combinedOpts));

         if( combinedOpts.clickEffect ) {
            // simply queue up the click effect to occur directly after our animate() call is completed
            this.queue(function(next) {
               combinedOpts.clickEffect.call(this, combinedOpts);
               next();
            });
         }

         if( combinedOpts.hide !== false ) {
            // simply queue up our hide effect to occur directly after the animate and possibly the click event
            this.queue(function(next) {
               $(this).hide(combinedOpts.hide);
               next();
            });
         }
      }
      return this;
   };

   $.fn.mousey.clickEffect = function(opts) {
      var $c = $('<img src="'+opts.clickImage+'" />').css('display', 'none').appendTo('body');
      $c.offset(_clickOff($(this), $c)).css({position: 'absolute', zIndex: opts.zIndex-1, display: 'block'})
            .fadeOut(Math.max(Math.min(750, opts.duration), 10), function() { $c.remove(); $c = null; });
   };

   $.fn.mousey.hoverEffect = function(now, fx, opts) {
      var $this = $(this), inside = opts.inside, isIn;
      if( !inside ) {
         inside = opts.inside = {box: _bounds($(opts.of)), isIn: null};
         $this.data('mousey-inside', inside);
      }
      isIn = $.fn.mousey.inside($this, inside.box);
      if( inside.isIn !== isIn ) {
         inside.isIn = isIn;
         $this.find('.mousey-mouseImage').attr('src', isIn? opts.hoverImage : opts.mouseImage);
      }
   };

   $.fn.mousey.inside = function($this, box) {
      var a = _bounds($this);
      return(a.left < box.right && a.right > box.left &&
            a.top < box.bottom && a.bottom > box.top);
   };

   var _bounds = function($e) {
      var off = $e.offset();
      return $.extend(off, {bottom: off.top+$e.innerHeight(), right: off.left+$e.innerWidth()});
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

      /**
       * If this is a function, it is called upon completion of the animation to create the click effect.
       * `this` is set to the object being animated, the config options are passed as an argument to the function call
       *
       * @var {Function}
       */
      clickEffect: $.fn.mousey.clickEffect,

      /**
       * If this is a function, it's called during each step of the animation, to create the over effect. The default
       * behavior is simply to display `hoverImage` until the animation is completed.
       *
       * `this` is set to the object being animated, the config options are passed as an argument to the function call
       */
      hoverEffect: $.fn.mousey.hoverEffect,

      /** @var {int} this is passed straight to jQuery.fn.animate */
      duration:    1200,

      /** @var {String} this is passed straight to jQuery.fn.animate */
      easing:      'swing',

      /** @var {Function} this is passed straight to jQuery.fn.animate */
      complete:    null,

      /** @var {bool|int} if set to an int value (0 is okay), the mousey is hidden after movement completes */
      hide: false
   };

   function _init($e, opts) {
      var props = $e.data('mousey-props');
      if( !props ) {
         props = $.extend({}, $.fn.mousey.defaults, opts);
         $e.css({display: 'none', position: 'absolute', zIndex: props.zIndex})
               .append('<img class="mousey-mouseImage" src="'+props.mouseImage+'" />')
               .data('mouseyProps', props);
         if( $e.parent().get(0).tagName.toLowerCase() != 'body' ) {
            $e.detach().appendTo('body');
         }
         $e.offset(_off(props));
      }
      return props;
   }

   function _left($e, off, at) {
      var left = off.left;
      switch(at) {
         case 'left':
            return left;
         case 'right':
            return left+$e.innerWidth();
         case 'middle':
         // fall through
         case 'center':
            return left + Math.floor($e.innerWidth()/2);
         default: // treat it as a css value
            return left + ~~at;
      }
   }

   function _top($e, off, atTopCoord) {
      var top = off.top;
      switch(atTopCoord) {
         case 'top':
            return top;
         case 'bottom':
            return top+$e.innerHeight();
         case 'middle':
         // fall through
         case 'center':
            return top + Math.floor($e.innerHeight()/2);
         default: // treat it as a css value
            return top + ~~atTopCoord;
      }
   }

   function _ext(opts, fxName, fxB) {
      var fxA = opts[fxName];
      opts[fxName] = function() {
         var args = $.makeArray(arguments);
         args.push(opts);
         fxB.apply(this, args);
         if( fxA ) { fxA.apply(this, args); }
      };
   }

   function _effects(opts) {
      if( opts.hoverEffect ) {
         _ext(opts, 'step', opts.hoverEffect);
      }
   }

   function _clickOff($e, $img) {
      var off = $e.offset(), h = Math.floor($img.innerHeight()/2), w = Math.floor($img.innerWidth()/2);
      return {left: off.left-w, top: off.top-h}
   }

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

   function _at(opts) {
      var at = opts.at.split(' ');
      if( at[0] === 'top' || at[0] === 'bottom' || at[1] === 'left' || at[1] === 'right' ) {
         at.reverse();
      }
      return at;
   }

   function _off(opts) {
      var $e = $(opts.of), off = $e.offset(), at = _at(opts);
      return {left: _left($e, off, at[0]), top: _top($e, off, at[1])};
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

})(jQuery);
