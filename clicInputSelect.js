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
	var _selectedIndex;
	
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
		
		// If emptyText provided then set emptyText
		$el.attr("placeholder", options.emptyText);
		
		// If button displayed then add button element with awesome font icon
		if(options.buttonDisplay){
			tDropdownButton = $('<div class="clicInputSelectButton"/>');
			tDropdownButton.on("mousedown",clicInputSelectButtonClick);
			$el.after(tDropdownButton);
			// Only sure fire way of vertically centering the icon in button is code.  All others fail (vertical-align, flex, line-height: 100%, etc...)
			tDropdownButton.append('<i class="' + options.buttonIconOpenClass + '" style="line-height: ' + tDropdownButton.height() + 'px;"></i>');
		}
		else
		{
			$el.addClass("noButton");
		}

		// Initialize state of panel
		$el.data("clicInputSelectPanelOpen", false);
		
		// Add events
		$el.on("keyup", inputKeyUp);
		$el.on("keydown", inputKeyDown);
		$el.on("click", inputClick);
 
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
				if (tValue.length >= options.minNumberChars)
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
				
				if (tValue.length >= options.minNumberChars)
				{
					openDropdownPanel(el, tValue);
				}
			}
			hook('onInputChange', tValue);
		}
	}
	
	// ----------------------------------------------------------------------------------------
	// Behaviours when user clicks on input  
	// ----------------------------------------------------------------------------------------
	function inputClick(){
		// Select text 
		if(options.selectTextOnFocus){
			el.select();
		}

		// Open dropdown
		if(options.openDropdownOnFocus){
			 openDropdownPanel(el);
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
			
			hook('onListClose');
		}
		else
		{
			// Check to see if there are other dropdown panels open and close them 
			closeAllDropdownPanels();
					
			// Open panel for clicked on element
			openDropdownPanel(el);
		}
		
		return false;
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
		
		// Width for drop down panel is default (same as input) or overriden fixed
		var tWidth = $el.parent().outerWidth();
		if(options.dropdownPanelWidth){
			tWidth = options.dropdownPanelWidth;
		}
		
		// Get height of container so that we can display the dropdown from the bottom + offset X
		var tHeight = $el.parent().outerHeight();
		
		// Create dropdown panel and UL
		tPanel = $('<div class="clicInputSelectPanel" />');
		
		// Height of dropdown 
		tPanel.height(options.dropdownPanelHeight);
		tList = $("<ul/>");
		
		// Is this array or array of objects?
		if(options.dataSource.length > 0){
		
			// If an object/json array then setup with and without template, 
			var tDisplayItem;
			if( typeof options.dataSource[0] === 'object' ) {
				// Store value in data-value
				if(options.dataSourceValueProperty){
					tValueItem = function(value){return "data-value='" + value[options.dataSourceValueProperty] + "'"};
				}
				else
				{
					tValueItem = function(value){return ""};
				}
				
				// Get display item (templated or not)
				if(options.itemTemplate == null)
				{
					tDisplayItem = function(value){return value[options.dataSourceDisplayProperty]};
				} else {
					tDisplayItem = function(value){return options.itemTemplate(value)};
				}
			}
			else   // If string/value array then just return array value
			{			
				tDisplayItem = function(value) {return value};
				tValueItem = function(value){return ""};
			}
			
			var tOverrideStyle = "";
			if(options.itemOverflow){ 
				if(options.itemOverflow == "nowrap"){
						tOverrideStyle = "style='white-space:nowrap;'";
				}
				else if(options.itemOverflow == "nowraptrim")
				{
					tOverrideStyle = "style='white-space:nowrap; overflow:hidden; text-overflow: ellipsis;'";
				}
			}

			 $.each( options.dataSource, function( index, value ) {
				 tList.append("<li data-index='" + index + "' " + tOverrideStyle + " " + tValueItem(value) + ">" + tDisplayItem(value) + "</li>");
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
		
		// If filter is to be applied
		if(pApplyFilter){
			filterList(pApplyFilter);
		}
		
		hook('onListOpen', tPanel);
	}
	
 	// ----------------------------------------------------------------------------------------
	// Filter list 
	// ----------------------------------------------------------------------------------------
	function filterList(pFilter)
	{
		if(!pFilter){
			closeAllDropdownPanels();	
		}
		
		// If Filter is case insensitive then lowercase everything
		if(!options.filterCaseSensitive){
			pFilter = pFilter.toLowerCase();
		}
		
		// Set function for starts or contains
		var tMatchString;
		if(options.filterMethod == "startswith") {
			tMatchString = function(index){return index == 0};
		}
		else
		{
			tMatchString = function(index){return index >= 0};
		}
		
		var tItemMatch = false;
		var tFoundAt;
		$(".clicInputSelectPanel ul > li").each(function() {
			tItemMatch = false;
			
			if(options.filterCaseSensitive){
				tFoundAt = $(this).text().search(pFilter);
				if (tMatchString(tFoundAt)) {
					tItemMatch = true;
				}
			}
			else
			{
				tFoundAt = $(this).text().toLowerCase().search(pFilter);
				if (tMatchString(tFoundAt)) {
					tItemMatch = true;
				}
			}

			// If item is a match then keep it otherwise hide it
			if(tItemMatch){
				$(this).show();
				
				// if highlight class is given then apply it to part of string found
				// Highlighting of words can not be used with templated items as it could screw up html
				if(options.itemTemplate == null){
					if(options.filterHighlightMatches && pFilter.length != 0){
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
		_selectedIndex = $(event.target).data("index");
		_selectedItem = options.dataSource[_selectedIndex];
		
		hook('onItemSelected', _selectedItem);
		
		$el.val($(event.target).text());
		$el.data("clicInputSelectPanelOpen",false);
		$(".clicInputSelectPanel").remove();
		$(event.target).addClass("selected");
		$el.next().children("i").removeClass(options.buttonIconCloseClass);
		$el.next().children("i").addClass(options.buttonIconOpenClass);
		hook('onListClose');
	}

	function selectItembyIndex(pIndex){
		// Get item selected
		_selectedIndex = pIndex;
		_selectedItem = options.dataSource[pIndex];
		$el.val(_selectedItem[options.dataSourceDisplayProperty]);
		hook('onItemSelected', _selectedItem);
	}

	function selectItembyValue(pValue){
		$.each(options.dataSource, function(index, value) {
			if(value[options.dataSourceValueProperty] == pValue)
			{
				// Get item selected
				_selectedIndex = index;
				_selectedItem = options.dataSource[index];
				$el.val(_selectedItem[options.dataSourceDisplayProperty]);
				hook('onItemSelected', _selectedItem);
				return false;
			}
		});
	}

	function selectItembyDisplay(pDisplayText){
		$.each(options.dataSource, function(index, value) {
			if(value[options.dataSourceDisplayProperty] == pDisplayText)
			{
				// Get item selected
				_selectedIndex = index;
				_selectedItem = options.dataSource[index];
				$el.val(_selectedItem[options.dataSourceDisplayProperty]);
				hook('onItemSelected', _selectedItem);
				return false;
			}
		});
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
		
		// Also close drop down if user clicked on another input element of clicInputSelect type
		if($(e.target).hasClass("clicInputSelectInput")){
			if($(e.target).data("clicInputSelectPanelOpen") === false){
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
	
	// ----------------------------------------------------------------------------------------
	// Return input to its original state remove all clicInputSelect
	// ----------------------------------------------------------------------------------------
    function destroy() {
      // Iterate over each matching element.
      $el.each(function() {
        var el = this;
        var $el = $(this);
 
        // Remove container, dropdown button,, etc.
		$el.removeClass("clicInputSelectInput");

		// If positioning absolute/relative then copy it back to input element
		if($el.parent().css("position") == "absolute" || $el.parent().css("position") == "relative") {
			$el.css("position",$el.parent().css("position"));
			$el.css("top",	$el.parent().css("top")?$el.parent().css("top"):"");
			$el.css("bottom", $el.parent().css("bottom")?$el.parent().css("bottom"):"");
			$el.css("left",	$el.parent().css("left")?$el.parent().css("left"):"");
			$el.css("right",	$el.parent().css("right")?$el.parent().css("right"):"");
		}
		$el.unwrap();
		
		// Remove events on input
		$el.off("keyup", inputKeyUp);
		$el.off("keydown", inputKeyDown);
		
		// If emptyText provided then set emptyText
		//$el.attr("placeholder", options.emptyText);
 
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
	  closelist: closeAllDropdownPanels,
	  selectitembyindex: selectItembyIndex,
  	  selectitembyvalue: selectItembyValue,
	  selectitembydisplay: selectItembyDisplay	  
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
		minNumberChars: 0,									// Minimum number of characters required to display auto suggestion dropdown
		buttonDisplay: true,								// Default is to display dropdown button
		buttonIconOpenClass: 'icon-chevron-down',
		buttonIconCloseClass: 'icon-chevron-up',
		dataSource: [],
		dataSourceDisplayProperty: null,
		dataSourceValueProperty: null,
		positionOffsetX: 0,
		positionOffsetY: 2,									
		selectTextOnFocus: false,							// If user selects input then text (if any) will be highlighted
		openDropdownOnFocus: false,							// If user selects input dropdown is opened at the same time
		itemTemplate: null,				
		emptyText:null,										// text in here will be displayed as a placeholder (i.e. please select...)
		itemOverflow: null,									// Default is null (wrap text), "nowrap" no wrap with scrollbar, "nowraptrim" no wrap and no scrollbar
		filterMethod: 'contains',							// "contains" part of the string, "startswith" with part of the string
		filterCaseSensitive: false, 						// Is case sensitive , default is no
		filterHighlightMatches: true,						// Default is that highlight match characters is on
		filterHighlightClass: 'clicInputHighlightSearch',  	// Override this or leave default 'clicInputHighlightSearch"
		dropdownPanelWidth: null,    						// Leave null for same size as input otherwise put fixed or % size as in "200px" or "100%"
		dropdownPanelHeight: "200px",   					// default is 200px
		onInit: function() {},
		onDestroy: function() {}
  };
 
})(jQuery);