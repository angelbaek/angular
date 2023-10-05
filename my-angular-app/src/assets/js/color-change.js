( function($) {
    'use strict';
        
  // 스크롤 이벤트가 일어나면 실행
    window.addEventListener('scroll', function () {  
      ChangeColor(); 
     });
    
  
  //함수
    let ChangeColor = () => {
      var harfHeight = document.documentElement.clientHeight*0.8; //화면의 절반높이를 구하고
      
      $('.color-tran').each(function(index,item){ // 
        let childHeight = $(item).offset().top-window.pageYOffset; // 객채의 현재위츠를 구하고
          if(harfHeight > childHeight){  // 객체의 위치랄 기준 위치를 비교하고
            if ($(item).hasClass('color-tran')){  // color-tran 클래스를 가지고 있으면
             // console.log('인텍스'+index+'아이템'+item+'중간높이'+harfHeight+'객체위치'+childHeight+'1111');
              $(item).addClass('color-white-change');
            }         
          }
          else{   
            if ($(item).hasClass('color-tran')){  // color-tran 클래스를 가지고 있으면
              $(item).removeClass('color-white-change');
             // console.log('인텍스'+index+'중간높이'+harfHeight+'객체위치'+childHeight+'2222');
            }                  
          }
        
      });
    }
    ChangeColor();
  
  })(jQuery);
  
  
  