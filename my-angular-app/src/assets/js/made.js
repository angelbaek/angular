$(function () {
  var rollHeader = 50;
  $(window).scroll(function () {
    var scroll = getCurrentScroll();
    if (scroll >= rollHeader) {
      $(".head-wrap").addClass("head-wrap-scroll");
    } else {
      $(".head-wrap").removeClass("head-wrap-scroll");
    }
  });
  function getCurrentScroll() {
    return window.pageYOffset || document.documentElement.scrollTop;
  }
});

var popoverTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="popover"]')
);
var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
  return new bootstrap.Popover(popoverTriggerEl);
});

//서브메뉴/

$(document).ready(function () {
  // /** 추가 작성 23.09.25 작성자 bsh
  //  * @param {number} data data-head-menu매핑 1~999
  //  */
  // for (let i = 1; i <= 10; i++) {
  //   $(`.mm-${i}`).mouseover(function () {
  //     // data-target 속성을 읽어와서 해당 숫자를 얻습니다.
  //     const targetNumber = $(this).data("head-menu");

  //     // 얻은 숫자를 사용하여 sub-1부터 sub-9까지의 클래스를 조작할 수 있습니다.
  //     $(`.sub-${targetNumber}`).addClass("d-flex");

  //     // 나머지 sub- 클래스
  //     // (이 코드에서는 sub- 클래스를 모두 숨김 처리하도록 되어 있습니다.)
  //     for (let j = 1; j <= 10; j++) {
  //       if (j !== targetNumber) {
  //         $(`.sub-${j}`).removeClass("d-flex");
  //       }
  //     }
  //   });
  // }
  /**
   * 플레어 코드
   */
  //   $(".mm-1").mouseover(function () {
  //     $(".sub-1").addClass("d-flex");
  //     $(".sub-2").removeClass("d-flex");
  //     $(".sub-3").removeClass("d-flex");
  //     $(".sub-4").removeClass("d-flex");
  //     $(".sub-5").removeClass("d-flex");
  //     $(".sub-6").removeClass("d-flex");
  //     $(".sub-7").removeClass("d-flex");
  //     $(".sub-8").removeClass("d-flex");
  //     $(".sub-9").removeClass("d-flex");
  //   });
  //   $(".mm-2").mouseover(function () {
  //     $(".sub-1").removeClass("d-flex");
  //     $(".sub-2").addClass("d-flex");
  //     $(".sub-3").removeClass("d-flex");
  //     $(".sub-4").removeClass("d-flex");
  //     $(".sub-5").removeClass("d-flex");
  //     $(".sub-6").removeClass("d-flex");
  //     $(".sub-7").removeClass("d-flex");
  //     $(".sub-8").removeClass("d-flex");
  //     $(".sub-9").removeClass("d-flex");
  //   });
  //   $(".mm-3").mouseover(function () {
  //     $(".sub-1").removeClass("d-flex");
  //     $(".sub-2").removeClass("d-flex");
  //     $(".sub-3").addClass("d-flex");
  //     $(".sub-4").removeClass("d-flex");
  //     $(".sub-5").removeClass("d-flex");
  //     $(".sub-6").removeClass("d-flex");
  //     $(".sub-7").removeClass("d-flex");
  //     $(".sub-8").removeClass("d-flex");
  //     $(".sub-9").removeClass("d-flex");
  //   });
  //   $(".mm-4").mouseover(function () {
  //     $(".sub-1").removeClass("d-flex");
  //     $(".sub-2").removeClass("d-flex");
  //     $(".sub-3").removeClass("d-flex");
  //     $(".sub-4").addClass("d-flex");
  //     $(".sub-5").removeClass("d-flex");
  //     $(".sub-6").removeClass("d-flex");
  //     $(".sub-7").removeClass("d-flex");
  //     $(".sub-8").removeClass("d-flex");
  //     $(".sub-9").removeClass("d-flex");
  //   });
  //   $(".mm-5").mouseover(function () {
  //     $(".sub-1").removeClass("d-flex");
  //     $(".sub-2").removeClass("d-flex");
  //     $(".sub-3").removeClass("d-flex");
  //     $(".sub-4").removeClass("d-flex");
  //     $(".sub-5").addClass("d-flex");
  //     $(".sub-6").removeClass("d-flex");
  //     $(".sub-7").removeClass("d-flex");
  //     $(".sub-8").removeClass("d-flex");
  //     $(".sub-9").removeClass("d-flex");
  //   });
  //   $(".mm-6").mouseover(function () {
  //     $(".sub-1").removeClass("d-flex");
  //     $(".sub-2").removeClass("d-flex");
  //     $(".sub-3").removeClass("d-flex");
  //     $(".sub-4").removeClass("d-flex");
  //     $(".sub-5").removeClass("d-flex");
  //     $(".sub-6").addClass("d-flex");
  //     $(".sub-7").removeClass("d-flex");
  //     $(".sub-8").removeClass("d-flex");
  //     $(".sub-9").removeClass("d-flex");
  //   });
  //   $(".mm-7").mouseover(function () {
  //     $(".sub-1").removeClass("d-flex");
  //     $(".sub-2").removeClass("d-flex");
  //     $(".sub-3").removeClass("d-flex");
  //     $(".sub-4").removeClass("d-flex");
  //     $(".sub-5").removeClass("d-flex");
  //     $(".sub-6").removeClass("d-flex");
  //     $(".sub-7").addClass("d-flex");
  //     $(".sub-8").removeClass("d-flex");
  //     $(".sub-9").removeClass("d-flex");
  //   });
  //   $(".mm-8").mouseover(function () {
  //     $(".sub-1").removeClass("d-flex");
  //     $(".sub-2").removeClass("d-flex");
  //     $(".sub-3").removeClass("d-flex");
  //     $(".sub-4").removeClass("d-flex");
  //     $(".sub-5").removeClass("d-flex");
  //     $(".sub-6").removeClass("d-flex");
  //     $(".sub-7").removeClass("d-flex");
  //     $(".sub-8").addClass("d-flex");
  //     $(".sub-9").removeClass("d-flex");
  //   });
  //   $(".mm-9").mouseover(function () {
  //     $(".sub-1").removeClass("d-flex");
  //     $(".sub-2").removeClass("d-flex");
  //     $(".sub-3").removeClass("d-flex");
  //     $(".sub-4").removeClass("d-flex");
  //     $(".sub-5").removeClass("d-flex");
  //     $(".sub-6").removeClass("d-flex");
  //     $(".sub-7").removeClass("d-flex");
  //     $(".sub-8").removeClass("d-flex");
  //     $(".sub-9").addClass("d-flex");
  //   });
  $(".head-nav-menu").mouseleave(function () {
    $(".sub-1").removeClass("d-flex");
    $(".sub-2").removeClass("d-flex");
    $(".sub-3").removeClass("d-flex");
    $(".sub-4").removeClass("d-flex");
    $(".sub-5").removeClass("d-flex");
  });
});

