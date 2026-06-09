function updateMultiSelectBar() {
            const rows = document.querySelectorAll('.asr-row.selected, .ocr-row.selected');
            selectedRows = Array.from(rows);
            if (selectedRows.length >= 2) {
                if (!multiSelectBar) {
                    multiSelectBar = document.createElement('div');
                    multiSelectBar.className = 'multi-select-bar';
                    multiSelectBar.innerHTML = `
                        <span class="ms-count"></span>
                        <button class="ms-btn ms-merge">✓ 合并为风险点</button>
                        <button class="ms-btn ms-clear">✕ 清除选择</button>
                    `;
                    multiSelectBar.querySelector('.ms-merge').onclick = () => mergeSelectedRows();
                    multiSelectBar.querySelector('.ms-clear').onclick = () => clearRowSelection();
                    document.body.appendChild(multiSelectBar);
                }
                multiSelectBar.querySelector('.ms-count').textContent = `已选 ${selectedRows.length} 行`;
                multiSelectBar.style.display = 'flex';
            } else if (multiSelectBar) {
                multiSelectBar.style.display = 'none';
            }
        }

        function clearRowSelection() {
            document.querySelectorAll('.asr-row.selected, .ocr-row.selected').forEach(r => r.classList.remove('selected'));
            selectedRows = [];
            updateMultiSelectBar();
        }

        function mergeSelectedRows() {
            const rows = document.querySelectorAll('.asr-row.selected, .ocr-row.selected');
            if (rows.length < 2) return;
            // 按时间排序
            const sorted = Array.from(rows).sort((a, b) => {
                const tA = (a.querySelector('.ts')?.textContent || '00:00').trim();
                const tB = (b.querySelector('.ts')?.textContent || '00:00').trim();
                return tA.localeCompare(tB);
            });
            // 提取各段时间范围：每段用 "起始-结束" 格式
            // ASR/OCR 每行只有起始时间戳，结束时间需推算：
            // - 有卡片关联 → 取卡片时间段
            // - 非最后一行 → 用同一面板中下一行的起始时间
            // - 最后一行 → 起始 + 5s 估算
            const allRows = Array.from(document.querySelectorAll('.asr-row, .ocr-row'));
            const timeRanges = sorted.map(r => {
                const ts = (r.querySelector('.ts')?.textContent || '00:00').trim();
                const cardId = r.dataset.card;
                if (cardId) {
                    const card = document.querySelector(`[data-id="${cardId}"]`);
                    const cardTime = card?.querySelector('.card-time')?.textContent?.replace(/[▶\s]/g, '') || '';
                    if (cardTime) return cardTime;
                }
                const idx = allRows.indexOf(r);
                const next = allRows[idx + 1];
                if (next) {
                    const nextTs = (next.querySelector('.ts')?.textContent || '').trim();
                    if (nextTs) return `${ts}-${nextTs}`;
                }
                // 无下一行：+5s 估算
                const parts = ts.split(':');
                let secs = parts.length === 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : parseInt(parts[0]) || 0;
                secs += 5;
                const endTs = secs >= 60 ? `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}` : `${secs}`;
                return `${ts}-${endTs}`;
            });
            // 用全角分号拼接多段时间
            const combinedTime = timeRanges.join('；');
            // 合并文本
            const combinedText = sorted.map(r => r.querySelector('.text')?.textContent?.trim() || '').join('；');
            // 来源
            const source = sorted[0].closest('.asr-full') ? 'voice' : 'text';
            addNewRiskCard(source, combinedText, combinedTime);
            clearRowSelection();
            showFloatToast(`✓ 已合并 ${sorted.length} 段时间创建风险点`);
        }

        // 绑定 ASR/OCR 行勾选框 + 行点击
        document.querySelectorAll('.asr-row, .ocr-row').forEach(row => {
            const check = row.querySelector('.row-check');
            if (check) {
                check.addEventListener('click', e => {
                    e.stopPropagation();
                    row.classList.toggle('selected');
                    updateMultiSelectBar();
                });
            }
            row.addEventListener('click', e => {
                if (e.target.classList.contains('ts')) return; // ts 已有 hover-seek
                if (e.target.classList.contains('row-check')) return; // 勾选框单独处理
                e.stopPropagation();
                // 有选中行时，点击任意行（非勾选框）切换选中
                const hasSelected = document.querySelectorAll('.asr-row.selected, .ocr-row.selected').length > 0;
                if (hasSelected) {
                    row.classList.toggle('selected');
                    updateMultiSelectBar();
                    return;
                }
                // 无选中 → 弹出操作菜单（保留原有单行菜单逻辑）
                const tsEl = row.querySelector('.ts');
                const textEl = row.querySelector('.text');
                const timeText = tsEl ? tsEl.textContent.trim() : '';
                const rowText = textEl ? textEl.textContent.trim() : '';
                const cardId = row.dataset.card || row.querySelector('[data-card]')?.dataset?.card || null;
                const source = row.closest('.asr-full') ? 'ASR' : 'OCR';
                const menu = buildRowMenu(row, { cardId, timeText, rowText, source });
                positionMenu(menu, e);
            });
        });

        // 12) Toast 提示
