var isPageInChanging = false;
// this function abstructs the managment of pages.
function changePage(oldPage, page, revese, transition, beforePageEnter) {

    $(window).scrollTop(0);

    isPageInChanging = true;
	function triggerPageChanged() {
		var pageChangedEvent = new $.Event("pagechange"),
			triggerData = { options: { $fromOriginalPageDefinision: oldPage, targetPage: page } };

		$("body").trigger(pageChangedEvent, triggerData);
	}

	function enterNewPage() {

        // Scrolling to the top of the window.
	    isPageInChanging = false;

	    if (beforePageEnter) {
	        beforePageEnter(page);
	    }

		page.$el.fadeIn(function () {

			triggerPageChanged();
		});
	}
	
	if (page.$el) {
	    page.$el.hide();
	}

	// This initiate the page as hiden to help the animation to be clean.
	if (oldPage && oldPage.$el) {

		oldPage.$el.fadeOut(function () {

			enterNewPage();
		});
	}
	else {
		enterNewPage();
	}

	log("entering page: " + page.pageId);
}

function reActivtePageAffect(page, beforePageEnter, afterPageEnter) {

    $(window).scrollTop(0);

	page.$el.fadeOut(function () {
	    if (beforePageEnter) {
		    beforePageEnter(page);
		}
	    page.$el.fadeIn(function () {
	        if (afterPageEnter) {
	            afterPageEnter(page);
	        }
		});
	});
}