//서브메뉴/

$(document).ready(function () {
  // 좌측 1뎁스메뉴
  // 좌측 1뎁스메뉴
  $(".left-m1-1").click(function () {
    if ($(this).hasClass("depth-choice")) {
      $(".left-m1-1").removeClass("depth-choice");
      $(".left-m1-1-under").addClass("wrap-h-0");
      $(".left-m1-2").removeClass("depth-choice");
      $(".left-m1-3").removeClass("depth-choice");
      $(".left-m1-4").removeClass("depth-choice");
      $(".left-m1-5").removeClass("depth-choice");
      $(".left-m1-2-under").addClass("wrap-h-0");
      $(".left-m1-3-under").addClass("wrap-h-0");
      $(".left-m1-4-under").addClass("wrap-h-0");
      $(".left-m1-5-under").addClass("wrap-h-0");
    } else {
      $(".left-m1-1").addClass("depth-choice");
      $(".left-m1-1-under").removeClass("wrap-h-0");
      $(".left-m1-2").removeClass("depth-choice");
      $(".left-m1-3").removeClass("depth-choice");
      $(".left-m1-4").removeClass("depth-choice");
      $(".left-m1-5").removeClass("depth-choice");
      $(".left-m1-2-under").addClass("wrap-h-0");
      $(".left-m1-3-under").addClass("wrap-h-0");
      $(".left-m1-4-under").addClass("wrap-h-0");
      $(".left-m1-5-under").addClass("wrap-h-0");
    }
  });

  $(".left-m1-2").click(function () {
    if ($(this).hasClass("depth-choice")) {
      $(".left-m1-2").removeClass("depth-choice");
      $(".left-m1-2-under").addClass("wrap-h-0");
      $(".left-m1-1").removeClass("depth-choice");
      $(".left-m1-3").removeClass("depth-choice");
      $(".left-m1-4").removeClass("depth-choice");
      $(".left-m1-5").removeClass("depth-choice");
      $(".left-m1-1-under").addClass("wrap-h-0");
      $(".left-m1-3-under").addClass("wrap-h-0");
      $(".left-m1-4-under").addClass("wrap-h-0");
      $(".left-m1-5-under").addClass("wrap-h-0");
    } else {
      $(".left-m1-2").addClass("depth-choice");
      $(".left-m1-2-under").removeClass("wrap-h-0");
      $(".left-m1-1").removeClass("depth-choice");
      $(".left-m1-3").removeClass("depth-choice");
      $(".left-m1-4").removeClass("depth-choice");
      $(".left-m1-5").removeClass("depth-choice");
      $(".left-m1-1-under").addClass("wrap-h-0");
      $(".left-m1-3-under").addClass("wrap-h-0");
      $(".left-m1-4-under").addClass("wrap-h-0");
      $(".left-m1-5-under").addClass("wrap-h-0");
    }
  });

  $(".left-m1-3").click(function () {
    if ($(this).hasClass("depth-choice")) {
      $(".left-m1-3").removeClass("depth-choice");
      $(".left-m1-3-under").addClass("wrap-h-0");

      $(".left-m1-1").removeClass("depth-choice");
      $(".left-m1-2").removeClass("depth-choice");
      $(".left-m1-4").removeClass("depth-choice");
      $(".left-m1-5").removeClass("depth-choice");
      $(".left-m1-1-under").addClass("wrap-h-0");
      $(".left-m1-2-under").addClass("wrap-h-0");
      $(".left-m1-4-under").addClass("wrap-h-0");
      $(".left-m1-5-under").addClass("wrap-h-0");
    } else {
      $(".left-m1-3").addClass("depth-choice");
      $(".left-m1-3-under").removeClass("wrap-h-0");

      $(".left-m1-1").removeClass("depth-choice");
      $(".left-m1-2").removeClass("depth-choice");
      $(".left-m1-4").removeClass("depth-choice");
      $(".left-m1-5").removeClass("depth-choice");
      $(".left-m1-1-under").addClass("wrap-h-0");
      $(".left-m1-2-under").addClass("wrap-h-0");
      $(".left-m1-4-under").addClass("wrap-h-0");
      $(".left-m1-5-under").addClass("wrap-h-0");
    }
  });

  $(".left-m1-4").click(function () {
    if ($(this).hasClass("depth-choice")) {
      $(".left-m1-4").removeClass("depth-choice");
      $(".left-m1-4-under").addClass("wrap-h-0");

      $(".left-m1-1").removeClass("depth-choice");
      $(".left-m1-3").removeClass("depth-choice");
      $(".left-m1-2").removeClass("depth-choice");
      $(".left-m1-5").removeClass("depth-choice");
      $(".left-m1-1-under").addClass("wrap-h-0");
      $(".left-m1-3-under").addClass("wrap-h-0");
      $(".left-m1-2-under").addClass("wrap-h-0");
      $(".left-m1-5-under").addClass("wrap-h-0");
    } else {
      $(".left-m1-4").addClass("depth-choice");
      $(".left-m1-4-under").removeClass("wrap-h-0");

      $(".left-m1-1").removeClass("depth-choice");
      $(".left-m1-3").removeClass("depth-choice");
      $(".left-m1-2").removeClass("depth-choice");
      $(".left-m1-5").removeClass("depth-choice");
      $(".left-m1-1-under").addClass("wrap-h-0");
      $(".left-m1-3-under").addClass("wrap-h-0");
      $(".left-m1-2-under").addClass("wrap-h-0");
      $(".left-m1-5-under").addClass("wrap-h-0");
    }
  });

  // 좌측 2뎁스메뉴
  $(".left-m2-1").click(function () {
    if ($(this).hasClass("depth-choice")) {
      $(".left-m2-1").removeClass("depth-choice");
      $(".left-m2-1-under").addClass("wrap-h-0");

      $(".left-m2-2").removeClass("depth-choice");
      $(".left-m2-3").removeClass("depth-choice");
      $(".left-m2-2-under").addClass("wrap-h-0");
      $(".left-m2-3-under").addClass("wrap-h-0");
    } else {
      $(".left-m2-1").addClass("depth-choice");
      $(".left-m2-1-under").removeClass("wrap-h-0");

      $(".left-m2-2").removeClass("depth-choice");
      $(".left-m2-3").removeClass("depth-choice");
      $(".left-m2-2-under").addClass("wrap-h-0");
      $(".left-m2-3-under").addClass("wrap-h-0");
    }
  });
  $(".left-m2-2").click(function () {
    if ($(this).hasClass("depth-choice")) {
      $(".left-m2-2").removeClass("depth-choice");
      $(".left-m2-2-under").addClass("wrap-h-0");

      $(".left-m2-1").removeClass("depth-choice");
      $(".left-m2-3").removeClass("depth-choice");
      $(".left-m2-1-under").addClass("wrap-h-0");
      $(".left-m2-3-under").addClass("wrap-h-0");
    } else {
      $(".left-m2-2").addClass("depth-choice");
      $(".left-m2-2-under").removeClass("wrap-h-0");

      $(".left-m2-1").removeClass("depth-choice");
      $(".left-m2-3").removeClass("depth-choice");
      $(".left-m2-1-under").addClass("wrap-h-0");
      $(".left-m2-3-under").addClass("wrap-h-0");
    }
  });
  $(".left-m2-3").click(function () {
    if ($(this).hasClass("depth-choice")) {
      $(".left-m2-3").removeClass("depth-choice");
      $(".left-m2-3-under").addClass("wrap-h-0");

      $(".left-m2-2").removeClass("depth-choice");
      $(".left-m2-1").removeClass("depth-choice");
      $(".left-m2-2-under").addClass("wrap-h-0");
      $(".left-m2-1-under").addClass("wrap-h-0");
    } else {
      $(".left-m2-3").addClass("depth-choice");
      $(".left-m2-3-under").removeClass("wrap-h-0");

      $(".left-m2-2").removeClass("depth-choice");
      $(".left-m2-1").removeClass("depth-choice");
      $(".left-m2-2-under").addClass("wrap-h-0");
      $(".left-m2-1-under").addClass("wrap-h-0");
    }
  });

  // 사이드 1뎁스메뉴
  $(".side-m1-1").click(function () {
    $(".side-m1-1").addClass("depth-choice");
    $(".side-m1-1-under").removeClass("wrap-h-0");

    $(".side-m1-2").removeClass("depth-choice");
    $(".side-m1-3").removeClass("depth-choice");
    $(".side-m1-4").removeClass("depth-choice");
    $(".side-m1-5").removeClass("depth-choice");
    $(".side-m1-2-under").addClass("wrap-h-0");
    $(".side-m1-3-under").addClass("wrap-h-0");
    $(".side-m1-4-under").addClass("wrap-h-0");
    $(".side-m1-5-under").addClass("wrap-h-0");
  });
  $(".side-m1-2").click(function () {
    $(".side-m1-2").addClass("depth-choice");
    $(".side-m1-2-under").removeClass("wrap-h-0");

    $(".side-m1-1").removeClass("depth-choice");
    $(".side-m1-3").removeClass("depth-choice");
    $(".side-m1-4").removeClass("depth-choice");
    $(".side-m1-5").removeClass("depth-choice");
    $(".side-m1-1-under").addClass("wrap-h-0");
    $(".side-m1-3-under").addClass("wrap-h-0");
    $(".side-m1-4-under").addClass("wrap-h-0");
    $(".side-m1-5-under").addClass("wrap-h-0");
  });
  $(".side-m1-3").click(function () {
    $(".side-m1-3").addClass("depth-choice");
    $(".side-m1-3-under").removeClass("wrap-h-0");

    $(".side-m1-2").removeClass("depth-choice");
    $(".side-m1-1").removeClass("depth-choice");
    $(".side-m1-4").removeClass("depth-choice");
    $(".side-m1-5").removeClass("depth-choice");
    $(".side-m1-2-under").addClass("wrap-h-0");
    $(".side-m1-1-under").addClass("wrap-h-0");
    $(".side-m1-4-under").addClass("wrap-h-0");
    $(".side-m1-5-under").addClass("wrap-h-0");
  });
  $(".side-m1-4").click(function () {
    $(".side-m1-4").addClass("depth-choice");
    $(".side-m1-4-under").removeClass("wrap-h-0");

    $(".side-m1-2").removeClass("depth-choice");
    $(".side-m1-3").removeClass("depth-choice");
    $(".side-m1-1").removeClass("depth-choice");
    $(".side-m1-5").removeClass("depth-choice");
    $(".side-m1-2-under").addClass("wrap-h-0");
    $(".side-m1-3-under").addClass("wrap-h-0");
    $(".side-m1-1-under").addClass("wrap-h-0");
    $(".side-m1-5-under").addClass("wrap-h-0");
  });

  // 사이드 2뎁스메뉴
  $(".side-m2-1").click(function () {
    $(".side-m2-1").addClass("depth-choice");
    $(".side-m2-1-under").removeClass("wrap-h-0");

    $(".side-m2-2").removeClass("depth-choice");
    $(".side-m2-3").removeClass("depth-choice");
    $(".side-m2-2-under").addClass("wrap-h-0");
    $(".side-m2-3-under").addClass("wrap-h-0");
  });

  $(".side-m2-2").click(function () {
    $(".side-m2-2").addClass("depth-choice");
    $(".side-m2-2-under").removeClass("wrap-h-0");

    $(".side-m2-1").removeClass("depth-choice");
    $(".side-m2-3").removeClass("depth-choice");
    $(".side-m2-1-under").addClass("wrap-h-0");
    $(".side-m2-3-under").addClass("wrap-h-0");
  });
  $(".side-m2-3").click(function () {
    $(".side-m2-3").addClass("depth-choice");
    $(".side-m2-3-under").removeClass("wrap-h-0");

    $(".side-m2-2").removeClass("depth-choice");
    $(".side-m2-1").removeClass("depth-choice");
    $(".side-m2-2-under").addClass("wrap-h-0");
    $(".side-m2-1-under").addClass("wrap-h-0");
  });

  // 우측 1뎁스메뉴
  $(".right-m1-1").click(function () {
    $(".right-m1-1").addClass("depth-choice");
    $(".right-m1-1-under").removeClass("wrap-h-0");

    $(".right-m1-2").removeClass("depth-choice");
    $(".right-m1-3").removeClass("depth-choice");
    $(".right-m1-4").removeClass("depth-choice");
    $(".right-m1-5").removeClass("depth-choice");
    $(".right-m1-2-under").addClass("wrap-h-0");
    $(".right-m1-3-under").addClass("wrap-h-0");
    $(".right-m1-4-under").addClass("wrap-h-0");
    $(".right-m1-5-under").addClass("wrap-h-0");
  });
  $(".right-m1-2").click(function () {
    $(".right-m1-2").addClass("depth-choice");
    $(".right-m1-2-under").removeClass("wrap-h-0");

    $(".right-m1-1").removeClass("depth-choice");
    $(".right-m1-3").removeClass("depth-choice");
    $(".right-m1-4").removeClass("depth-choice");
    $(".right-m1-5").removeClass("depth-choice");
    $(".right-m1-1-under").addClass("wrap-h-0");
    $(".right-m1-3-under").addClass("wrap-h-0");
    $(".right-m1-4-under").addClass("wrap-h-0");
    $(".right-m1-5-under").addClass("wrap-h-0");
  });
  $(".right-m1-3").click(function () {
    $(".right-m1-3").addClass("depth-choice");
    $(".right-m1-3-under").removeClass("wrap-h-0");

    $(".right-m1-2").removeClass("depth-choice");
    $(".right-m1-1").removeClass("depth-choice");
    $(".right-m1-4").removeClass("depth-choice");
    $(".right-m1-5").removeClass("depth-choice");
    $(".right-m1-2-under").addClass("wrap-h-0");
    $(".right-m1-1-under").addClass("wrap-h-0");
    $(".right-m1-4-under").addClass("wrap-h-0");
    $(".right-m1-5-under").addClass("wrap-h-0");
  });
  $(".right-m1-4").click(function () {
    $(".right-m1-4").addClass("depth-choice");
    $(".right-m1-4-under").removeClass("wrap-h-0");

    $(".right-m1-2").removeClass("depth-choice");
    $(".right-m1-3").removeClass("depth-choice");
    $(".right-m1-1").removeClass("depth-choice");
    $(".right-m1-5").removeClass("depth-choice");
    $(".right-m1-2-under").addClass("wrap-h-0");
    $(".right-m1-3-under").addClass("wrap-h-0");
    $(".right-m1-1-under").addClass("wrap-h-0");
    $(".right-m1-5-under").addClass("wrap-h-0");
  });

  // 우측 2뎁스메뉴
  $(".right-m2-1").click(function () {
    $(".right-m2-1").addClass("depth-choice");
    $(".right-m2-1-under").removeClass("wrap-h-0");

    $(".right-m2-2").removeClass("depth-choice");
    $(".right-m2-3").removeClass("depth-choice");
    $(".right-m2-2-under").addClass("wrap-h-0");
    $(".right-m2-3-under").addClass("wrap-h-0");
  });

  $(".right-m2-2").click(function () {
    $(".right-m2-2").addClass("depth-choice");
    $(".right-m2-2-under").removeClass("wrap-h-0");

    $(".right-m2-1").removeClass("depth-choice");
    $(".right-m2-3").removeClass("depth-choice");
    $(".right-m2-1-under").addClass("wrap-h-0");
    $(".right-m2-3-under").addClass("wrap-h-0");
  });
  $(".right-m2-3").click(function () {
    $(".right-m2-3").addClass("depth-choice");
    $(".right-m2-3-under").removeClass("wrap-h-0");

    $(".right-m2-2").removeClass("depth-choice");
    $(".right-m2-1").removeClass("depth-choice");
    $(".right-m2-2-under").addClass("wrap-h-0");
    $(".right-m2-1-under").addClass("wrap-h-0");
  });

  //좌측탭메뉴/

  $(".left-tab-1").click(function () {
    $(".left-tab-1").addClass("left-bg");
    $(".left-tab-1").removeClass("tab-basic-bg");
    $(".left-tab-2").removeClass("left-bg");
    $(".left-tab-2").addClass("tab-basic-bg");
  });

  $(".left-tab-2").click(function () {
    $(".left-tab-2").addClass("left-bg");
    $(".left-tab-2").removeClass("tab-basic-bg");
    $(".left-tab-1").removeClass("left-bg");
    $(".left-tab-1").addClass("tab-basic-bg");
  });

  //우측탭메뉴/

  $(".right-tab-1").click(function () {
    $(".right-tab-1").addClass("check-on");
    $(".right-tab-2").removeClass("check-on");
    $(".right-tab-3").removeClass("check-on");
  });

  $(".right-tab-2").click(function () {
    $(".right-tab-2").addClass("check-on");
    $(".right-tab-1").removeClass("check-on");
    $(".right-tab-3").removeClass("check-on");
  });
  $(".right-tab-3").click(function () {
    $(".right-tab-3").addClass("check-on");
    $(".right-tab-1").removeClass("check-on");
    $(".right-tab-2").removeClass("check-on");
  });

  //좌측 하단 검색/

  $(".left-search-btn-ai").click(function () {
    $(".left-foot-search-ai").removeClass("wrap-h-0");
    $(".left-foot-search-wiki").addClass("wrap-h-0");
  });

  $(".left-search-btn-wiki").click(function () {
    $(".left-foot-search-wiki").removeClass("wrap-h-0");
    $(".left-foot-search-ai").addClass("wrap-h-0");
  });

  //그래픽 필터 내용
  $(".space-plus").click(function () {
    $(".filter-list-group").removeClass("wrap-h-0");
  });

  $(".space-minus").click(function () {
    $(".filter-list-group").addClass("wrap-h-0");
  });
});

