// ============ 快捷键帮助弹窗 ============
        function showShortcutModal(show) {
            let modal = document.getElementById('shortcut-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'shortcut-modal';
                modal.style.cssText = `
                    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
                    z-index: 10000; display: flex; align-items: center; justify-content: center;
                `;
                modal.innerHTML = `
                    <div style="background:#fff;border-radius:8px;padding:20px 24px;min-width:480px;max-width:560px;box-shadow:0 8px 24px rgba(0,0,0,0.2);" onclick="event.stopPropagation()">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                            <h3 style="font-size:15px;color:#333;flex:1;">⌨ 快捷键说明</h3>
                            <button id="modal-close" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;">✕</button>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:12px;">
                            <div>
                                <div style="color:#999;font-size:11px;margin-bottom:6px;">— 卡片操作（先选中）—</div>
                                <table style="width:100%;border-collapse:collapse;">
                                    <tr><td style="padding:4px 0;color:#666;">接受当前</td><td style="text-align:right;"><span class="kk">Enter</span></td></tr>
                                    <tr><td style="padding:4px 0;color:#666;"><b>一键接受全部</b></td><td style="text-align:right;"><span class="kk">⇧A</span></td></tr>
                                    <tr><td style="padding:4px 0;color:#666;">剔除当前</td><td style="text-align:right;"><span class="kk">X</span></td></tr>
                                    <tr><td style="padding:4px 0;color:#666;">编辑分类</td><td style="text-align:right;"><span class="kk">E</span></td></tr>
                                    <tr><td style="padding:4px 0;color:#666;">下一张卡片</td><td style="text-align:right;"><span class="kk">↓</span> / <span class="kk">J</span></td></tr>
                                    <tr><td style="padding:4px 0;color:#666;">上一张卡片</td><td style="text-align:right;"><span class="kk">↑</span> / <span class="kk">K</span></td></tr>
                                    <tr><td style="padding:4px 0;color:#666;">视频播放/暂停</td><td style="text-align:right;"><span class="kk">Space</span></td></tr>
                                </table>
                                <div style="color:#999;font-size:11px;margin:14px 0 6px;">— 视图切换 —</div>
                                <table style="width:100%;border-collapse:collapse;">
                                    <tr><td style="padding:4px 0;color:#666;">切到 语音文字</td><td style="text-align:right;"><span class="kk">1</span></td></tr>
                                    <tr><td style="padding:4px 0;color:#666;">切到 画面文字</td><td style="text-align:right;"><span class="kk">2</span></td></tr>
                                </table>
                            </div>
                            <div>
                                <div style="color:#999;font-size:11px;margin-bottom:6px;">— 整单操作 —</div>
                                <table style="width:100%;border-collapse:collapse;">
                                    <tr><td style="padding:4px 0;color:#666;">整单通过</td><td style="text-align:right;"><span class="kk green">a</span></td></tr>
                                    <tr><td style="padding:4px 0;color:#666;">整单拒绝</td><td style="text-align:right;"><span class="kk red">w</span></td></tr>
                                    <tr><td style="padding:4px 0;color:#666;">提交标注</td><td style="text-align:right;"><span class="kk">c</span> 或 <span class="kk">⌘S</span></td></tr>
                                    <tr><td style="padding:4px 0;color:#666;">下一题</td><td style="text-align:right;"><span class="kk">N</span></td></tr>
                                </table>
                                <div style="color:#999;font-size:11px;margin:14px 0 6px;">— 批量操作 —</div>
                                <table style="width:100%;border-collapse:collapse;">
                                    <tr><td style="padding:4px 0;color:#666;">选中卡片</td><td style="text-align:right;"><span class="kk">G</span></td></tr>
                                    <tr><td style="padding:4px 0;color:#666;">清除选中</td><td style="text-align:right;"><span class="kk">Z</span></td></tr>
                                    <tr><td style="padding:4px 0;color:#666;">清除所有标注</td><td style="text-align:right;"><span class="kk">⇧Z</span></td></tr>
                                </table>
                                <div style="color:#999;font-size:11px;margin:14px 0 6px;">— 帮助 —</div>
                                <table style="width:100%;border-collapse:collapse;">
                                    <tr><td style="padding:4px 0;color:#666;">本说明</td><td style="text-align:right;"><span class="kk">?</span> / <span class="kk">Esc</span></td></tr>
                                </table>
                            </div>
                        </div>
                        <div style="margin-top:16px;padding-top:12px;border-top:1px solid #f0f0f0;font-size:11px;color:#999;line-height:1.6;">
                            💡 标注最快流程：<span class="kk">↓</span>/<span class="kk">↑</span> 切换卡片 → <span class="kk">Enter</span>/<span class="kk">X</span> 接受或剔除 → <span class="kk">⌘S</span> 提交 → <span class="kk">N</span> 下一题
                        </div>
                    </div>
                `;
                modal.addEventListener('click', e => {
                    if (e.target === modal) modal.style.display = 'none';
                });
                document.body.appendChild(modal);
                document.getElementById('modal-close').addEventListener('click', () => modal.style.display = 'none');
                // kbd 风格
                const style = document.createElement('style');
                style.textContent = `
                    .kk { display:inline-block;padding:2px 8px;background:#f5f5f5;border:1px solid #d9d9d9;
                          border-radius:3px;font-family:'SF Mono',Monaco,monospace;font-size:11px;color:#333;margin-left:4px;}
                    .kk.green { background:#f6ffed;border-color:#b7eb8f;color:#52c41a; }
                    .kk.red { background:#fff1f0;border-color:#ffa39e;color:#ff4d4f; }
                `;
                document.head.appendChild(style);
            }
            modal.style.display = show ? 'flex' : 'none';
        }
        // 替换帮助按钮原 alert
        const helpBtn = document.getElementById('shortcut-help-btn');
        if (helpBtn) {
            const newBtn = helpBtn.cloneNode(true);
            helpBtn.parentNode.replaceChild(newBtn, helpBtn);
            newBtn.addEventListener('click', () => showShortcutModal(true));
        }

        // 默认聚焦第一张卡片
        focusCard(0);

        // 启动提示
        setTimeout(() => showFloatToast('💡 按 ? 查看快捷键 ｜ 勾选 ASR/OCR 行可合并多段'), 500);
