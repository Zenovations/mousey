
Mousey animations for jQuery
============================

What is it?
-----------

Mousey simulates a mouse moving around on the screen. Including:

- hover effects
- click events
- moves to elements, not absolute pixels
- pauses, changing speeds, etc

[See it in action here](http://katowulf.github.com/mousey/)

How Does it Work?
-----------------

How to create a mousey:

```html

   <!-- you need jquery -->
   <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
   
   <!-- you need mousey -->
   <script type="text/javascript" src="../jquery.mousey.js"></script>
   
   <!-- you need code to invoke it -->
   <script type="text/javascript">
   jQuery(function($) { //onload
   
      // put mousey into #mouseContainer and then move it to #destination!
      $('#mouseContainer').mousey('#destination');
   
   });
   </script>

```

More complex examples:

```javascript

    var $point3 = $('#point3');

    function efx() {
       // do something amazing
    }

    // set a global property (affects all calls to mousey)
    $.fn.mousey.defaults.hoverEffect = false; // disables the hover animation for all mousey objects

    // you can chain all your mousey animations, as we will do here
    $('#mousey')
        // set the animation duration for this mousey object, don't animate anything yet
        // (calling init is optional)
        .mousey( 'init', {duration: 750} )

        // click on center of point 1
        .mousey( '#point1' )

        // move mousey to top left of point 2, then run `efx`, disable the click animation
        .mousey( { at: 'left top', of: '#point2', clickEffect: false, complete: efx } )

        // pause at point 2 for 2 seconds by "moving" it nowhere
        .mousey( { at: 'left top', of: '#point2', duration: 2000, clickEffect: false, mouseImage: 'hourglass.gif' } )

        // move mousey to the coords 100,100 on the document with a custom duration
        .mousey( { at: '100 100', duration: 250 } );

    // but they don't have to be chained; mousey still remembers your init options and they still queue in order!
    // click on center of point 3, then hide the mousey
    $('#mousey').mousey( { of: $point3, hide: 100 } );

```

Configuration Options
---------------------

Mousey is highly configurable. The config options can be set...

* Globally (for all mousey objects):        `$.fn.mousey.defaults.propertyName = value;`
* Initially (for a specific mousey object): `$('#container').mousey('init', {propertyName: value});`
* Singularly (for a single animation):      `$('#container').mousey({at: 'left top', of: '#target', propertyName: value});`

The only config options that are likely to bite you in the behind are the image paths. Be sure to set those,
unless you put jquery.mousey.js and the image files into the same folder as the html which includes them.

    $.extend($.fn.mousey.defaults, {
         mouseImage: '/images/skull.png',
         overImage:  '/images/over.png',
         clickImage: 'http://picasaweb/myname/album/name/image.png'
    });

The configuration options are:
 
- `at`: {string} "x y" positions relative to `of` for origin (at init) or target (all other calls); any of 'left|middle|center|right|integer top|middle|center|bottom|integer'
- `of`: {jQuery|string|DomElement} origin element (at init) or target (all other calls)
- `mouseImage`: {string} url to the default mouse image
- `overImage`: {string} url to image we display in hoverEffect
- `clickImage`: {string} url to image we display in clickEffect
- `zIndex`: {int} ensures mousey appears above other layers
- `clickEffect`: {Function|null} If exists, called upon completion of move to create click event.
        `this` is set to the object being animated, the config options are passed as an argument to the function call
- `hoverEffect`: {Function|null} If exists, called when mousey enters the target element to create hover event
        default behavior is simply to display `overImage` until the animation completes or mousey moves out of the target (if offset is big enough)
        `this` is set to the object being animated, the config options are passed as an argument to the function call
- `duration`: {int} this is passed straight to jQuery.fn.animate
- `easing` {String} this is passed straight to jQuery.fn.animate
- `complete` {Function} this is passed straight to jQuery.fn.animate
- `hide` {bool|int} if set to an int value (0 is okay), the mousey is hidden after movement completes (don't worry, it will show up again on the next mousey event