// 우측 사이드 /

$(function () {
  var duration = 0;
  var $bnav = $(".find-body");
  var $side = $(".right-box-space");
  var $side2 = $(".right-box");
  var $sidebtn = $bnav.find(".right-btn").on("click", function () {
    $side.toggleClass("open");

    if ($side.hasClass("open")) {
      $(".right-box-space").addClass("wrap-w-0");
      $side2.stop(true).animate({ right: "-400px" }, duration);
    } else {
      $(".right-box-space").removeClass("wrap-w-0");
      $side2.stop(true).animate({ right: "0%" }, duration);
    }
  });
});

//좌측 기본/
$(function () {
  var duration = 0;
  var $bnav = $(".find-body");
  var $side = $(".left-box-space");
  var $side2 = $(".left-box");
  var $sidebtn = $bnav.find(".left-btn").on("click", function () {
    $side.toggleClass("open");

    if ($side.hasClass("open")) {
      $(".left-box-space").addClass("wrap-w-0");
      $side2.stop(true).animate({ left: "-370px" }, duration);
    } else {
      $(".left-box-space").removeClass("wrap-w-0");
      $side2.stop(true).animate({ left: "0%" }, duration);
    }
  });
});

//좌측 두번째 /
$(function () {
  console.log("클릭 됨");
  var duration = 0;
  var $bnav = $(".find-body");
  var $side = $(".side-box");
  var $sidebtn = $bnav.find(".side-btn").on("click", function () {
    $side.toggleClass("open");

    if ($side.hasClass("open")) {
      $side.stop(true).animate({ left: "0" }, duration);
    } else {
      $side.stop(true).animate({ left: "-300px" }, duration);
    }
  });
});

