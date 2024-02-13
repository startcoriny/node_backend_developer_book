const lodash = require("lodash");
const PAGE_LIST_SIZE = 10;

// 총 개수, 페이지, 한 페이지에 표시하는 게시물 개수를 매개변수로 받음 10
module.exports = ({ totalCount, page, perPage = 10 }) => {
  const PER_PAGE = perPage;
  const totalPage = Math.ceil(totalCount / PER_PAGE); // 총페이지수 계산

  // 시작 페이지 : 몫 * PAGE_LIST_SIZE + 1
  let quotient = parseInt(page / PAGE_LIST_SIZE);

  // 만약 10번째 페이지, 20번째 페이지 일경우 내려주기 위해서
  if (page % PAGE_LIST_SIZE === 0) {
    quotient -= 1;
  }
  const startPage = quotient * PAGE_LIST_SIZE + 1; // 시작페이지 구하기

  // 끝페이지 : startPag + PAGE_LIST_SIZE - 1
  const endPage =
    startPage + PAGE_LIST_SIZE - 1 < totalPage
      ? startPage + PAGE_LIST_SIZE - 1
      : totalPage; // 끝페이지 구하기

  const isFirstPage = page === 1;
  const isLastPage = page === totalPage;
  const hasPrev = page > 1;
  const hasNext = page < totalPage;

  const paginator = {
    // 표시할 페이지 번호 리스트를 만들어줌
    pageList: lodash.range(startPage, endPage + 1),
    page,
    prevPage: page - 1,
    nextPage: page + 1,
    startPage,
    lastPage: totalPage,
    hasPrev,
    hasNext,
    isFirstPage,
    isLastPage,
  };
  return paginator;
};

/* pagenator.js 설명

    리스트 페이지 기획을 보면 페이지 네이터부분에 최대 1부터 10페이지 까지 나오도록 기획.
    이렇게 최대 10 페이지가지 나오도록하려면 시작과끝페이지까지의 숫자가 들어있는 리스트를 만들어야합니다.
    이를 편리하게 만들수 있도록 하는 함수가 lodash.range()함수 입니다.
    lodash.range(1,11)을 실행하게 되면 [1, ... ,10]으로 구성된 리스트가 반환됩니다.

           PAGE_LIST_SIZE
    (1)    2 3 4 5 6 7 8 9   (10)
 startpage                  endPage

   paginator
    모듈화 해서 사용하는 페이지 네이터는 하나의 함수로 이루어져 있음
    인자로 받는것.
    totalCount - 총 개수
    page - 현재 페이지
    perPage - 한페이지당 표시하는 게시물 개수

   totalPage
    페이징할때 몇 페이지까지 나올지 계산
    게시물이 11개이고 페이지 당 10개씩 보여주는 경우 2페이지가 되어야하고,
    나누어떨어지는 경우에도 Math.ceil을 사용하여 총 페이지 수를 구할수있다.
    ex) 총 게시물 98개 → 98/10 = 9.8, Math.ceil(9.8) = 10 이므로 총 10개의 페이지가 필요
    ex) 총 게시물 9개 → 9/10 = 0.9, Math.ceil(0.9) = 1 이므로 총 1개의 페이지가 필요

   startPage
    시작 페이지를 구하는 방식
    한번에 보이는 페이지의 수는 PAGE_LIST_SIZE = 1~10까지
    즉, 시작 번호는 게시물이 1페이지에 10개라고 정해졌을때 100개가 넘어서 101개가 되었을 때
    다음페이지로 넘어가서 101번째의 게시물을 보려면 시작페이지가 11이 되야합니다.
    즉 1, 11, 21이 되기 위해서 값을 구해야 합니다.
    1페이지부터 10페이지까지 선택을 했을때 (내가 선택한 페이지번호 / 보여지는 최대 페이지번호) * 최대 페이지 번호 +1 하면 구할수 있습니다.
    ex) 4번쨰 페이지 일 때 :  (4/10) = 0, 0* 10 = 0, 0+1 = 1 즉, 시작페이지 = 1
    ex) 18번째 페이지 일 때(18/10) = 1, 1*10 = 10, 10 + 1 = 11 즉, 시작페이지 11


  endPage
   끝페이지를 구하는 방식
   데이터 자료가 250개 있다고 하면 총 페이지수는 25페이지
   시작페이지 + 보여지는 최대 페이지번호 -1해주면 됩니다.
   하지만 끝 페이지가 10으로 떨어지지 않고 위처럼 25페이지처럼 중간에 있을경우
   즉, 끝페이지가 30 으로 구해놨지만 총 페이지가 25일경우 25로 변경해주면 됩니다. 
   ex) 11 + 10 = 21, 21 - 1 = 20 but 최종페이지가 18일경우 20 < 18 ? 21 - 1 = 20 : 18 즉, 최종페이지가 10단위로 끊던 페이지보다 작으면 최종페이지로 변경.
*/
