// ×ボタンによる閉じる機能は無効化（UIからも削除推奨）
// スライダーの動作と「もっと見る」ボタンの動作
const sliderTrack = document.querySelector('.slider-track');
let cards = Array.from(document.querySelectorAll('.profile-card'));
const dots = document.querySelectorAll('.dot');
const prevBtn = document.querySelector('.slider-btn.prev');
const nextBtn = document.querySelector('.slider-btn.next');
const moreBtn = document.querySelector('.more-btn');
const bottomArea = document.getElementById('bottom-area');
const bottomContents = [
  document.getElementById('bottom-content-0'),
  document.getElementById('bottom-content-1'),
  document.getElementById('bottom-content-2'),
  document.getElementById('bottom-content-3'),
  document.getElementById('bottom-content-4')
];

let current = 1; // 最初は1番目（クローンの次）
const total = cards.length;
// 無限ループ用クローンを両端に追加
const firstClone = cards[0].cloneNode(true);
const lastClone = cards[cards.length - 1].cloneNode(true);
firstClone.classList.add('clone');
lastClone.classList.add('clone');
sliderTrack.appendChild(firstClone);
sliderTrack.insertBefore(lastClone, cards[0]);
cards = Array.from(document.querySelectorAll('.profile-card'));

let autoSlideInterval = null;
const AUTO_SLIDE_MS = 5000; // 5秒ごとに自動スライド
let autoSlidePaused = false;

function updateSlider(animate = true) {
  // スライド1枚分の幅＋左右マージン
  const style = getComputedStyle(cards[0]);
  const cardWidth = cards[0].offsetWidth + parseInt(style.marginLeft) + parseInt(style.marginRight);
  if (animate) {
    sliderTrack.style.transition = 'transform 0.75s cubic-bezier(0.4,0,0.2,1)';
  } else {
    sliderTrack.style.transition = 'none';
  }
  sliderTrack.style.transform = `translateX(-${current * cardWidth}px)`;
  dots.forEach((dot, i) => {
    // current=1が1番目ドット、current=2が2番目…
    dot.classList.toggle('active', i === ((current - 1 + total) % total));
  });
  // 下の内容切り替え（表示中なら内容も切り替え）
  if (bottomArea.style.display !== 'none') {
    bottomContents.forEach((el, i) => {
      el.style.display = (i === ((current - 1 + total) % total)) ? '' : 'none';
    });
  }
}

function startAutoSlide() {
  if (autoSlideInterval) clearInterval(autoSlideInterval);
  if (autoSlidePaused) return;
  autoSlideInterval = setInterval(() => {
    goToNext();
  }, AUTO_SLIDE_MS);
}

function resetAutoSlide() {
  if (!autoSlidePaused) startAutoSlide();
}

function goToNext() {
  const cardWidth = cards[0].offsetWidth;
  if (current < total) {
    current++;
    updateSlider(true);
    if (current === total) {
      // クローンに到達したらアニメ後に一瞬で1枚目へ
      setTimeout(() => {
        current = 0;
        updateSlider(false);
      }, 750);
    }
  }
}
function goToPrev() {
  const cardWidth = cards[0].offsetWidth;
  if (current === 0) {
    // 逆方向無限ループ対応（必要なら実装）
    current = total;
    updateSlider(false);
    setTimeout(() => {
      current--;
      updateSlider(true);
    }, 20);
  } else {
    current--;
    updateSlider(true);
  }
}

nextBtn.addEventListener('click', () => {
  goToNext();
  resetAutoSlide();
});
prevBtn.addEventListener('click', () => {
  goToPrev();
  resetAutoSlide();
});
dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    current = i + 1;
    updateSlider(true);
    resetAutoSlide();
  });
});
window.addEventListener('resize', updateSlider);

// 「もっと見る」ボタンで下へスクロール or 閉じる
moreBtn.addEventListener('click', () => {
  if (bottomArea.style.display === '' || bottomArea.style.display === 'block') {
    // 既に表示中→閉じる
    bottomArea.style.display = 'none';
    moreBtn.textContent = 'もっと見る';
    autoSlidePaused = false;
    startAutoSlide();
  } else {
    // 下の半透明部分を表示
    bottomArea.style.display = '';
    // ドットと同じ基準で表示
    bottomContents.forEach((el, i) => {
      el.style.display = (i === ((current - 1 + total) % total)) ? '' : 'none';
    });
    // スクロール（タイトルと被らないように少し上に調整）
    setTimeout(() => {
      const headerHeight = document.querySelector('.header').offsetHeight || 56;
      const y = bottomArea.getBoundingClientRect().top + window.pageYOffset - headerHeight - 24;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }, 50);
    moreBtn.textContent = '閉じる';
    autoSlidePaused = true;
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
      autoSlideInterval = null;
    }
    
    // インタビューを読んだことをlocalStorageに記録
    addInterviewToCredits();
  }
});

// インタビューを読んだことをクレジットに追加する関数
function addInterviewToCredits() {
  // 現在表示されているインタビューの番号を取得
  const currentInterviewIndex = (current - 1 + total) % total;
  const interviewNumbers = ['1.1', '2.1', '3.1', '1.2', '2.2']; // 各インタビューに対応する番号
  
  if (currentInterviewIndex < interviewNumbers.length) {
    const numberToAdd = interviewNumbers[currentInterviewIndex];
    
    // 既存のクレジット状態を取得
    const savedCredits = localStorage.getItem('selectedCredits');
    let selectedNumbers = savedCredits ? JSON.parse(savedCredits) : [];
    
    // 重複チェックして追加
    if (!selectedNumbers.includes(numberToAdd)) {
      selectedNumbers.push(numberToAdd);
      localStorage.setItem('selectedCredits', JSON.stringify(selectedNumbers));
    }
  }
}

// 初期表示
updateSlider(false);
startAutoSlide();

// Topボタンのクリックイベント
document.querySelector('.top a').addEventListener('click', (e) => {
  e.preventDefault();
  // インタビューからの戻りフラグを設定
  sessionStorage.setItem('fromInterview', 'true');
  // URLフラグメントを使って確実に上部にスクロール
  window.location.href = '../index.html#top';
});
