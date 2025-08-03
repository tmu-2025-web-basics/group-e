document.addEventListener('DOMContentLoaded', function() {
    const openingScreen = document.getElementById('opening-screen');
    const startButton = document.getElementById('startButton');
    const buttonText = startButton.querySelector('p');
    const lists = document.querySelectorAll('.slot .box ul');
    const creditsItems = document.querySelectorAll('.credits .list ul li');
    const exAll = document.querySelector('.ex-all');
    const exItems = document.querySelectorAll('.ex');
    const mainvisualImg = document.querySelector('.mainvisual img');
    const infoElement = document.querySelector('.info');
    const directionElement = document.querySelector('.direction');
    const someElement = document.querySelector('.some');
    const infoLink = document.querySelector('.info a');
    const hukidasiElement = document.querySelector('.hukidasi');
    let isSpinning = false;
    let selectedResults = [];

    // ページ読み込み時にlocalStorageからクレジット状態を復元
    checkAndResetCreditsOnFirstVisit();
    loadCreditsFromStorage();
    
    // 全てのクレジットを青い四角で表示（確実に実行）
    forceShowAllBlueSquares();

    // オープニング画面のスクロールアニメーション（1秒待ってから1秒かけて上にスクロール）
    setTimeout(() => {
        openingScreen.classList.add('scroll-up');
        
        // スクロール完了後に要素を削除
        setTimeout(() => {
            openingScreen.style.display = 'none';
        }, 1000);
    }, 1000);

    // 初期表示で最初のliをboxの中央に表示
    lists.forEach(list => {
        list.style.transform = 'translateY(0px)';
    });

    // 初期状態でexを非表示
    hideAllEx();

    // ホバーイベントを設定する関数
    function addHoverEvents() {
        lists.forEach(list => {
            const listItems = list.querySelectorAll('li');
            listItems.forEach(item => {
                // 既存のイベントを削除（重複防止）
                item.removeEventListener('mouseenter', handleMouseEnter);
                item.removeEventListener('mouseleave', handleMouseLeave);
                
                // 新しいイベントを追加
                item.addEventListener('mouseenter', handleMouseEnter);
                item.addEventListener('mouseleave', handleMouseLeave);
            });
        });
    }

    function handleMouseEnter() {
        // スロット回転中はホバーイベントを無視
        if (isSpinning) return;
        
        const link = this.querySelector('a');
        if (link) {
            const img = link.querySelector('img');
            if (img) {
                const altText = img.alt;
                const match = altText.match(/リンク(.+)/);
                if (match) {
                    const number = match[1];
                    showCorrespondingEx(number);
                }
            }
        }
    }

    function handleMouseLeave() {
        // スロット回転中はホバーイベントを無視
        if (isSpinning) return;
        
        // 確実にexを非表示
        hideAllEx();
    }

    // 初期ホバーイベントを設定
    addHoverEvents();
    addCreditHoverEvents();

    function showCorrespondingEx(number) {
        // まず全てをフェードアウト
        exItems.forEach(ex => {
            if (ex.classList.contains('show')) {
                ex.classList.add('fade-out');
            }
        });
        
        // 300ms後に新しいexを表示開始
        setTimeout(() => {
            hideAllEx();
            
            // 番号をインデックスに変換（"1.1" -> 0, "1.2" -> 1, etc.）
            const exIndex = convertNumberToIndex(number);
            
            // 対応するexアイテムを表示
            if (exIndex >= 0 && exIndex < exItems.length) {
                const ex = exItems[exIndex];
                ex.classList.add('show');
                ex.classList.remove('fade-out');
                exAll.classList.add('show');
                exAll.style.display = 'block';
                
                // スロット用のデフォルト位置設定をリセット
                resetExAllPosition();
                
                // 少し遅延してからフェードイン開始
                setTimeout(() => {
                    ex.style.opacity = '1';
                }, 5);
            }
        }, 300);
    }

    function hideAllEx() {
        exItems.forEach(ex => {
            ex.classList.remove('show', 'fade-out');
            ex.style.opacity = '0.3';
        });
        exAll.classList.remove('show');
        // 確実に非表示にする
        exAll.style.display = 'none';
        
        // 位置設定をリセット
        resetExAllPosition();
    }

    // ex-allの位置設定をデフォルトに戻す関数
    function resetExAllPosition() {
        const mainvisual = document.querySelector('.mainvisual');
        if (mainvisual) {
            const rect = mainvisual.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            exAll.style.position = 'absolute';
            exAll.style.top = (rect.top + scrollTop +(rect.height * 0.8)) + 'px';
            exAll.style.left = '50%';
            exAll.style.transform = 'translateX(-50%)';
            exAll.style.zIndex = '200';
        } else {
            // mainvisualが見つからない場合はCSSデフォルト値に戻す
            exAll.style.position = '';
            exAll.style.top = '';
            exAll.style.left = '';
            exAll.style.transform = '';
            exAll.style.zIndex = '';
        }
    }

    startButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (isSpinning) return;
        
        // 前回の選択をリセットしない（永続化）
        selectedResults = [];
        
        // スロット開始前にexを非表示
        hideAllEx();
        
        // hukidasiを非表示
        hukidasiElement.classList.remove('show');
        
        // 初期テキストを非表示にしてリストを表示
        const initialTexts = document.querySelectorAll('.initial-text');
        initialTexts.forEach(text => {
            text.style.display = 'none';
        });
        lists.forEach(list => {
            list.style.display = 'flex';
        });
        
        isSpinning = true;
        buttonText.textContent = 'spinning...';
        startButton.style.pointerEvents = 'none';
        
        // mainvisualをgo.svgに変更
        mainvisualImg.src = 'img/SVG/go.svg';
        
        // 全てのリストにスピンアニメーションを追加
        lists.forEach(list => {
            list.classList.add('spinning');
            list.classList.remove('stopping');
        });
        
        // 3秒後に減速開始
        setTimeout(() => {
            stopSlots();
        }, 3000);
    });

    function stopSlots() {
        lists.forEach((list, index) => {
            setTimeout(() => {
                list.classList.remove('spinning');
                list.classList.add('stopping');
    
                // ランダムなliアイテム（0-9）を選択（10個のアイテム）
                const randomItem = Math.floor(Math.random() * 10);
                const items = Array.from(list.children);
    
                // 並び替え：選ばれたliを先頭に
                const newOrder = [];
                for (let i = 0; i < items.length; i++) {
                    newOrder.push(items[(randomItem + i) % items.length]);
                }
                list.innerHTML = '';
                newOrder.forEach(item => list.appendChild(item));
    
                // 選ばれたliがboxの中央に来るよう配置
                list.style.transform = 'translateY(0px)';
                
                // ホバーイベントを再設定
                addHoverEvents();
                
                // 結果を記録（表示されているアイテムのaltテキストを取得）
                const selectedLink = newOrder[0].querySelector('a');
                if (selectedLink) {
                    const img = selectedLink.querySelector('img');
                    if (img) {
                        const altText = img.alt;
                        selectedResults.push(altText);
                    }
                }
    
                // 最後のスロットが止まったらボタンを有効化
                if (index === lists.length - 1) {
                    setTimeout(() => {
                        buttonText.textContent = 'もう一度';
                        startButton.style.pointerEvents = 'auto';
                        isSpinning = false;
                        
                        // mainvisualをfinish.svgに変更
                        mainvisualImg.src = 'img/SVG/finish.svg';
                        
                        // hukidasiを表示
                        hukidasiElement.classList.add('show');
                        
                        // creditsのliアイテムを更新（追加のみ）
                        updateCreditsSelection();
                    }, 500);
                }
            }, index * 1000);
        });
    }

    function updateCreditsSelection() {
        selectedResults.forEach(result => {
            // "リンク1.1" から "1.1" を抽出
            const match = result.match(/リンク(.+)/);
            if (match) {
                const number = match[1];
                
                // creditsの対応するliアイテムを探して選択状態にする
                creditsItems.forEach(item => {
                    const img = item.querySelector('img');
                    if (img && img.alt) {
                        const altMatch = img.alt.match(/リンク(.+)/);
                        if (altMatch && altMatch[1] === number) {
                            // selectedクラスを追加（青い四角を非表示にして画像を表示）
                            item.classList.add('selected');
                            
                            // 強制的な青い四角クラスも削除
                            item.classList.remove('force-blue-square');
                            
                            // 緊急時のCSS変数もリセット
                            item.style.removeProperty('--force-blue');
                        }
                    }
                });
            }
        });
        
        // localStorageに保存
        saveCreditsToStorage();
        
        // クレジットのホバーイベントを再設定
        addCreditHoverEvents();
    }

    // クレジットにホバーイベントを設定する関数
    function addCreditHoverEvents() {
        creditsItems.forEach(item => {
            // 既存のイベントを削除（重複防止）
            item.removeEventListener('mouseenter', handleCreditMouseEnter);
            item.removeEventListener('mouseleave', handleCreditMouseLeave);
            
            // 新しいイベントを追加
            item.addEventListener('mouseenter', handleCreditMouseEnter);
            item.addEventListener('mouseleave', handleCreditMouseLeave);
        });
    }

    function handleCreditMouseEnter() {
        // selectedクラスがない場合（水色の四角が表示されている場合）は何もしない
        if (!this.classList.contains('selected')) return;
        
        const img = this.querySelector('img');
        if (img && img.alt) {
            const altMatch = img.alt.match(/リンク(.+)/);
            if (altMatch) {
                const number = altMatch[1];
                showCorrespondingExForCredit(number, this);
            }
        }
    }

    function handleCreditMouseLeave() {
        // selectedクラスがない場合は何もしない
        if (!this.classList.contains('selected')) return;
        
        hideAllEx();
    }

    function showCorrespondingExForCredit(number, creditElement) {
        // まず全てをフェードアウト
        exItems.forEach(ex => {
            if (ex.classList.contains('show')) {
                ex.classList.add('fade-out');
            }
        });
        
        // 300ms後に新しいexを表示開始
        setTimeout(() => {
            hideAllEx();
            
            // 番号をインデックスに変換
            const exIndex = convertNumberToIndex(number);
            
            // 対応するexアイテムを表示
            if (exIndex >= 0 && exIndex < exItems.length) {
                const ex = exItems[exIndex];
                ex.classList.add('show');
                ex.classList.remove('fade-out');
                exAll.classList.add('show');
                exAll.style.display = 'block';
                
                // クレジット用の位置設定
                setExAllPositionForCredit(creditElement);
                
                // 少し遅延してからフェードイン開始
                setTimeout(() => {
                    ex.style.opacity = '1';
                }, 5);
            }
        }, 300);
    }

    // クレジット用のex-all位置設定関数
    function setExAllPositionForCredit(creditElement) {
        const rect = creditElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        exAll.style.position = 'absolute';
        exAll.style.top = (rect.bottom + scrollTop + 10) + 'px';
        exAll.style.left = '50%';
        exAll.style.transform = 'translateX(-50%)';
        exAll.style.zIndex = '1000';
    }

    // 番号をexアイテムのインデックスに変換する関数
    function convertNumberToIndex(number) {
        // "1.1" -> 0, "1.2" -> 1, "1.10" -> 9, "2.1" -> 10, "2.2" -> 11, etc.
        const parts = number.split('.');
        if (parts.length !== 2) return -1;
        
        const major = parseInt(parts[0]) - 1; // 1-based to 0-based
        const minor = parseInt(parts[1]) - 1; // 1-based to 0-based
        
        return major * 10 + minor; // 各メジャー番号に10個のマイナー番号がある
    }

    // localStorageにクレジット状態を保存
    function saveCreditsToStorage() {
        const selectedCredits = [];
        creditsItems.forEach(item => {
            if (item.classList.contains('selected')) {
                const img = item.querySelector('img');
                if (img && img.alt) {
                    const altMatch = img.alt.match(/リンク(.+)/);
                    if (altMatch) {
                        selectedCredits.push(altMatch[1]);
                    }
                }
            }
        });
        localStorage.setItem('selectedCredits', JSON.stringify(selectedCredits));
    }

    // localStorageからクレジット状態を読み込み
    function loadCreditsFromStorage() {
        const savedCredits = localStorage.getItem('selectedCredits');
        if (savedCredits) {
            const selectedNumbers = JSON.parse(savedCredits);
            selectedNumbers.forEach(number => {
                creditsItems.forEach(item => {
                    const img = item.querySelector('img');
                    if (img && img.alt) {
                        const altMatch = img.alt.match(/リンク(.+)/);
                        if (altMatch && altMatch[1] === number) {
                            item.classList.add('selected');
                        }
                    }
                });
            });
        }
    }

    // 初回訪問時のチェックとクレジットリセット
    function checkAndResetCreditsOnFirstVisit() {
        const hasVisitedBefore = localStorage.getItem('hasVisitedSite');
        const fromInterview = sessionStorage.getItem('fromInterview');
        
        // 初回訪問かつインタビューからの戻りではない場合
        if (!hasVisitedBefore && !fromInterview) {
            // クレジットをリセット
            localStorage.removeItem('selectedCredits');
            
            // 強制的に全てのクレジットアイテムから selected クラスを削除
            resetAllCreditsToBlueSquare();
            
            // 訪問済みフラグを設定
            localStorage.setItem('hasVisitedSite', 'true');
            
            console.log('初回訪問: クレジットをリセットしました');
        } else {
            console.log('初回訪問ではありません: hasVisitedBefore =', hasVisitedBefore, 'fromInterview =', fromInterview);
        }
        
        // セッションストレージの fromInterview をクリア
        sessionStorage.removeItem('fromInterview');
    }

    // 全てのクレジットを青い四角状態にリセットする関数
    function resetAllCreditsToBlueSquare() {
        creditsItems.forEach(item => {
            // selected クラスを削除して青い四角を表示
            item.classList.remove('selected');
            
            // 強制的にスタイルをリセット
            item.style.position = 'relative';
            
            // 疑似要素の表示を確実にするために一時的にクラスを追加
            item.classList.add('force-blue-square');
        });
        
        // 短い遅延後に一時クラスを削除
        setTimeout(() => {
            creditsItems.forEach(item => {
                item.classList.remove('force-blue-square');
                // 再度selectedクラスがないことを確認
                if (item.classList.contains('selected')) {
                    item.classList.remove('selected');
                }
            });
        }, 100);
        
        console.log('全てのクレジットを青い四角状態にリセットしました');
    }

    // 全てのクレジットを青い四角状態にする新しい関数
    function forceShowAllBlueSquares() {
        creditsItems.forEach(item => {
            // 既に選択済みでない場合のみ青い四角を表示
            if (!item.classList.contains('selected')) {
                // 強制的に青い四角を表示するクラスを追加
                item.classList.add('force-blue-square');
                
                // スタイルを確実に適用
                item.style.position = 'relative';
                
                // 疑似要素の表示を確実にする
                const computedStyle = window.getComputedStyle(item, '::before');
                if (computedStyle.display === 'none') {
                    // CSSが適用されていない場合の緊急措置
                    item.style.setProperty('--force-blue', 'block');
                }
            }
        });
        
        console.log('選択されていないクレジットに青い四角を強制表示しました');
    }

    // infoクリックイベント
    infoElement.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (directionElement.classList.contains('active')) {
            // 非表示にする
            directionElement.style.opacity = '0';
            infoLink.textContent = '?';
            setTimeout(() => {
                directionElement.classList.remove('active');
                someElement.classList.remove('active');
            }, 1000);
        } else {
            // 表示する
            directionElement.classList.add('active');
            someElement.classList.add('active');
            infoLink.textContent = '✖';
            setTimeout(() => {
                directionElement.style.opacity = '1';
            }, 10);
        }
    });

    // 外側クリックで非表示
    document.addEventListener('click', function(e) {
        if (!infoElement.contains(e.target) && !directionElement.contains(e.target)) {
            if (directionElement.classList.contains('active')) {
                directionElement.style.opacity = '0';
                infoLink.textContent = '?';
                setTimeout(() => {
                    directionElement.classList.remove('active');
                    someElement.classList.remove('active');
                }, 1000);
            }
        }
    });

    // Topボタンのクリックイベント
    const topButton = document.querySelector('.top');
    if (topButton) {
        topButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
