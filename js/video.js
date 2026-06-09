simulatedTime = Math.max(0, Math.min(TOTAL_SECONDS, timeSec));
            const m = Math.floor(simulatedTime / 60);
            const s = Math.floor(simulatedTime % 60);
            const tc = document.getElementById('time-current');
            if (tc) tc.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
            const pct = (simulatedTime / TOTAL_SECONDS * 100);
            const fill = document.getElementById('vp-fill');
            const thumb = document.getElementById('vp-thumb');
            if (fill) fill.style.width = pct + '%';
            if (thumb) thumb.style.left = pct + '%';
        }

        function startSimulatedPlay() {
            if (playTimer) return;
            isPlaying = true;
            const btn = document.querySelector('.play-btn-mini');
            if (btn) btn.textContent = '⏸';
            playTimer = setInterval(() => {
                simulatedTime += 1;
                if (simulatedTime >= TOTAL_SECONDS) {
                    simulatedTime = TOTAL_SECONDS;
                    stopSimulatedPlay();
                }
                updateProgressUI(simulatedTime);
            }, 1000);
            showFloatToast('▶ 播放');
        }

        function stopSimulatedPlay() {
            isPlaying = false;
            if (playTimer) { clearInterval(playTimer); playTimer = null; }
            const btn = document.querySelector('.play-btn-mini');
            if (btn) btn.textContent = '▶';
            showFloatToast('⏸ 暂停');
        }

        document.querySelector('.play-btn-mini')?.addEventListener('click', e => {
            e.stopPropagation();
            if (isPlaying) { stopSimulatedPlay(); } else { startSimulatedPlay(); }
        });

        // 时间戳点击跳转 + hover 即跳转 — 进度条定位
        let videoCurrentTime = '00:00';
        function seekVideoTo(timeText) {
            // timeText 形如 "00:01-00:07" 或 "00:08"
            const start = (timeText.match(/(\d+:\d+)/) || [])[1] || '00:00';
            videoCurrentTime = start;
            const [m, s] = start.split(':').map(Number);
            const targetSec = m * 60 + s;
            // 暂停播放，跳转到指定位置
            stopSimulatedPlay();
            updateProgressUI(targetSec);
            // 高亮对应进度条段
            document.querySelectorAll('#vp-segments .seg').forEach(s => s.classList.remove('focus'));
            const card = document.querySelector('.annot-card.focus-current');
            if (card) {
                const id = card.dataset.id;
                const seg = document.querySelector(`#vp-segments .seg[data-card="${id}"]`);
                if (seg) seg.classList.add('focus');
            }
        }
        document.querySelectorAll('.card-time, .asr-full .ts, .asr-row .ts').forEach(t => {
            t.addEventListener('click', e => {
                e.stopPropagation();
                const txt = t.textContent.trim().replace(/[▶\s]/g, '');
                seekVideoTo(txt);
                showFloatToast(`⏯ 跳转到 ${t.textContent.trim()}`);
            });
            // hover 即触发轻量预览（不显示 toast，避免噪音）
            t.addEventListener('mouseenter', () => {
                const txt = t.textContent.trim().replace(/[▶\s]/g, '');
                seekVideoTo(txt);
            });
        });

        // 视频段着色条（基于卡片状态实时生成） ============
        function getTotalSeconds() { return TOTAL_SECONDS; }
        function parseTimeRange(text) {
            const m = text.match(/(\d+):(\d+)-(\d+):(\d+)/);
            if (!m) return null;
            const s = parseInt(m[1]) * 60 + parseInt(m[2]);
            const e = parseInt(m[3]) * 60 + parseInt(m[4]);
            return { s, e };
        }
        function renderVideoSegments() {
            const seg = document.getElementById('vp-segments');
            if (!seg) return;
            seg.innerHTML = '';
            document.querySelectorAll('.annot-card').forEach(card => {
                const tEl = card.querySelector('.card-time');
                if (!tEl) return;
                const r = parseTimeRange(tEl.textContent);
                if (!r) return;
                const left = (r.s / getTotalSeconds() * 100).toFixed(2);
                const width = Math.max(2, (r.e - r.s) / getTotalSeconds() * 100).toFixed(2);
                const state = card.classList.contains('confirmed') ? 'accepted'
                            : card.classList.contains('rejected') ? 'rejected' : 'pending';
                const focus = card.classList.contains('focus-current') ? ' focus' : '';
                const d = document.createElement('div');
                d.className = `seg ${state}${focus}`;
                d.style.left = `${left}%`;
                d.style.width = `${width}%`;
                d.dataset.card = card.dataset.id;
                d.title = `${tEl.textContent.trim()} · ${state === 'accepted' ? '已接受' : state === 'rejected' ? '已剔除' : '待处理'}`;
                d.onclick = e => { e.stopPropagation(); card.click(); };
                seg.appendChild(d);
            });
        }
        renderVideoSegments();

        // ============ 进度条点击拖拽跳转 ============
        const progressBar = document.getElementById('video-progress');
        if (progressBar) {
            function seekByProgress(e) {
                const rect = progressBar.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                stopSimulatedPlay();
                updateProgressUI(pct * TOTAL_SECONDS);
            }
            progressBar.addEventListener('click', e => {
                if (e.target.classList.contains('seg')) return;
                seekByProgress(e);
            });
            // 拖拽支持
            let isDragging = false;
            progressBar.addEventListener('mousedown', e => {
                if (e.target.classList.contains('seg')) return;
                isDragging = true;
                seekByProgress(e);
            });
            document.addEventListener('mousemove', e => {
                if (!isDragging) return;
                seekByProgress(e);
            });
            document.addEventListener('mouseup', () => { isDragging = false; });
            // 点击段着色条跳转到段中点
            const segContainer = document.getElementById('vp-segments');
            if (segContainer) {
                segContainer.addEventListener('click', e => {
                    const seg = e.target.closest('.seg');
                    if (!seg) return;
                    const left = parseFloat(seg.style.left) || 0;
                    const width = parseFloat(seg.style.width) || 0;
                    const midPct = (left + width / 2) / 100;
                    stopSimulatedPlay();
                    updateProgressUI(midPct * TOTAL_SECONDS);
                });
            }
        }
        // 状态变化时重渲染
        const _origSetCardState = setCardState;
        setCardState = function(card, state, extra) {
            _origSetCardState(card, state, extra);
            renderVideoSegments();
            updateQualityCheck();
        };

        // ============ 视频截取模式 ============
        let clipMode = false;      // 是否在截取模式
        let clipStart = null;      // 截取起点秒数
        let clipMarkerStart = null; // 起点 DOM 标记
        let clipMarkerEnd = null;   // 终点 DOM 标记
        let clipRangeBar = null;   // 范围高亮条
        let clipHint = null;       // 提示文字

        function formatSec(sec) {
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        }

        function clearClipUI() {
            clipMarkerStart?.remove(); clipMarkerStart = null;
            clipMarkerEnd?.remove(); clipMarkerEnd = null;
            clipRangeBar?.remove(); clipRangeBar = null;
            clipHint?.remove(); clipHint = null;
        }

        function exitClipMode() {
            clipMode = false;
            clipStart = null;
            clearClipUI();
            document.querySelector('.vc-action.clip-active')?.classList.remove('clip-active');
        }

        function addClipMarker(sec, label) {
            const bar = document.getElementById('video-progress');
            if (!bar) return null;
            const marker = document.createElement('div');
            marker.className = 'clip-marker';
            marker.dataset.label = label;
            marker.style.left = (sec / TOTAL_SECONDS * 100) + '%';
            bar.appendChild(marker);
            return marker;
        }

        function updateClipRange(endSec) {
            if (!clipRangeBar && clipStart !== null) {
                const bar = document.getElementById('video-progress');
                if (!bar) return;
                clipRangeBar = document.createElement('div');
                clipRangeBar.className = 'clip-range-bar';
                bar.appendChild(clipRangeBar);
            }
            if (clipRangeBar && clipStart !== null) {
                const leftPct = Math.min(clipStart, endSec) / TOTAL_SECONDS * 100;
                const rightPct = Math.max(clipStart, endSec) / TOTAL_SECONDS * 100;
                clipRangeBar.style.left = leftPct + '%';
                clipRangeBar.style.width = (rightPct - leftPct) + '%';
            }
            if (clipHint) {
                const s = Math.min(clipStart, endSec);
                const e = Math.max(clipStart, endSec);
                clipHint.textContent = `${formatSec(s)} — ${formatSec(e)}`;
            }
        }

        // 点击「视频截取」按钮
        document.querySelectorAll('.vc-action').forEach(btn => {
            if (btn.textContent.trim() !== '视频截取') return;
            btn.addEventListener('click', e => {
                e.stopPropagation();
                if (clipMode) {
                    exitClipMode();
                    showFloatToast('✗ 已退出截取模式');
                    return;
                }
                clipMode = true;
                clipStart = null;
                btn.classList.add('clip-active');
                clearClipUI();
                // 显示提示
                const bar = document.getElementById('video-progress');
                if (bar) {
                    clipHint = document.createElement('div');
                    clipHint.className = 'clip-hint';
                    clipHint.textContent = '点击进度条选取起点';
                    bar.appendChild(clipHint);
                }
                showFloatToast('✂ 进入截取模式 — 点击进度条选取起止时间');
            });
        });

        // 进度条点击 → 截取逻辑
        const origProgressClick = progressBar?.onclick;
        if (progressBar) {
            // 重写 click：截取模式优先
            progressBar.addEventListener('click', function clipClick(e) {
                if (!clipMode) return; // 非截取模式走原来的逻辑
                e.stopPropagation();
                const rect = progressBar.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const clickSec = Math.round(pct * TOTAL_SECONDS);

                if (clipStart === null) {
                    // 选取起点
                    clipStart = clickSec;
                    stopSimulatedPlay();
                    updateProgressUI(clickSec);
                    clipMarkerStart = addClipMarker(clickSec, '起 ' + formatSec(clickSec));
                    if (clipHint) clipHint.textContent = '点击选取终点';
                    showFloatToast(`✂ 起点 ${formatSec(clickSec)} — 请点击终点`);
                } else {
                    // 选取终点 → 弹出类型菜单
                    const endSec = clickSec;
                    const startSec = Math.min(clipStart, endSec);
                    const finalEndSec = Math.max(clipStart, endSec);
                    stopSimulatedPlay();
                    updateProgressUI(endSec);
                    clipMarkerEnd = addClipMarker(endSec, '止 ' + formatSec(endSec));
                    updateClipRange(endSec);
                    if (clipHint) clipHint.remove(); clipHint = null;

                    const timeRange = `${formatSec(startSec)}-${formatSec(finalEndSec)}`;
                    showFloatToast(`✂ 截取 ${timeRange}`);

                    // 弹出类型选择菜单
                    let menu = document.getElementById('clip-type-menu');
                    if (menu) menu.remove();
                    menu = document.createElement('div');
                    menu.id = 'clip-type-menu';
                    menu.style.cssText = `
                        position: fixed; background: #fff; border: 1px solid #d9d9d9;
                        border-radius: 6px; box-shadow: 0 6px 20px rgba(0,0,0,0.15);
                        z-index: 200; padding: 6px; min-width: 150px;
                    `;
                    menu.style.left = e.clientX + 'px';
                    menu.style.top = (e.clientY - 160) + 'px';
                    menu.innerHTML = `
                        <div style="padding:4px 10px;font-size:11px;color:#999;border-bottom:1px solid #f0f0f0;margin-bottom:4px;">截取 ${timeRange} · 选择风险类型</div>
                        <div data-t="text" style="padding:6px 10px;cursor:pointer;font-size:12px;border-radius:3px;display:flex;align-items:center;gap:6px;">
                            <span style="width:8px;height:8px;background:#1890ff;border-radius:2px;"></span>画面文字
                        </div>
                        <div data-t="voice" style="padding:6px 10px;cursor:pointer;font-size:12px;border-radius:3px;display:flex;align-items:center;gap:6px;">
                            <span style="width:8px;height:8px;background:#1890ff;border-radius:2px;"></span>语音文字
                        </div>
                        <div data-t="scene" style="padding:6px 10px;cursor:pointer;font-size:12px;border-radius:3px;display:flex;align-items:center;gap:6px;">
                            <span style="width:8px;height:8px;background:#1890ff;border-radius:2px;"></span>画面本身
                        </div>
                        <div data-t="abnormal" style="padding:6px 10px;cursor:pointer;font-size:12px;border-radius:3px;display:flex;align-items:center;gap:6px;">
                            <span style="width:8px;height:8px;background:#faad14;border-radius:2px;"></span>视频异常
                        </div>
                        <div style="padding:4px 10px;font-size:11px;color:#ff4d4f;cursor:pointer;border-top:1px solid #f0f0f0;margin-top:4px;">取消截取</div>
                    `;
                    menu.querySelectorAll('div[data-t]').forEach(item => {
                        item.addEventListener('mouseenter', () => item.style.background = '#e6f7ff');
                        item.addEventListener('mouseleave', () => item.style.background = '');
                        item.addEventListener('click', () => {
                            const t = item.getAttribute('data-t');
                            menu.remove();
                            addNewRiskCard(t, '', timeRange);
                            exitClipMode();
                        });
                    });
                    menu.querySelector('div[style*="color:#ff4d4f"]')?.addEventListener('click', () => {
                        menu.remove();
                        exitClipMode();
                    });
                    document.body.appendChild(menu);
                    setTimeout(() => {
                        document.addEventListener('click', function closeClipMenu(ev) {
                            if (!menu.contains(ev.target)) {
                                menu.remove();
                                exitClipMode();
                                document.removeEventListener('click', closeClipMenu);
                            }
                        });
                    }, 0);
                }
            }, true); // capture 优先于普通 click

            // 截取模式下拖拽也更新范围
            const origDrag = { mousedown: null, mousemove: null, mouseup: null };
            progressBar.addEventListener('mousedown', function clipDrag(e) {
                if (!clipMode || clipStart === null) return;
                // 拖拽更新终点预览
                const onMove = ev => {
                    const rect = progressBar.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                    const sec = Math.round(pct * TOTAL_SECONDS);
                    updateClipRange(sec);
                    if (clipMarkerEnd) clipMarkerEnd.remove();
                    clipMarkerEnd = addClipMarker(sec, '止 ' + formatSec(sec));
                };
                const onUp = () => {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        }

        // Esc 退出截取模式
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && clipMode) {
                exitClipMode();
                showFloatToast('✗ 已退出截取模式');
            }
        });

        // ============ 提交前质量自检 ============