//그래프 박스 /
$(function () {
  var duration = 300;
  var $bnav = $(".find-body");
  var $side = $(".graph-box");
  var $sidebtn = $bnav.find(".graph-btn").on("click", function () {
    $side.toggleClass("open");

    if ($side.hasClass("open")) {
      $(".graph-box").addClass("wrap-h-0");
    } else {
      $(".graph-box").removeClass("wrap-h-0");
    }
  });
});

//그래프 설정 박스 /
$(function () {
  var duration = 300;
  var $bnav = $(".find-body");
  var $side = $(".graph-search-setting");
  var $sidebtn = $bnav.find(".graph-path-btn").on("click", function () {
    $side.toggleClass("open");

    if ($side.hasClass("open")) {
      $(".graph-search-setting").removeClass("wrap-h-0");
    } else {
      $(".graph-search-setting").addClass("wrap-h-0");
    }
  });
});

//ai채팅 박스 /
$(function () {
  var duration = 300;
  var $bnav = $(".find-body");
  var $side = $(".right-chat-box-ai");
  var $sidebtn = $bnav.find(".right-search-btn-ai").on("click", function () {
    $side.toggleClass("open");

    if ($side.hasClass("open")) {
      $(".right-chat-box-ai").removeClass("wrap-h-0");
    } else {
      $(".right-chat-box-ai").addClass("wrap-h-0");
    }
  });
});

