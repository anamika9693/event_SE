$(document).ready(function(){
    $('.navbar-fostrap').click(function(){
      $('.nav-fostrap').toggleClass('visible');
      $('body').toggleClass('cover-bg');
    });
    $('.btn-method').click(function(event){ 
      $('.box-pay-method').find('button').removeClass('check'); 
      $(event.currentTarget).toggleClass('check'); 
    });
    
    // $('.btn-method').click(function(event){ 
    //   $(event.currentTarget).parent().find('button').removeClass('check');
    //   $(event.currentTarget).toggleClass('check'); 
    // });
    
  });
  
  $(function($){
    $("#phone").mask("+7 (999) 999-9999");
  });

//   ----------------
