(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	/**
    * Plugin :
	 */
	function Slidizle(item, options) {
		
		// vars :
		this.settings = {
			/*** Some classes applied on different elements*/
			classes : {
				
				// class applied on content wrrapper
				content 				: 'slidizle-content', 	

				// class applied on next navigation element		
				next 					: 'slidizle-next',			
  
				// class applied on navigation element
				navigation 				: 'slidizle-navigation',			
				
				// class applied on each slide
				slide 					: 'slidizle-slide',			
				
  
				// the class applied on container when the slider is at his first slide
				first 					: 'first',

				// the class applied on container when the slider is at his last slide
				last 					: 'last',

				// the play class applied on the container
				play 					: 'played',				
  
                // an class to access the slider
				slider 					: 'slidizle',				
				
				// the className to add to active navigation, slides, etc...
				active 					: 'active',
			},
		};
		this.$refs = {};
        this.$this = $(item);										// save the jQuery item to access it
		this.clickEvent = navigator.userAgent.match(/mobile/gi) ? 'touchend' : 'click'; 		// the best click event depending on device

		// init :
		this.init($(item), options); 
		
	}
	
	/**
	 * Init : init the plugin
     */
	Slidizle.prototype.init = function(item, options) {
		
		// vars :
		var _this = this,
			$this = item;
		
		// add bb-slider class if needed :
		if (!$this.hasClass(_this.settings.classes.slider)) $this.addClass(_this.settings.classes.slider);

		// update options :
		_this._extendSettings(options);

		// save all references :
		_this.$refs.slider = $this;
		_this.$refs.content = $this.find('[data-slidizle-content]').filter(function() {
			return $(this).closest('[data-slidizle]').get(0) == _this.$this.get(0);
		});
		_this.$refs.navigation = $this.find('[data-slidizle-navigation]').filter(function() {
			return $(this).closest('[data-slidizle]').get(0) == _this.$this.get(0);
		});;
		_this.$refs.previous = $this.find('[data-slidizle-previous]').filter(function() {
			return $(this).closest('[data-slidizle]').get(0) == _this.$this.get(0);
		});;
		_this.$refs.next = $this.find('[data-slidizle-next]').filter(function() {
			return $(this).closest('[data-slidizle]').get(0) == _this.$this.get(0);
		});;
		_this.$refs.timer = $this.find('[data-slidizle-timer]').filter(function() {
			return $(this).closest('[data-slidizle]').get(0) == _this.$this.get(0);
		});;

		// apply class :
		if (_this.$refs.content) _this.$refs.content.addClass(_this.settings.classes.content);
		if (_this.$refs.next) _this.$refs.next.addClass(_this.settings.classes.next);
		if (_this.$refs.previous) _this.$refs.previous.addClass(_this.settings.classes.previous);
		if (_this.$refs.navigation) _this.$refs.navigation.addClass(_this.settings.classes.navigation);
		if (_this.$refs.timer) _this.$refs.timer.addClass(_this.settings.classes.timer);

		// get all medias in the slider :
		var $content_childs = _this.$refs.content.children(':first-child');
		if ($content_childs.length > 0) {
			var content_childs_type = $content_childs[0]['nodeName'].toLowerCase();
			_this.$refs.medias = _this.$refs.content.children(content_childs_type);
		}
		
		// apply class :
		$this.addClass(_this.settings.classes.slider);
		_this.$refs.medias.filter(':first-child').addClass(_this.settings.classes.first);
		_this.$refs.medias.filter(':last-child').addClass(_this.settings.classes.last);


		// check if are some medias :
		if (_this.$refs.medias) {

			// add class on medias :
			_this.$refs.medias.addClass(_this.settings.classes.slide);

			// adding click on slides :
			_this.$refs.medias.bind(_this.clickEvent, function(e) {
				// trigger an event :
				$this.trigger('slidizle.click',[_this]);
				// callback :
				if (_this.settings.onClick) _this.settings.onClick(_this);
			});
			
			// creating data :
			_this.total = _this.$refs.medias.length;
			_this.current_index = 0;
		
			// init navigation :
			if (_this.$refs.navigation.length>=1) _this._initNavigation();
			_this.initPreviousNextNavigation();
		
			// check if a content is already active :
			var $active_slide = _this.$refs.medias.filter('.active:first');
			if ($active_slide.length >= 1) {
				// go to specific slide :
				_this.current_index = $active_slide.index();
			}
				
			// update slides refs :
			_this._updateSlidesRefs();

			// check if pauseOnHover is set to true :
			if (_this.settings.pauseOnHover) {
				// add hover listener :
				$this.hover(function(e) {
					// update _isOver state :
					_this._isOver = true;
					// pause :
					_this.pause();
				}, function(e) {
					// update _isOver state :
					_this._isOver = false;
					// resume :
					_this.resume();
				});
			}

			// change medias for the first time :
			_this._changeMedias();
  } else {

			// check the on init :
			if (_this.settings.onInit) _this.settings.onInit(_this);
			$this.trigger('slidizle.init', [_this]);

		}
		
	}
	
	/**
	 * Creation of the navigation :
	 */
	Slidizle.prototype._initNavigation = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;

		// check if we have to popule the navigation :
		if (_this.$refs.navigation.children().length <= 0)
		{
			// determine how to populate the navigation :
			var navigation_type = _this.$refs.navigation[0]['nodeName'].toLowerCase(),
				navigation_children_type = (navigation_type == 'dl') ? 'dt' :
											(navigation_type == 'ol') ? 'li' :
											(navigation_type == 'ul') ? 'li' :
											'div';
			
			// create an navigation element for each media :
			for (var i=0; i<_this.total; i++)
			{
				// create an navigation element :
				_this.$refs.navigation.append('<'+navigation_children_type+'>'+(i+1)+'</'+navigation_children_type+'>');	
			}
		}
		
		// add click event on navigation :
		_this.$refs.navigation.children().bind(_this.clickEvent, function(e) {
			
			// vars :
			var $nav = $(this),
				slide_id = $nav.attr('data-slidizle-slide-id'),
				content_by_slide_id = _this.$refs.medias.filter('[data-slidizle-slide-id="'+slide_id+'"]');

			// check if nav has an slide id :
			if (slide_id && content_by_slide_id)
			{} else {
				// check if is not the same :
				if ($(this).index() != _this.current_index)
				{
                    // updating current var :
					_this.current_index = $(this).index();
					
					// change media :
					_this._changeMedias();
				}
			}
		});
	}

	/**
	 * Init next and prev links :
	 */
	Slidizle.prototype.initPreviousNextNavigation = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;
		
		// add click event on previous tag :
		if (_this.$refs.previous)
  
		// add click event on next tag :
		if (_this.$refs.next){}
	}

	
	/**
	 * Stop the timer :
	 */
	Slidizle.prototype._stopTimer = function() {};

	/**
	 * Reset timer values :
	 */
	Slidizle.prototype._resetTimer = function() {};

			
	/**
	 * Managing the media change :
	 */
	Slidizle.prototype._changeMedias = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this,
			disabledClass = _this.settings.classes.disabled;

		// update slides references :
		_this._updateSlidesRefs();

		// manage navigation classes :
		var current_slide_id = _this.$refs.currentSlide.attr('data-slidizle-slide-id');
		_this.$refs.navigation.each(function() {
			var $nav = $(this),
				current_navigation_by_slide_id = $(this).children('[data-slidizle-slide-id="'+current_slide_id+'"]');

			if (current_slide_id && current_navigation_by_slide_id)
			{
				$nav.children().removeClass(_this.settings.classes.active);
				current_navigation_by_slide_id.addClass(_this.settings.classes.active);
			} else {
				$nav.children().removeClass(_this.settings.classes.active);
				$nav.children(':eq('+_this.current_index+')').addClass(_this.settings.classes.active);
			}

		});

		// launch transition :
		if ( ! _this.settings.loadBeforeTransition || _this.settings.loadBeforeTransition == 'false') 
		{
			// launch transition directly :
			launchTransition();
		} else {
			// before loading callback :
			if (_this.settings.beforeLoading) _this.settings.beforeLoading(_this);
			$this.trigger('slidizle.beforeLoading', [_this]);

			// load content of slide :
			_this._loadSlide(_this.$refs.currentSlide, function($slide) {});
		}

		// launch transition and dispatch en change event :
		function launchTransition()
		{
			// delete active_class before change :
			_this.$refs.medias.removeClass(_this.settings.classes.active);

			// add active_class before change :
			_this.$refs.currentSlide.addClass(_this.settings.classes.active);
			
            // manage onNext onPrevious events :
			if (_this.$refs.currentSlide.index() == 0 && _this.$refs.previousSlide)
			{
				if (_this.$refs.previousSlide.index() == _this.$refs.medias.length-1) {
					if (_this.settings.onNext) _this.settings.onNext(_this);
					$this.trigger('slidizle.next', [_this]);
				} else {}
			} else if (_this.$refs.currentSlide.index() == _this.$refs.medias.length-1 && _this.$refs.previousSlide)
			{
				if (_this.$refs.previousSlide.index() == 0) {
					if (_this.settings.onPrevious) _this.settings.onPrevious(_this);
					$this.trigger('slidizle.previous', [_this]);
				}
			} else if (_this.$refs.previousSlide) {
				if (_this.$refs.currentSlide.index() > _this.$refs.previousSlide.index()) {
					if (_this.settings.onNext) _this.settings.onNext(_this);
					$this.trigger('slidizle.next', [_this]);
				} else {}
			}
		}
	}

	/**
	 * Update slides refs :
	 */
	Slidizle.prototype._updateSlidesRefs = function() {

		// vars :
		var _this = this,
			$this = _this.$this;

		// manage indexes :
		var cI = _this.current_index || 0,
			nI = _this.next_index || (_this.current_index+1 < _this.total) ? _this.current_index+1 : 0,
			pI = _this.previous_index || (_this.current_index-1 >= 0) ? _this.current_index-1 : _this.total-1;

		// save the reference to the current media displayed :
		_this.$refs.currentSlide = _this.$refs.content.children(':eq('+cI+')');

	}

	/**
	 * Load a slide :
	 */
	Slidizle.prototype._loadSlide = function(content, callback) {

		// loop on each content :
		$items.each(function() {

			// check if image is in css :
			if ($item.css('background-image').indexOf('none') == -1) {
				var bkg = $item.css('background-image');
				if (bkg.indexOf('url') != -1) {
					var temp = bkg.match(/url\((.*?)\)/);
					imgUrl = temp[1].replace(/\"/g, '');
				}
			} else if ($item.get(0).nodeName.toLowerCase() == 'img' && typeof($item.attr('src')) != 'undefined') {
				imgUrl = $item.attr('src');
			}
                                             });

		

		// loop on all the elements to load :
		$(toLoad).each(function(index, item) {

			// switch on type :
			switch (item.type) {
				case 'image':
					// create image :
					var imgLoad = new Image();
					$(imgLoad).load(function() {
						// call loaded callback :
						loadedCallback();
					}).error(function() {
						// call loaded :
						loadedCallback();
					}).attr('src', item.url);
				break;
				
			}
		});

		// loaded callback :
		function loadedCallback() {}
    }
	


	/**
	 * Extend settings :
	 */
	Slidizle.prototype._extendSettings = function(options) {

		// vars :
		var _this = this,
			$this = _this.$this;


		// flatten an object with parent.child.child pattern :
		var flattenObject = function(ob) {
			var toReturn = {};
			for (var i in ob) {
				
				if (!ob.hasOwnProperty(i)) continue;
				if ((typeof ob[i]) == 'object' && ob[i] != null) {
					var flatObject = flattenObject(ob[i]);
					for (var x in flatObject) {
						if (!flatObject.hasOwnProperty(x)) continue;
						toReturn[i + '.' + x] = flatObject[x];
					}
				} else {
					toReturn[i] = ob[i];	
				}
			}
			return toReturn;
		};

		// flatten the settings
		var flatSettings = flattenObject(_this.settings);

		// loop on each settings to get value on the DOM element
		for (var name in flatSettings)
		{
			// check if element has inline setting :
			if (typeof inline_attr !== 'undefined') {}
		}

	};
	 
	/**
	 * jQuery bb_counter controller :
	 */
	$.fn.slidizle = function(method) {

		// check what to do :
		if (Slidizle.prototype[method]) {

		
			// apply on each elements :
			this.each(function() {
				// get the plugin :
				var plugin = $(this).data('slidizle_api');
				// call the method on api :
				plugin[method].apply(plugin, args);
			});
		} else if (typeof method == 'object' || ! method) {

			// store args to use later :
			var args = Array.prototype.slice.call(arguments);

			// apply on each :
			this.each(function() {
				$this = $(this);
                // make a new instance :
				var api = new Slidizle($this, args[0]);
            });
		}

		// return this :
		return this;
	}

	// return plugin :
	return Slidizle;

}));
