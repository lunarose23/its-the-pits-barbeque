$(document).ready(() => {

	//clear out old html in case using local later
	$('.menu').html('');

	//build menu items //currently content areas need to be hand built 
	  $.map( menuItems, function( val, i ) {
	    if (i === 0) {
	      var active = ' active';
	    } else {
	      var active = '';
		}
		//This code was commented out to get rid of the nav bar, which isn't being used anymore.
	    // <div class="nav-icon active" data-container-name ="nav-1"><i class="fas fa-upload fa-2x"></i><p>Nav-1</p></div>
		
		 $('.menu').append('<div class="nav-icon'+active+'" data-container-name ="nav-'+i+'"><i class="'+val.icon+' fa-1x"></i><p>'+val.name+'</p></div>')
	  });

	//Click through left Nav Bar
	  $('.nav-icon').on('click', function(){
	    if ( !$(this).hasClass('info') ){
	      $('.active').removeClass('active');
	      $(this).addClass('active');
	      $('.content').removeClass('active');
	      var container = $(this).attr('data-container-name');
	      $('[data-nav="'+container+'"]').addClass('active');
	    } else {
	      if ( $(this).hasClass('open') ){
	        $(this).removeClass('open');
	        closeNav();
	      } else {
	        $(this).addClass('open');
	        openNav();
	      }
	    }
	  });
    

});



//open and close Info Navigation

/* Set the width of the side navigation to 250px and the left margin of the page content to 250px */
function openNav() {
    $('#mySidenav').fadeIn();
    $('#main').css('margin-left', '-250px');
    $('#main').css('margin-right', '250px');
    $('#mySidenav').css('margin-left', '-250px');
    $('#mySidenav').css('margin-right', '250px');
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0 */
function closeNav() {
    $('#mySidenav').fadeOut();
    $('#main').css('margin-left', '0');
    $('#main').css('margin-right', '0');
    $('#mySidenav').css('margin-left', '0');
    $('#mySidenav').css('margin-right', '0');
}
