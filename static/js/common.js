//-----사파리 높이값 버그 수정-----
// let vh = window.innerHeight * 0.01;
// document.documentElement.style.setProperty('--vh', `${vh}px`);
// //resize
// window.addEventListener('resize', () => {
//     let vh = window.innerHeight * 0.01;
//     document.documentElement.style.setProperty('--vh', `${vh}px`);
// });
(function(){
    const setVh = () => {
        const v = window.innerHeight * 0.01; // 지역 변수
        document.documentElement.style.setProperty('--vh', `${v}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
})();


function goRefresh() {
    location.reload(true);
}
function digitComma(number) {
    if (number === null || number === undefined || number === '') {
        return '0'; // 또는 '' 또는 '-'
    }
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function goBackRefresh() {
    location.href = document.referrer
}

let _focus;
let _forceFocus; // 강제 이동할곳

let focusHistory = [];

// 포커스 히스토리 기록 함수
function addFocusHistory(event) {
    const target = event.target;

    // popup 요소가 아닌 경우에만 기록
    if (target.closest('.popup')) {
        return;
    }

    focusHistory.push({
        target: target,
        element: target.tagName.toLowerCase(),
        id: target.id || null,
        classList: Array.from(target.classList),
        timestamp: new Date().toISOString()
    })

    // focusHistory는 3개까지만 저장
    if (focusHistory.length > 3) {
        focusHistory.shift();
    }
}

// 포커스 히스토리 기록을 위한 이벤트 리스너
document.addEventListener("click", function (event) {
    addFocusHistory(event);
});

document.addEventListener("keypress", function (event) {
    if (event.key === "Tab" || event.key === "Enter" || event.key === " ") {
        addFocusHistory(event);
    }
});


$(function () {
    //-----공통 팝업-----
    // 팝업 내 포커스 트랩 함수
    function trapFocus($popup) {
        let focusList = $popup.find('button, input:not([type="hidden"]), select, iframe, textarea, [href], [tabindex]:not([tabindex="-1"])');
        let firstFocus = focusList.eq(0);
        let lastFocus = focusList.eq(focusList.length - 1);

        setTimeout(() => {
            firstFocus.focus();
        }, 100);

        function keydownHandler(e) {
            if (e.keyCode === 9) {
                if (e.shiftKey && e.target === firstFocus[0]) {
                    e.preventDefault();
                    lastFocus.focus();
                } else if (!e.shiftKey && e.target === lastFocus[0]) {
                    e.preventDefault();
                    firstFocus.focus();
                }
            }
        }

        $popup.off('keydown.trapFocus').on('keydown.trapFocus', keydownHandler);
    }

    // 팝업 닫기 시 포커스 트랩 해제
    function removeTrapFocus($popup) {
        $popup.off('keydown.trapFocus');

        const currentUrl = window.location.href;
        console.log("Current URL:", currentUrl);

        if (focusHistory.length > 0) {
            // 클릭 히스토리에서 마지막 클릭 요소로 포커스 이동
            const lastFocus = focusHistory[focusHistory.length - 1];

            if (lastFocus && lastFocus.target) {
                setTimeout(() => {
                    lastFocus.target.focus();
                }, 100);
            }
        } else if (currentUrl.includes("/quest/map")) {
            // 퀘스트 맵 페이지인 경우, 다음 퀘스트 블록으로 포커스 이동
            const questBlock = $("ul.quest_map");

            if (questBlock.children("li.ready")) {
                setTimeout(() => {
                    questBlock.find("li.ready button").focus();
                }, 100);
            } else {
                setTimeout(() => {
                    questBlock.find("li:last-child button").focus();
                }, 100);
            }

        }  else {
            // 마지막 클릭 요소가 없으면 기본 포커스 이동
            const firstFocusable = $("body:not(#popup_all)").find('button, input:not([type="hidden"]), select, iframe, textarea, [href], [tabindex]:not([tabindex="-1"])').first();
            if (firstFocusable.length) {
                setTimeout(() => {
                    firstFocusable.focus();
                }, 100);
            } else {
                $('body').focus(); // body로 포커스 이동
            }
        }

    }

    // 팝업 열기 공통 처리
    function openPopup(popupName, forceIdx) {
        _focus = null;
        _forceFocus = null;

        $('html').addClass('ofy_hidden');
        $('#wrapper').attr('aria-hidden', true);
        let $popup = $('#popup_all #' + popupName);
        $popup.addClass('active').attr('tabindex', 0).focus();

        if (forceIdx) {
            _forceFocus = $("#" + forceIdx);
            _forceFocus.focus();
        }

        trapFocus($popup);

        $(document).off('keydown.popupEsc').on('keydown.popupEsc', function (e) {
            if (e.key === "Escape" || e.keyCode === 27) {
                closePopup();
            }
        });
    }

    // 팝업 닫기 공통 처리
    function closePopup() {
        if (_forceFocus) {
            _forceFocus.focus();
            _forceFocus = null;
        } else if (_focus) {
            _focus.focus();
        }

        $('html').removeClass('ofy_hidden');
        $('#wrapper').removeAttr('aria-hidden');
        removeTrapFocus($('.popup.active'));
        $('.popup').removeClass('active').removeAttr('tabindex');
        $(document).off('keydown.popupEsc');
    }

    //팝업 버튼 클릭시
    $(document).on('click', '.btn_popup, .btn_del_popup', function (event) {
        _focus = $(event.currentTarget);
        const popupName = _focus.attr('data-popup');
        if (popupName) {
            openPopup(popupName);
        }
    });

    //옵션 버튼 클릭시
    $(document).on('click', '.btn_opt', function (event) {
        _forceFocus = this;
        this.focus();
          
    });

    //팝업 닫기버튼 클릭시
    $(document).on('click', '.btn_popup_close', function (event) {
        let _this = $(event.currentTarget);
        const popType = _this.attr('data-type');
        if (popType === 'closeOnlyThisPop') {
            let $popup = _this.parents('.popup');
            removeTrapFocus($popup);
            $popup.removeClass('active').removeAttr('tabindex');
        } else {
            closePopup();
        }
    });

    // ESC 키 레이어 닫기 핸들러는 openPopup 내에서 처리


    // DOM 로드 시점에 .popup.active 상태인 팝업에 trapFocus 자동 실행
    $('.popup.active').each(function() {
        trapFocus($(this));
    });

    // .popup 요소에 MutationObserver 등록하여 class="active"가 동적으로 추가될 때 trapFocus 자동 실행 및 keydown.popupEsc 등록
    const observer = new MutationObserver(function(mutationsList) {
        mutationsList.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = $(mutation.target);
                if (target.hasClass('popup') && target.hasClass('active')) {
                    trapFocus(target);
                    $(document).off('keydown.popupEsc').on('keydown.popupEsc', function (e) {
                        if (e.key === "Escape" || e.keyCode === 27) {
                            closePopup();
                        }
                    });
                }
            }
        });
    });

    $('.popup').each(function() {
        observer.observe(this, { attributes: true, attributeFilter: ['class'] });
    });

    // 앱에서 접속했을 경우 화면 확대 방지
    let nowClientOs = ''
    if (/bankItApp/i.test(navigator.userAgent)) {
        if (/Android/i.test(navigator.userAgent)) {
            nowClientOs = "aos"
        } else if (/iPhone|iOS|iPad|iPod/i.test(navigator.userAgent)) {
            nowClientOs = "ios"
        } else {
            nowClientOs = "pc"
        }
    } else {
        nowClientOs = "pc"
    }

    if (nowClientOs === "aos" || nowClientOs === "ios") {
        $("meta[name=viewport]").attr("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0");
    }

})//ready

// 기존에 별도로 호출되던 함수들 정리
function showPopup(popupName, forceIdx) {
    openPopup(popupName, forceIdx);
}

function l_ajax(type, dataType, url, data, callback, option)
{
    var opt = {
        cache:false, async:true, modal:false, traditional:false,
        processData:true, contentType:'application/x-www-form-urlencoded; charset=UTF-8'
    };

    $.extend(opt, option);

    var fullUrl = url;
    if (url.startsWith('/') && !url.startsWith('//')) {
        fullUrl = window.location.protocol + '//' + window.location.host + url;
    }

    $.ajax({
        cache : opt.cache, async : opt.async, traditional : opt.traditional,
        type : type, dataType : dataType, url : fullUrl, data : data,
        contentType : opt.contentType, processData : opt.processData,
        success : function(result) {
            callback(result);
        },
        error : function(xhr, textStatus, errorThrown) {
            if( opt.error != null && typeof(opt.error) == "function" ) {
                opt.error();
            }
        }
    });

}


function pushYn(){
    l_ajax("get","json", "/user/pushMessageYn", null, function(json){
        if(json.result == "SUCC"){
            if(json.data > 0){
                $("#headPushZone").addClass("on");
            }
        }
    });
}

// 푸시리스트 가져오기
function getPushList(){
    l_ajax("get","json", "/user/getPushMessageList", null, function(json){
        let html = ``;
        if(json.result == "SUCC"){
              
            let dateList = json.data.dateList;
            let pushList = json.data.pushList;

            dateList.reverse();
            pushList.reverse();

            if(json.data.pushList.length > 0){
                for(let i = 0; i < dateList.length; i++){
                    html += `
                                <li class="date_wrap">
                                    <div class="date">`+ dateList[i] +`</div>
                                    <ul class="list_push">

                            `;

                    for(let j = 0; j < pushList.length; j++){
                        if(dateList[i] == pushList[j].creDt){
                            let readClass = pushList[j].readYn == "N" ? "new" : "read";
                            let readLabel = pushList[j].readYn == "N" ? "새 알림" : "읽음";

                            html += `
                                        <li class="` + readClass + `" aria-label="` + readLabel +`">
                                            <a href="javascript:void(0)" onclick="pushLink(`+ pushList[j].pushIdx +`,'` + pushList[j].outLinkYn + `', '` + pushList[j].link + `', event)">
                                                <span class="ico" data-layout="info"></span>
                                                <div class="txt_wrap">
                                                    <h2 class="list_title">`+ pushList[j].title +`</h2>
                                                    <p class="list_desc">`+ pushList[j].contents +`</p>
                                                </div>
                                            </a>
                                        </li>
                                    `;
                        }
                    }

                    html += `</ul></li>`;
                }

                $("#pushList").html(html);
            }
        }
    });
}

// 알림설정 변경
function changeAllPush(e){
    let check = $(e).is(":checked") == true ? "Y" : "N";

    let param = {
        "pushYn" : check
    }
    if(check == "N"){ param.noNightYn = "N" }

    // 푸시 알림 OFF 시 에티켓 시간 설정 해제
    if (!$(e).is(":checked")) {
        $("input#nightPush").prop("checked", false);
    }

    l_ajax("post", "json", "/user/pushUpdate", param, function (json){
        if(json.result == "SUCC"){
            if(check == "Y"){
                alermSetting("all");
            }else{
                alermSetting("cancel");
            }
        }
    });
}

// 에티켓 설정
function changeNightPush(e){
    let check = $(e).is(":checked") == true ? "Y" : "N";

    let param = {
        "noNightYn" : check
    }

    const allPushInput = $("input#allPush");

    if (!allPushInput.is(":checked")) {
        allPushInput.prop("checked", true);
        param.pushYn = "Y"; // 에티켓 설정 시 전체 푸시 알림도 활성화
    }

    l_ajax("post", "json", "/user/pushUpdate", param, function (json){
        if(json.result == "SUCC"){
            if(check == "Y"){
                alermSetting("noNight");
            }else{
                alermSetting("noNightCancel");
            }
        }
    });
}

function pushLink(pushIdx, outLinkYn, url, event){
    // 알림을 클릭할 경우 화면 상에도 읽음 표시
    event.target.closest("li").classList.remove("new");
    event.target.closest("li").classList.add("read");

    // 읽음처리
    let param = {
        "pushIdx" : pushIdx
    }

    let isOutlink = false;

    l_ajax("post", "json", "/user/pushReadUpdate", param, function(json){
        if(json.result == "SUCC"){
            if(outLinkYn == "Y"){
                // 아웃링크 처리
                isOutlink = true;
            }
        }

        if (isOutlink) {
            goUrl(url);
        } else {
            location.href = url;
        }
    });

}

// 모두 읽기
function pushReadAll(){
    l_ajax("post", "json", "/user/pushReadAllUpdate", null, function(json){
        if(json.result == "SUCC"){
            // 모든 알림을 읽음 상태로 변경
            $("#pushList .list_push li.new").removeClass("new").addClass("read");
            $("#pushList .list_push li.new").attr("aria-label", "읽음");

            // 알림 뱃지 제거
            $("#headPushZone").removeClass("on");

            // 알림 리스트 새로고침
            getPushList();
        }else if(json.result == "REAMIAN"){
            getPushList();
        }else{

        }
    });
}

// 미션참여
function missionParticipate(missionCode, targetIdx, missionName){
    let data = {
        missionCode : missionCode,
        targetIdx : targetIdx,
        missionName : missionName
    }

    l_ajax("post", "json", "/mission/participate", data, function(json){
        let result = json.result;
        let data = json.data;

        if(result == "COMPELETE"){
            // 미션 성공일 때에 팝업 노출
            if(data.type == 1){
                // 일일미션
                $("#popup_mission_clover .title span").text(data.point);

                // 미션 코드에 따라 팝업 노출 딜레이 시간 설정
                let seconds = 2000; // 기본 딜레이 시간 2초
                if (missionCode.includes("_NEWS_READ")) {
                    // 뉴스 읽기 미션은 0.5초 후 팝업 노출
                    seconds = 500;
                };

                setTimeout(function() {
                    $("#popup_mission_clover").addClass("active");
                }, seconds); // 딜레이 시간 설정
                $("#popup_mission_clover").trigger("popup:open");
            }else if(data.type == 2){
                // 최초미션
                alert(data.missionName + " 성공!");
            }else if(data.type == 3){
                // 일회성 미션
                $('#signupPoint').text(data.point);
            }
        }else{
            if( missionName == "P"){
                $("#popupPhotoSucc").addClass("active");
            }
        }
    });
}

/**
 * 미션 참여 (비동기 함수)
 * @param missionCode - 미션 코드
 * @param targetIdx - 타겟 인덱스
 * @param missionName - 미션 이름
 * @returns {Promise} - API 응답을 담은 Promise
 */
async function missionParticipateAsync(missionCode, targetIdx, missionName){
    let data = {
        missionCode : missionCode,
        targetIdx : targetIdx,
        missionName : missionName
    }

    return new Promise((resolve, reject) => {
        l_ajax("post", "json", "/mission/participate", data, function(json){
            let result = json.result;
            let data = json.data;

            if(result == "COMPELETE"){
                // 미션 성공일 때에 팝업 노출
                if(data.type == 1){
                    // 일일미션
                    $("#popup_mission_clover .title span").text(data.point);

                    // 미션 코드에 따라 팝업 노출 딜레이 시간 설정
                    let seconds = 2000; // 기본 딜레이 시간 2초
                    if (missionCode.includes("_NEWS_READ")) {
                        // 뉴스 읽기 미션은 0.5초 후 팝업 노출
                        seconds = 500;
                    };

                    setTimeout(function() {
                        $("#popup_mission_clover").addClass("active");
                    }, seconds); // 딜레이 시간 설정
                    $("#popup_mission_clover").trigger("popup:open");

                }else if(data.type == 2){
                    // 최초미션
                    alert(data.missionName + " 성공!");
                }else if(data.type == 3){
                    // 일회성 미션
                    $('#signupPoint').text(data.point);
                }

                resolve(json);
            }else{
                if( missionName == "P"){
                    $("#popupPhotoSucc").addClass("active");
                }
                resolve(json);
            }
        }, {
            error: function(xhr, textStatus, errorThrown) {
                reject(new Error(`미션 참여 실패: ${textStatus}`));
            }
        });
    });
}

// 본인인증 완료 후 href 이동
function missionAuthHref(url) {
    missionParticipateAsync('USER_AUTH', 0, 'USER_AUTH')
        .then(result => {
            // 본인인증 미션 완료 시 혹은 이미 참여 완료 시
            if (result.result === "COMPELETE" || result.result === "DUPLICATE_DATA") {
                window.location.href = url;
            } else {
                $("#popupErrorCommon").addClass("active");
                $("html").addClass("ofy_hidden");
            }
        })
        .catch(error => {
            $("#popupErrorCommon").addClass("active");
            $("html").addClass("ofy_hidden");
        });
}

// 본인인증
let m_authPopup = null;
function passCheck(requestUrl){
    m_authPopup = window.open(`/checkplus/authPopup?requestUrl=${requestUrl}`, 'popupChk', 'width=500, height=550, top=100, left=100, fullscreen=no, menubar=no, status=no, toolbar=no, titlebar=yes, location=no, scrollbar=no');
    if (m_authPopup == null) {
        alert("팝업이 차단되어 있습니다.\n팝업차단을 해제하신 뒤 다시 시도하여 주십시오.");
        return;
    }
}

// 쿠키셋팅
function setCookie(name, value, exp) {
    var date = new Date();
    date.setTime(date.getTime() + exp * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + escape(value) + ';expires=' + date.toUTCString() + ';path=/';
}

function getCookie(name) {
    var value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return value ? unescape(value[2]) : null;
}

function resetCookie(cName) {
    var expireDate = new Date();
    expireDate.setDate(expireDate.getDate() - 1);
    document.cookie = cName + "= " + "; expires=" + expireDate.toGMTString() + "; path=/";
}

// 로그인 유도 팝업 노출
function goLogin(){

    sessionStorage.setItem('returnUrl', window.location.href);

    $('html').addClass('ofy_hidden');
    $('#wrapper').attr('aria-hidden');
    $("#popupGoLogin").addClass("active");
}

function appLog() {
    if (/bankItApp/i.test(navigator.userAgent)) {
        l_ajax("GET", "json", "/mypage/user/appAccess", null, function(json){
            if (json.RESULT == "SUCC") {
                  
            }
        });
    }
}

// 디바이스 검사
function getDevice() {
    var UserAgent = navigator.userAgent;
    if (/bankItApp/i.test(UserAgent)) {
        return 'app'; // 앱
    }

    // 모바일 웹 체크
    if (UserAgent.match(/iPhone|iPod|iPad|Android|Windows CE|BlackBerry|Symbian|Windows Phone|webOS|Opera Mini|Opera Mobi|POLARIS|IEMobile|lgtelecom|nokia|SonyEricsson/i) != null ||
        UserAgent.match(/LG|SAMSUNG|Samsung/) != null ||
        (UserAgent.match(/Mac OS X/) && navigator.maxTouchPoints > 3)) {
        return 'mobile'; // 모바일 웹
    } else {
        return 'pc'; // PC 웹
    }
}

// 앱 설치 유도 팝업 표시
const isApp = navigator.userAgent.includes("bankItApp");
function goToAppDownload() {

    let m_isMobile = getDevice() == 'mobile' ? true : false;

    if(m_isMobile){
        location.href = '/app'
    }else{
        location.href = '/about#pcAppDown';
    }
}

function goWebtoon() {
    if (!isApp) {
        $("#popupAppInstall h2.title").html("웹툰으로 쉽고 재미있게<br />배우는 금융경제");
        $("#popupAppInstall p.desc").html("웹툰은 앱에서 즐길 수 있어요.");
        $("#popupAppInstall").addClass("active");
        $("html").addClass("ofy_hidden");
    } else {
        window.location.href = "/webtoon/main";
    };
}

function goReport() {
    if (!isApp) {
        $("#popupAppInstall h2.title").html("당신만의 금융지수를<br />진단해드려요");
        $("#popupAppInstall p.desc").html("금융지수는 앱에서 확인할 수 있어요.");
        $("#popupAppInstall").addClass("active");
        $("html").addClass("ofy_hidden");
    } else {
        window.location.href = "/quest/report";
    };
}

function goQuiz(quizIdx, isAvailable) {
    if (!isApp) {
        $("#popupAppInstall").addClass("active");
        $("html").addClass("ofy_hidden");
    } else {
        const href = isAvailable ? `/quest/quiz/detail?quizIdx=${quizIdx}` : `/quest/detail?quizIdx=${quizIdx}`;
        window.location.href = href;
    }
}

function goQuizList() {
    if (!isApp) {
        $("#popupAppInstall").addClass("active");
        $("html").addClass("ofy_hidden");
    } else {
        window.location.href = "/quest/list";
    }
}

function goWord(wordIdx) {
    if (!isApp) {
        $("#popupAppInstall").addClass("active");
        $("html").addClass("ofy_hidden");
    } else {
        window.location.href = `/quest/wordDetail/${wordIdx}`;
    }
}


function makeEditor(selector) {
    let editor = $(selector).summernote({
        minHeight:300,
        lang: 'ko-KR',
        disableDragAndDrop: true,
        popover: {
            image: [
                ['image', ['resizeFull', 'resizeHalf', 'resizeQuarter']],
                ['remove', ['removeMedia']]
            ],
            link: [
                ['link', ['linkDialogShow', 'unlink']]
            ]
        },
        toolbar: [
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['font', ['bold', 'underline', 'italic', 'clear']],
            ['height', ['height']],
            ['color', ['color']],
            ['para', ['paragraph']],
            ['insert', ['link', 'picture', 'video']],
            ['view', ['codeview']]
        ],
        fontSizes: ['8','9','10','11','12','14','16','18','20','22','24','28','30','36','50','72'],
        fontNames: ['SpoqaHanSansNeo','Pretendard','Rubik', 'IBMPlexSans', 'sans-serif', '굴림', '궁서', '돋움', '바탕', '고딕', '맑은 고딕'],
        fontNamesIgnoreCheck: ['SpoqaHanSansNeo','Pretendard','Rubik', 'IBMPlexSans'],
        lineHeights: ['1.0', '1.2', '1.4', '1.5', '1.8','2.0', '3.0'],
        callbacks: {
            onImageUpload: function(files) {
                if( files ) {
                    var isValid = true;
                    for(var i=0; i<files.length; i++) {
                        var fileSize = files[i].size;
                        if( fileSize > 5242880 ) {
                            alert("5M 이하의 이미지만 등록 가능합니다.");
                            isValid = false;
                            break;
                        }
                    }
                    if( isValid ) {
                        var formData = new FormData();
                        for(var i=0; i<files.length; i++) {
                            formData.append('file', files[i]);
                        }
                        l_ajax("post", "json", "/editor/upload", formData, function(json){
                            if( json.result == "SUCC" ) {
                                $(selector).summernote('insertImage', json.data, function($image){
                                    $image.css('width', '100%');
                                });
                            } else {
                                alert("이미지 등록에 실패하였습니다\n다시 시도해주세요");
                            }
                        }, {modal:true, contentType:false, processData:false});
                    }
                }
            }
        }
    });

    return editor;
}

let lottieAnimation = null;
let isLottieLoaded = false; // Lottie 로드 완료 여부 플래그

// Lottie 애니메이션
function initLottieLoading() {
    $.ajax({
        url: '/trover/lottie/api',
        type: 'GET',
        success: function(response) {
            if (response.result === 'SUCC') {
                const lottieUrl = response.data.lottieUrl;

                lottieAnimation = lottie.loadAnimation({
                    container: document.getElementById('lottie-container'),
                    renderer: 'svg',
                    loop: true,
                    autoplay: false, // 처음에는 자동 재생하지 않음
                    path: lottieUrl // 서버에서 받은 JSON 경로
                });

                lottieAnimation.addEventListener('DOMLoaded', function() {
                    // Lottie 애니메이션 DOM 로드가 완료되면 플래그 설정
                    isLottieLoaded = true;
                    // 만약 현재 로딩 중이라면 Lottie 애니메이션을 재생합니다.
                    if (isLoading) {
                        if (lottieAnimation && isLottieLoaded) {
                            lottieAnimation.play();
                        }
                    }
                });

                lottieAnimation.addEventListener('data_failed', function() {
                    console.error('Lottie animation data failed to load.');
                    hideLoading();
                });

            } else {
                console.error('Failed to get lottie API response:', response.message);
                hideLoading();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching lottie API:', error);
            hideLoading();
        }
    });
}

// 로딩 시작
function showLoading() {
    $('#loading-overlay').show();
    if (lottieAnimation && isLottieLoaded) {
        lottieAnimation.play();
    }
}

// 로딩 종료
function hideLoading() {
    $('#loading-overlay').hide();
    if (lottieAnimation && isLottieLoaded) {
        lottieAnimation.stop();
    }
}

function goDownload(link) {
    if (!link) {
        console.error("다운로드 링크가 제공되지 않았습니다.");
        return;
    }

    let downloadUrl = link;
    if (!downloadUrl.startsWith("http") && !downloadUrl.startsWith("https")) {
        // 상대 경로인 경우 현재 도메인을 기준으로 절대 경로로 변환
        downloadUrl = window.location.origin + downloadUrl;
    }

    const userAgent = navigator.userAgent;
    let clientOs = '';

    if (/bankItApp/i.test(userAgent)) {
        if (/Android/i.test(userAgent)) {
            clientOs = "aos";
        } else if (/iPhone|iOS|iPad|iPod|Mac OS X/i.test(userAgent)) {
            clientOs = "ios";
        } else {
            clientOs = "pc";
        }
    }

    if (clientOs === "aos") {
        Native.downloadFile(downloadUrl);
    } else if (clientOs === "ios") {
        webkit.messageHandlers.downloadFile.postMessage(encodeURI(downloadUrl));
    } else {
        window.open(downloadUrl, '_blank');
    }
}

window.addEventListener('DOMContentLoaded', function () {
    // 키보드 접근 시 포커스 표시를 위해 keyboard-mode 클래스 부여
    window.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-mode');
        }
    });

    // 마우스 클릭 시에는 포커스 아웃라인 제거
    window.addEventListener('mousedown', function () {
        document.body.classList.remove('keyboard-mode');
    });

    // 모바일 환경 + 스크린리더 사용자 대비 outline 표시를 위한 강제 클래스 추가
    if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) {
            document.body.classList.add('keyboard-mode');
        }
    }

    // 다운로드 링크 클릭 이벤트 핸들러
    document.querySelectorAll("a[download]").forEach(function(link) {
        link.addEventListener("click", function(event) {
            // 앱에서 접속한 경우 다운로드 링크를 앱으로 전달
            if (navigator.userAgent.includes("bankItApp")) {
                event.preventDefault();
                let downloadUrl = this.getAttribute("href");
                if (!downloadUrl.startsWith("http") && !downloadUrl.startsWith("https")) {
                    // 상대 경로인 경우 현재 도메인을 기준으로 절대 경로로 변환
                    downloadUrl = window.location.origin + downloadUrl;
                }
                // 앱의 파일 다운로드 브리지 호출
                goDownload(downloadUrl);
            }
        });
    });
});