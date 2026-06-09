function showFloatToast(msg) {
            let toast = document.getElementById('float-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'float-toast';
                toast.style.cssText = `
                    position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
                    background: rgba(0,0,0,0.8); color: #fff; padding: 8px 16px;
                    border-radius: 4px; font-size: 12px; z-index: 9999;
                    transition: opacity .2s; pointer-events: none;
                `;
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.style.opacity = '1';
            clearTimeout(toast._t);
            toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 1400);
        }

        // 9) 筛选 Tab（统一走 applyCurrentFilter）
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                applyCurrentFilter();
            });
        });

        showProgress();

        // ============ 底栏隐藏/显示 ============
        const bottomStatus = document.getElementById('bottom-status');
        const bottomToggle = document.getElementById('bottom-status-toggle');
        const bottomCollapse = document.getElementById('bottom-status-collapse');
        function setBottomHidden(hidden) {
            if (hidden) {
                bottomStatus.classList.add('hidden');
                document.body.classList.add('bottom-hidden');
            } else {
                bottomStatus.classList.remove('hidden');
                document.body.classList.remove('bottom-hidden');
            }
        }
        bottomCollapse?.addEventListener('click', e => { e.stopPropagation(); setBottomHidden(true); });
        bottomToggle?.addEventListener('click', e => { e.stopPropagation(); setBottomHidden(false); });
        // 快捷键 B 切换
        document.addEventListener('keydown', e => {
            const tag = (e.target.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
            if (e.key && e.key.toLowerCase() === 'b' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                setBottomHidden(!bottomStatus.classList.contains('hidden'));
            }
        });