// public 채팅 박스 /
$(function () {
  var duration = 300;
  var $bnav = $(".find-body");
  var $side = $(".right-chat-box-public");
  var $sidebtn = $bnav
    .find(".right-search-btn-public")
    .on("click", function () {
      $side.toggleClass("open");

      if ($side.hasClass("open")) {
        $(".right-chat-box-public").removeClass("wrap-h-0");
      } else {
        $(".right-chat-box-public").addClass("wrap-h-0");
      }
    });
});

// 드레그
const draggable = ($target) => {
  let isPress = false,
    prevPosX = 0,
    prevPosY = 0;

  $target.onmousedown = start;
  $target.onmouseup = end;

  // 상위 영역
  window.onmousemove = move;

  function start(e) {
    prevPosX = e.clientX;
    prevPosY = e.clientY;

    isPress = true;
  }

  function move(e) {
    if (!isPress) return;

    const posX = prevPosX - e.clientX;
    const posY = prevPosY - e.clientY;

    prevPosX = e.clientX;
    prevPosY = e.clientY;

    $target.style.left = $target.offsetLeft - posX + "px";
    $target.style.top = $target.offsetTop - posY + "px";
  }

  function end() {
    isPress = false;
  }
};

window.onload = () => {
  const $target = document.querySelector(".mover");
  draggable($target);
};
