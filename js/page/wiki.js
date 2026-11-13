function checkDevice(){
    let m_isMobile = getDevice() === 'mobile';
    if(!m_isMobile){
        location.href = '/'
    }
}
// ---------------- 오늘 날짜 업데이트 ----------------
$(function() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}년 ${month}월 ${day}일`;

    $('.today').text(dateString);
});


// ---------------- 시작 페이지 event ----------------
$(function () {
    checkDevice();

    const $startPage = $('.start_page');

    setTimeout(() => {
        $startPage.addClass('show');
    }, 400);
});


// 슬롯 텍스트 event
const words = [
    '사랑',
    '목소리',
    '쉬운 대출',
    '문자 한 줄',
    '싼 값',
    '위험한 게임',
    'QR코드',
    '일확천금'
];

// 오늘의 단어
let finalWord = '사랑';
let encyclopediaText = '';
let isSpinning = false;

const reelInner = document.querySelector('.slot_reel_inner');

$(function() {
    let param = {};

    l_ajax("get", "json", "/scam/wiki/data", param, function(json) {
        const result = json;

        if (!result) {
            buildReel();
            spinTo(finalWord);
            return;
        }

        // keyword 처리
        if (result.keyword) {
            finalWord = result.keyword;
        }

        // phrase 처리
        if (result.phrase) {
            $('.sec_head .row3 p').text(result.phrase);
        }

        if (result.groupId) {
            const groupIdStr = String(result.groupId).padStart(2, '0');
            const imgUrl = `./static/images/wiki/today_ill_${groupIdStr}.png`;
            $('.sec_head figure').css('background-image', `url("${imgUrl}")`);

            $('.sec_head figure').attr('aria-label', `${result.word || '오늘의 주제'} 관련 일러스트`);
        }

        // word 처리
        if (result.word) {
            $('.word_trigger .topic').text(result.word);
            $('#popupWord .tit').text(result.word);
        }

        // 조사(을/를) 처리
        if (result.groupId) {
            const jText = (result.groupId === 5 || result.groupId === 8) ? '를' : '을';
            $('.word_trigger .row2 > p').text(jText);
        }

        // buttonYn 처리
        $('.btn_popup').toggle(result.buttonYn === "Y");

        // contents 처리
        if (result.contents) {
            encyclopediaText = result.contents;
        }

        // 팝업 내용 업데이트
        if (result.definitionContents) {
            const paragraphs = result.definitionContents
                .split('\n')
                .filter(line => line.trim() !== '')
                .map(line => `<p>${line.trim()}</p>`)
                .join('');

            $('#popupWord .cont_txt').html(paragraphs);
        }

        buildReel();
        spinTo(finalWord);
    });
});

// 랜덤 단어 설정 - 5개
function getRandomSpinWords(originalList, finalWord) {
    const others = originalList.filter(w => w !== finalWord);
    const shuffled = others.sort(() => Math.random() - 0.5);
    const pick4 = shuffled.slice(0, 4);
    const result = [...pick4, finalWord];
    return result.sort(() => Math.random() - 0.5);
}

let spinWords = [];

function buildReel() {
    reelInner.innerHTML = '';

    spinWords = getRandomSpinWords(words, finalWord);

    const total = spinWords.length;
    const step = 360 / total;
    const radius = 60;

    spinWords.forEach((txt, i) => {
        const face = document.createElement('div');
        face.className = 'slot_face';
        face.textContent = txt;

        const angle = i * step;
        face.style.transform = `rotateX(${angle}deg) translateZ(${radius}px)`;

        reelInner.appendChild(face);
    });
}

function spinTo(finalWord) {
    if (isSpinning) return;
    isSpinning = true;

    const total = spinWords.length;
    const step = 360 / total;
    const finalIndex = spinWords.indexOf(finalWord);

    const spinTurns = 1;
    const angle = -(finalIndex * step) - (360 * spinTurns);

    requestAnimationFrame(() => {
        reelInner.style.transform = `rotateX(${angle}deg)`;
    });

    reelInner.addEventListener('transitionend', function end() {
        reelInner.removeEventListener('transitionend', end);
        isSpinning = false;

        const announce = document.getElementById('slot-announce');
        if (announce) {
            announce.textContent = `오늘도 ${finalWord}에 속지말자`;
        }
    });
}


// 스크롤 제어 & 버튼 클릭시
$(function () {
    const $startPage = $('.start_page');
    const $btnCta = $('.btn_cta');
    const $contPage = $('.cont_page');
    const $footer = $('#footer');

    $('body').css('overflow', 'hidden');

    $btnCta.on('click', function () {
        $startPage.fadeOut(400, function () {
            $('body').css('overflow', 'auto');
            $contPage.fadeIn(600, function () {
                if (typeof initEncyclopediaSwiper === 'function') {
                    initEncyclopediaSwiper();
                }
                if (typeof initMarquee === 'function') {
                    initMarquee();
                }
            });
            $footer.fadeIn(600);
        });
    });
});



// ---------------- 본문 페이지 event ----------------

// 팝업 열리면 바디 스크롤 X
$(function() {
    function lockBody() {
        const scrollY = window.scrollY || window.pageYOffset;
        $('body')
            .css({
                position: 'fixed',
                top: `-${scrollY}px`,
                width: '100%',
            })
            .attr('data-scrollY', scrollY);
    }

    function unlockBody() {
        const scrollY = parseInt($('body').attr('data-scrollY') || '0');
        $('body').css({ position: '', top: '', width: '' }).removeAttr('data-scrollY');
        window.scrollTo(0, scrollY);
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const $target = $(mutation.target);
                if ($target.hasClass('popup')) {
                    if ($target.hasClass('active')) {
                        lockBody();
                    } else {
                        unlockBody();
                    }
                }
            }
        });
    });

    $('.popup').each(function() {
        observer.observe(this, { attributes: true, attributeFilter: ['class'] });
    });
});


// 종이 애니메이션
window.addEventListener('scroll', () => {
    const sec01 = document.querySelector('.sec_01');
    const rect = sec01.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.5 && !sec01.classList.contains('on')) {
        sec01.classList.add('on');
    }
});


// section1 - swiper
function initEncyclopediaSwiper() {
    const slides = splitTextIntoSlides(encyclopediaText, 350);
    const wrapper = document.querySelector('.sec_01 .swiper-wrapper');
    wrapper.innerHTML = '';

    slides.forEach((html, idx) => {
        wrapper.insertAdjacentHTML(
            'beforeend',
            `<div class="swiper-slide" role="group" aria-roledescription="slide" aria-label="${idx+1} / ${slides.length}">
       <p class="auto-split">${html}</p>
     </div>`
        );
    });

    const swiper = new Swiper('.sec_01 .swiper', {
        slidesPerView: 1,
        loop: false,
        keyboard: { enabled: true },
        a11y: {
            enabled: true,
            containerMessage: '오늘의 백과사전 슬라이드',
            containerRoleDescriptionMessage: '캐러셀',
            itemRoleDescriptionMessage: '슬라이드',
            slideLabelMessage: '{{index1}} / {{slidesLength}}',
            prevSlideMessage: '이전 슬라이드',
            nextSlideMessage: '다음 슬라이드',
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        on: {
            init() {
                updateNavButtons(this);
            },
            slideChange() {
                updateNavButtons(this);
            },
        },
    });
}

// 텍스트 분할 (줄바꿈 + 공백 포함)
function splitTextIntoSlides(text, maxHeight) {
    const htmlText = text
        .replace(/\r\n/g, '\n')
        .replace(/\n{2,}/g, '<br><br>')
        .replace(/\n/g, '<br>');

    const tokens = htmlText.match(/<[^>]+>|[\s\S]/g) || [];

    const tester = document.createElement('p');
    tester.style.cssText = `
    position:absolute;
    visibility:hidden;
    width:18.125rem;
    padding:2.625rem 1.5rem 5rem;
    border: 2px solid transparent;
    line-height:200%;
    font-size:1rem;
    font-weight:600;
    white-space:normal;
  `;
    document.body.appendChild(tester);

    const slides = [];
    let currentHTML = '';
    let openTags = [];

    const tolerance = 10;

    for (let i = 0; i < tokens.length; i++) {
        const nextHTML = currentHTML + tokens[i];
        tester.innerHTML = nextHTML;

        // 노출될 공간 높이 계산
        const rect = tester.getBoundingClientRect();

        if (rect.height > maxHeight + tolerance) {
            const closed = syncOpenTags(currentHTML, openTags);
            slides.push(closed.html);
            openTags = closed.openTags;

            const reopenTags = openTags.map(t => `<${t}>`).join('');
            currentHTML = reopenTags + tokens[i];
            tester.innerHTML = currentHTML;

            const rect2 = tester.getBoundingClientRect();
            if (rect2.height > maxHeight + tolerance) {
                const closedAgain = syncOpenTags(currentHTML, openTags);
                slides.push(closedAgain.html);
                openTags = closedAgain.openTags;
                currentHTML = '';
            }
        } else {
            currentHTML = nextHTML;
        }
    }

    if (currentHTML.trim()) {
        const closed = syncOpenTags(currentHTML, openTags);
        slides.push(closed.html);
    }

    tester.remove();
    return slides;
}

// <b> 중복 방지
function syncOpenTags(html, prevOpenTags = []) {
    const tagRegex = /<\/?([a-zA-Z0-9]+)(?:\s[^>]*)?>/g;
    const stack = [...prevOpenTags];
    let match;

    while ((match = tagRegex.exec(html))) {
        const tag = match[1].toLowerCase();

        if (['br', 'img', 'hr'].includes(tag)) continue;

        if (match[0].startsWith('</')) {
            const idx = stack.lastIndexOf(tag);
            if (idx !== -1) stack.splice(idx, 1);
        } else {
            if (!stack.includes(tag)) stack.push(tag);
        }
    }

    const uniqueOpen = [...stack];

    let closedHTML = html;
    if (uniqueOpen.length > 0) {
        closedHTML += uniqueOpen
            .slice()
            .reverse()
            .map(t => `</${t}>`)
            .join('');
    }

    return { html: closedHTML, openTags: uniqueOpen };
}

function updateNavButtons(swiper) {
    const $prev = $('.sec_01 .swiper-button-prev');
    const $next = $('.sec_01 .swiper-button-next');
    const index = swiper.activeIndex;
    const total = swiper.slides.length - 1;

    $prev.toggleClass('on', index > 0);
    $next.toggleClass('on', index < total);
}


// 무한롤링 이미지
window.addEventListener("load", () => {
    requestAnimationFrame(() => {
        const tracks = document.querySelectorAll(".marquee_track");

        window.initMarquee = function () {
            tracks.forEach((track, idx) => {
                const direction = idx % 2 === 0 ? -1 : 1;
                const speed = 0.4;
                let x = 0;
                let lastX = 0;
                let frameId;
                let lastWidth = window.innerWidth;

                function fillTrack() {
                    const parentWidth = track.parentElement.offsetWidth;
                    const originals = Array.from(track.children);
                    const baseSet = originals.map(item => item.cloneNode(true));

                    track.innerHTML = "";
                    baseSet.forEach(node => track.appendChild(node.cloneNode(true)));

                    let trackWidth = track.scrollWidth;

                    while (trackWidth < parentWidth * 4) {
                        baseSet.forEach(node => track.appendChild(node.cloneNode(true)));
                        trackWidth = track.scrollWidth;
                    }

                    track.style.willChange = "transform";
                    track.style.backfaceVisibility = "hidden";
                    track.style.transform = "translate3d(0,0,0)";
                }

                function animate() {
                    x += direction * speed;
                    const totalWidth = track.scrollWidth / 2;

                    if (direction < 0 && Math.abs(x) >= totalWidth) x += totalWidth;
                    if (direction > 0 && x >= 0) x -= totalWidth;

                    lastX = x;
                    track.style.transform = `translate3d(${x}px, 0, 0)`;
                    frameId = requestAnimationFrame(animate);
                }

                function init() {
                    cancelAnimationFrame(frameId);
                    x = 0;
                    fillTrack();
                    animate();
                }

                setTimeout(init, 100);

                // (iOS 탭 전환 대응)
                document.addEventListener("visibilitychange", () => {
                    if (document.visibilityState === "hidden") {
                        cancelAnimationFrame(frameId);
                    } else {
                        x = lastX;
                        frameId = requestAnimationFrame(animate);
                    }
                });

                // (모바일 scroll=resize 버그 방지)
                let resizeTimer;
                window.addEventListener("resize", () => {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(() => {
                        if (window.innerWidth !== lastWidth) {
                            cancelAnimationFrame(frameId);
                            init();
                            lastWidth = window.innerWidth;
                        }
                    }, 300);
                });
            });
        };
        window.initMarquee();
    });
});

// 해시태그 복사
$(function() {
    const $copyBox = $('.copy_box');

    if ($copyBox.length > 0) {
        $copyBox.on('click', async function() {
            try {
                await navigator.clipboard.writeText('#금융사기예방 #은행연합회 #NFC키링');
                showToast('해시태그가 복사되었어요!');
            } catch (err) {
                alert('복사 중 오류가 발생했어요. 다시 시도해주세요.');
                console.error(err);
            }
        });
    }
});

// 복사완료 toast alert
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}
