/**
 * A jQuery plugin boilerplate.
 * Author: Jonathan Nicol @f6design
 */
;(function($) {  
  var pluginName = 'clicInputSelect';
   
  /**
   * Plugin object constructor.
   * Implements the Revealing Module Pattern.
   */
  function Plugin(element, options) {
    // Global references to DOM and jQuery versions of element.
    var el = element;
    var $el = $(element);
	var _selectedItem;
	
    // Extend default options with those supplied by user.
    options = $.extend({}, $.fn[pluginName].defaults, options);
 
    /**
     * Initialize plugin.
     */
    function init() {
		// Wrap input inside container div
		$el.addClass("clicInputSelectInput");
		tContainer = $('<div class="clicInputSelect"/>');
		tContainer.css("float",	$el.css("float"));
		if($el.css("position") == "absolute" || $el.css("position") == "relative") {
			tContainer.css("position",$el.css("position"));
			tContainer.css("top",	$el.css("top")?$el.css("top"):"");
			tContainer.css("bottom", $el.css("bottom")?$el.css("bottom"):"");
			tContainer.css("left",	$el.css("left")?$el.css("left"):"");
			tContainer.css("right",	$el.css("right")?$el.css("right"):"");
			$el.css("position","");
			$el.css("left","");
			$el.css("right","");
			$el.css("top","");
			$el.css("bottom","");
		}
		
		$el.wrap(tContainer);
		//$el.wrap('<div class="clicInputSelect"/>');
		
		// Copy position type css attributes to container and remove them from input

		//$el.css("position", "");
		//$el.css("float", "");
		
		// If emptyText provided then set emptyText
		$el.attr("placeholder", options.emptyText);
		
		// If button displayed then add button element with awesome font icon
		if(options.buttonDisplay){
			tDropdownButton = $('<div class="clicInputSelectButton"/>');
			tDropdownButton.on("click",clicInputSelectButtonClick);
			$el.after(tDropdownButton);
			// Only sure fire way of vertically centering the icon in button is code.  All others fail (vertical-align, flex, line-height: 100%, etc...)
			tDropdownButton.append('<i class="' + options.buttonIconOpenClass + '" style="line-height: ' + tDropdownButton.height() + 'px;"></i>');
		}
		else
		{
			$el.addClass("noButton");
		}

		// Initialize state of panel
		$el.data("clicInputSelectPanelOpen", false)

		
		// Add events
		$el.on("keyup", inputKeyUp);
		$el.on("keydown", inputKeyDown);
 
 
		hook('onInit');
    }
	
	// ----------------------------------------------------------------------------------------
	// Input key down - its like a click, open dropdownpanel etc... and select first item
	// ----------------------------------------------------------------------------------------
	function inputKeyDown(event)
	{
		// If key down and panel is not open then open panel and select first item
		if(event.keyCode == 40 && $el.data("clicInputSelectPanelOpen")==false){
			// Check to see if there are other dropdown panels open and close them 
			closeAllDropdownPanels();
			
			// Open panel for clicked on element
			openDropdownPanel();
		}
	}
	
	// ----------------------------------------------------------------------------------------
	// Input key up - check for minimum number of characters
	// ----------------------------------------------------------------------------------------
	function inputKeyUp(event)
	{
		// Ignore up/down and enter keys keys
		if(event.keyCode != 40 && event.keyCode != 38 && event.keyCode != 13){
			var tValue = $(event.currentTarget).val();
			
			// If the dropdown panel is open for the current element then just review # of character typed
			// and close if less than minimum, filter list if minimum characters is ok
			if ($el.data("clicInputSelectPanelOpen")){
				if (tValue.length > options.minNumberChars)
				{
					filterList(tValue);
				}
				else
				{
					closeAllDropdownPanels();
				}
			}
			else
			{
				// Check to see if there are other dropdown panels open and close them 
				closeAllDropdownPanels();
				
				// If content is greater than minimum number of characters option then display select list with filtered options
				
				if (tValue.length > options.minNumberChars)
				{
					openDropdownPanel(el, tValue);
				}
			}
			hook('onInputChange', tValue);
		}
	}
	
	
	// ----------------------------------------------------------------------------------------
	// Click on drop down button 
	// ----------------------------------------------------------------------------------------
	function clicInputSelectButtonClick(event){
		// If the dropdown panel is open for the current element already then close it
		if ($el.data("clicInputSelectPanelOpen")){
			$el.data("clicInputSelectPanelOpen", false);
			$(".clicInputSelectPanel").remove();

			// Switch button icon  
			$el.next().children("i").removeClass(options.buttonIconCloseClass);
			$el.next().children("i").addClass(options.buttonIconOpenClass);
		}
		else
		{
			// Check to see if there are other dropdown panels open and close them 
			closeAllDropdownPanels();
					
			// Open panel for clicked on element
			openDropdownPanel(el);
		}
	}

	// ----------------------------------------------------------------------------------------
	// This function closes all dropdown panels
	// ----------------------------------------------------------------------------------------
	function closeAllDropdownPanels(){
		// Set all inputs[data-clicInputSelectPanelOpen]=false (cant select using jquery data so using class selector)
		$(".clicInputSelectInput").each( function() {
		    // If this element has its panel open then close it
			if($(this).data("clicInputSelectPanelOpen") == true){
				$(this).data("clicInputSelectPanelOpen",false);
				hook('onListClose');
				
				// Switch button icon  
				$(this).next().children("i").removeClass($(this).data("clicInputSelect").option("buttonIconCloseClass"));   
				$(this).next().children("i").addClass($(this).data("clicInputSelect").option("buttonIconOpenClass"));
			}
		 });
		
		// Remove DOM element
		$(".clicInputSelectPanel").remove();
	}
	
	// ----------------------------------------------------------------------------------------
	// Display panel with filtered list items
	// ----------------------------------------------------------------------------------------
	function openDropdownPanel(pDefaultSelectedItem, pApplyFilter){
		// Switch button icon  
		$el.next().children("i").removeClass(options.buttonIconOpenClass);
		$el.next().children("i").addClass(options.buttonIconCloseClass);
			
		// Set data element to indicate state of panel
		$el.data("clicInputSelectPanelOpen", true);
		
		// Display panel below input
	    var tPosition = $el.parent().offset();
		
		// Width for drop down panel is either auto, default or a specific value 
		var tWidth = "";
		switch(options.dropdownPanelWidth)
		{
		case "auto":
		  tWidth = "100%";
		  break;
		case "default":
		   tWidth = $el.parent().outerWidth();
		  break;
		default:
			tWidth = options.dropdownPanelWidth;
		}
		
		// Get height of container so that we can display the dropdown from the bottom + offset X
		var tHeight = $el.parent().outerHeight();
		
		// Create dropdown panel and UL
		tPanel = $('<div class="clicInputSelectPanel" />');
		tList = $("<ul/>");
		
		// Is this array or array of objects?
		if(options.dataSource.length > 0){
		
			// If an object/json array then setup with and without template, 
			var tDisplayItem;
			if( typeof options.dataSource[0] === 'object' ) {
				if(options.itemTemplate == null)
				{
					tDisplayItem = function(value){return value[options.displayDataSourceProperty]};
				} else {
					tDisplayItem = function(value){return options.itemTemplate(value)};
				}
			}
			else   // If string/value array then just return array value
			{			
				tDisplayItem = function(value) {return value};
			}
			

			 $.each( options.dataSource, function( index, value ) {
				 tList.append("<li data-index='" + index + "'>" + tDisplayItem(value) + "</li>");
			 });

		}	
		
		// Append list to dropdown panel and set CSS
		tPanel.append(tList);
		tPanel.css({
			position: "absolute",
			width: tWidth,
			top: tPosition.top + tHeight + options.positionOffsetY + "px",
			left: tPosition.left + options.positionOffsetX + "px"
		}).appendTo("body");
		
		// Set event handler on LI items;
		$(".clicInputSelectPanel").on("click","li", selectItem);
		
		if(pApplyFilter){
			filterList(pApplyFilter);
		}
		
		hook('onListOpen');
	}
	
 	// ----------------------------------------------------------------------------------------
	// Filter list 
	// ----------------------------------------------------------------------------------------
	function filterList(pFilter)
	{
		if(!options.filterCaseSensitive){
			pFilter = pFilter.toLowerCase();
		}
		
		var tItemMatch = false;
		var tFoundAt;
		$(".clicInputSelectPanel ul > li").each(function() {
			tItemMatch = false;
			if(options.filterCaseSensitive){
				tFoundAt =$(this).text().search(pFilter);
				if (tFoundAt> -1) {
					tItemMatch = true;
				}
			}
			else
			{
				tFoundAt = $(this).text().toLowerCase().search(pFilter);
				if (tFoundAt > -1) {
					tItemMatch = true;
				}
			}

			// If item is a match then keep it otherwise hide it
			if(tItemMatch){
				$(this).show();
				
				// if highlight class is given then apply it to part of string found
				// Highlighting of words can not be used with templated items as it could screw up html
				if(options.itemTemplate == null){
					if(options.filterHighlightClass && pFilter.length != 0){
						var tStringPattern = $(this).text().substr(tFoundAt, pFilter.length);
						$(this).html($(this).text().replace(tStringPattern,"<span class='" + options.filterHighlightClass + "'>" + tStringPattern + "</span>"));
					}
				}
			}
			else{
				$(this).hide();
			}
		});
	}
	
	
	// ----------------------------------------------------------------------------------------
	// Select list item
	// ----------------------------------------------------------------------------------------
	function selectItem(event)
	{
		// Get item selected
		_selectedItem = options.dataSource[$(event.target).data("index")];
		hook('onItemSelected', _selectedItem);
		
		$el.val($(event.target).text());
		$el.data("clicInputSelectPanelOpen",false);
		$(".clicInputSelectPanel").remove();
		$(event.target).addClass("selected");
		$el.next().children("i").removeClass(options.buttonIconCloseClass);
		$el.next().children("i").addClass(options.buttonIconOpenClass);
		hook('onListClose');
	}

	

	
 	// ----------------------------------------------------------------------------------------
	// Close all dropdown if clicked anywhere but on the dropdown element or input element
	// ----------------------------------------------------------------------------------------
	 $(document).mouseup(function (e)
	{
		// Ignore if mouseup on clicInputSelect element or children (let normal events take over)
		var tInputContainer = $(".clicInputSelect");
		if (!tInputContainer.is(e.target) // if the target of the click isn't the clicInputSelect
			&& tInputContainer.has(e.target).length === 0) // ... nor a descendant of clicInputSelect
		{
			var tDropDownPanel = $(".clicInputSelectPanel");
			if (!tDropDownPanel.is(e.target) // if the target of the click isn't the dropdown panel...
			&& tDropDownPanel.has(e.target).length === 0) // ... nor a descendant of dropdown panel
			{
				closeAllDropdownPanels();
			}
		}
	});

    /**
     * Get/set a plugin option.
     * Get usage: $('#el').demoplugin('option', 'key');
     * Set usage: $('#el').demoplugin('option', 'key', value);
     */
    function option (key, val) {
      if (val) {
        options[key] = val;
      } else {
        return options[key];
      }
    }
 
    /**
     * Destroy plugin.
     * Usage: $('#el').demoplugin('destroy');
     */
    function destroy() {
      // Iterate over each matching element.
      $el.each(function() {
        var el = this;
        var $el = $(this);
 
        // Add code to restore the element to its original state...
 
        hook('onDestroy');
        // Remove Plugin instance from the element.
        $el.removeData(pluginName);
      });
    }
 
    /**
     * Callback hooks.
     * Usage: In the defaults object specify a callback function:
     * hookName: function() {}
     * Then somewhere in the plugin trigger the callback:
     * hook('hookName');
     */
    function hook(hookName, args) {
      if (options[hookName] !== undefined) {
        // Call the user defined function.
        // Scope is set to the jQuery element we are operating on.
        options[hookName].call(el, args);
      }
    }
 
    // Initialize the plugin instance.
    init();
 
    // Expose methods of Plugin we wish to be public.
    return {
      option: option,
      destroy: destroy,
	  openlist: openDropdownPanel,
	  closelist: closeAllDropdownPanels
    };
  }
 
  /**
   * Plugin definition.
   */
  $.fn[pluginName] = function(options) {
    // If the first parameter is a string, treat this as a call to
    // a public method.
    if (typeof arguments[0] === 'string') {
      var methodName = arguments[0];
      var args = Array.prototype.slice.call(arguments, 1);
      var returnVal;
      this.each(function() {
        // Check that the element has a plugin instance, and that
        // the requested public method exists.
        if ($.data(this,  pluginName) && typeof $.data(this, pluginName)[methodName] === 'function') {
          // Call the method of the Plugin instance, and Pass it
          // the supplied arguments.
          returnVal = $.data(this,  pluginName)[methodName].apply(this, args);
        } else {
          throw new Error('Method ' +  methodName + ' does not exist on jQuery.' + pluginName);
        }
      });
      if (returnVal !== undefined){
        // If the method returned a value, return the value.
        return returnVal;
      } else {
        // Otherwise, returning 'this' preserves chainability.
        return this;
      }
    // If the first parameter is an object (options), or was omitted,
    // instantiate a new instance of the plugin.
    } else if (typeof options === "object" || !options) {
      return this.each(function() {
        // Only allow the plugin to be instantiated once.
        if (!$.data(this,  pluginName)) {
          // Pass options to Plugin constructor, and store Plugin
          // instance in the elements jQuery data object.
          $.data(this,  pluginName, new Plugin(this, options));
        }
      });
    }
  };
 
  // Default plugin options.
  // Options can be overwritten when initializing plugin, by
  // passing an object literal, or after initialization:
  // $('#el').demoplugin('option', 'key', value);
  $.fn[pluginName].defaults = {
		minNumberChars: 0,
		buttonDisplay: true,
		buttonIconOpenClass: 'icon-chevron-down',
		buttonIconCloseClass: 'icon-chevron-up',
		dataSource: [],
		positionOffsetX: 0,
		positionOffsetY: 2,
		itemTemplate: null,
		emptyText:null,
		displayDataSourceProperty: 'name',
		filterMethod: 'any',	// "any" part of the string, "begins" with part of the string
		filterCaseSensitive: false, 
		filterHighlightClass: 'clicInputHighlightSearch',  // Leave blank for no highlighting
		dropdownPanelWidth: "default",    // "default" for same size as input, "auto" for automatic 100% width of largest item, "#px" for fixed width
		maxDropdownPanelHeight: null,
		onInit: function() {},
		onDestroy: function() {}
  };
 
})(jQuery);