// Biotools uTools Plugin JavaScript

class BiotoolsPlugin {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000';
        this.isApiOnline = false;
        this.currentSequence = '';
        this.currentStats = null;
        
        // 将实例暴露到全局，供 preload.js 使用
        window.biotoolsApp = this;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkApiStatus();
        this.setupUtoolsIntegration();
        
        // 定期检查 API 状态
        setInterval(() => this.checkApiStatus(), 30000);
    }

    bindEvents() {
        // 输入区域事件
        const sequenceInput = document.getElementById('sequenceInput');
        const pasteBtn = document.getElementById('pasteBtn');
        const clearBtn = document.getElementById('clearBtn');

        sequenceInput.addEventListener('input', (e) => {
            this.currentSequence = e.target.value;
            this.updateSequenceInfo();
            this.autoGetStats();
        });

        pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
        clearBtn.addEventListener('click', () => this.clearAll());

        // 工具按钮事件
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                this.handleToolAction(action);
            });
        });

        // 结果区域事件
        const copyResultBtn = document.getElementById('copyResultBtn');
        const closeResultBtn = document.getElementById('closeResultBtn');

        copyResultBtn.addEventListener('click', () => this.copyResult());
        closeResultBtn.addEventListener('click', () => this.hideResult());
    }

    setupUtoolsIntegration() {
        // uTools 插件集成
        if (typeof window.utools !== 'undefined') {
            // 监听 uTools 事件
            window.utools.onPluginEnter(({ code, type, payload }) => {
                console.log('uTools plugin enter:', { code, type, payload });
                
                // 根据不同的命令执行相应操作
                switch (code) {
                    case 'biotools':
                        this.handleUtoolsEntry(payload);
                        break;
                    case 'reverse-complement':
                        this.handleDirectAction('reverse-complement', payload);
                        break;
                    case 'transcribe':
                        this.handleDirectAction('transcribe', payload);
                        break;
                    case 'reverse-transcribe':
                        this.handleDirectAction('reverse-transcribe', payload);
                        break;
                    case 'translate':
                        this.handleDirectAction('translate', payload);
                        break;
                    case 'sequence-stats':
                        this.handleDirectAction('stats', payload);
                        break;
                }
            });
        }
    }

    handleUtoolsEntry(payload) {
        if (payload && typeof payload === 'string') {
            document.getElementById('sequenceInput').value = payload;
            this.currentSequence = payload;
            this.updateSequenceInfo();
            this.autoGetStats();
        }
    }

    handleDirectAction(action, payload) {
        if (payload && typeof payload === 'string') {
            document.getElementById('sequenceInput').value = payload;
            this.currentSequence = payload;
            this.updateSequenceInfo();
            
            // 延迟执行操作，确保界面更新完成
            setTimeout(() => {
                this.handleToolAction(action);
            }, 100);
        }
    }

    async checkApiStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            if (response.ok) {
                this.isApiOnline = true;
                this.updateStatusIndicator('online', 'API 在线');
                this.enableToolButtons();
            } else {
                throw new Error('API 响应异常');
            }
        } catch (error) {
            this.isApiOnline = false;
            this.updateStatusIndicator('offline', 'API 离线');
            this.disableToolButtons();
        }
    }

    updateStatusIndicator(status, text) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        statusDot.className = `status-dot ${status}`;
        statusText.textContent = text;
    }

    enableToolButtons() {
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.disabled = false;
        });
    }

    disableToolButtons() {
        // 不再禁用所有按钮，因为大部分功能都是本地处理
        // 只有需要 API 的高级功能才会在使用时检查 API 状态
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.disabled = false;
        });
    }

    updateSequenceInfo() {
        const sequenceInfo = document.getElementById('sequenceInfo');
        if (this.currentSequence.trim()) {
            const cleanSeq = this.currentSequence.replace(/[^A-Za-z]/g, '');
            const seqType = window.detectSequenceType ? window.detectSequenceType(cleanSeq) : this.detectSequenceType(cleanSeq);
            sequenceInfo.textContent = `检测到 ${seqType.toUpperCase()} 序列，长度: ${cleanSeq.length}`;
        } else {
            sequenceInfo.textContent = '支持自动检测序列类型';
        }
    }

    detectSequenceType(sequence) {
        const cleanSeq = sequence.toUpperCase();
        
        if (!cleanSeq) return 'unknown';
        
        // 检查蛋白质特有氨基酸
        const proteinChars = new Set('EFHIKLMNPQRSVWY');
        if ([...cleanSeq].some(char => proteinChars.has(char))) {
            return 'protein';
        }
        
        // 检查 RNA
        if (cleanSeq.includes('U') && !cleanSeq.includes('T')) {
            return 'rna';
        }
        
        // 检查 DNA
        if (cleanSeq.includes('T') && !cleanSeq.includes('U')) {
            return 'dna';
        }
        
        // 默认 DNA
        if ([...cleanSeq].every(char => 'ACGT'.includes(char))) {
            return 'dna';
        }
        
        return 'unknown';
    }

    async pasteFromClipboard() {
        try {
            let text = '';
            
            // 尝试使用 uTools 剪贴板 API
            if (typeof window.utools !== 'undefined' && window.utools.getCopyedFiles) {
                text = window.utools.getCopyedFiles()[0] || '';
            }
            
            // 回退到浏览器 API
            if (!text && navigator.clipboard) {
                text = await navigator.clipboard.readText();
            }
            
            if (text) {
                document.getElementById('sequenceInput').value = text;
                this.currentSequence = text;
                this.updateSequenceInfo();
                this.autoGetStats();
            }
        } catch (error) {
            console.error('粘贴失败:', error);
            this.showError('粘贴失败，请手动输入序列');
        }
    }

    clearAll() {
        document.getElementById('sequenceInput').value = '';
        this.currentSequence = '';
        this.currentStats = null;
        this.updateSequenceInfo();
        this.hideResult();
        this.hideStats();
    }

    async autoGetStats() {
        if (!this.currentSequence.trim()) return;
        
        // 防抖处理
        clearTimeout(this.statsTimeout);
        this.statsTimeout = setTimeout(() => {
            try {
                // 使用本地统计分析
                const stats = window.calculateStats(this.currentSequence);
                this.currentStats = stats;
                this.displayStats(stats);
            } catch (error) {
                console.error('获取统计信息失败:', error);
            }
        }, 500);
    }

    async handleToolAction(action) {
        if (!this.currentSequence.trim()) {
            this.showError('请输入序列');
            return;
        }

        // 基础序列处理使用本地实现
        const localProcessingActions = [
            'reverse-complement', 'transcribe', 'reverse-transcribe', 
            'translate', 'uppercase', 'lowercase', 'remove-newlines'
        ];

        if (localProcessingActions.includes(action)) {
            try {
                const processor = window.LocalSequenceProcessor[action];
                if (!processor) {
                    throw new Error(`不支持的操作: ${action}`);
                }
                
                const result = processor(this.currentSequence);
                this.displayResult(result);
                return;
            } catch (error) {
                console.error('本地处理失败:', error);
                this.showError(error.message || '处理失败');
                return;
            }
        }

        // 统计分析使用本地实现
        if (action === 'stats') {
            try {
                const stats = window.calculateStats(this.currentSequence);
                this.displayStats(stats);
                return;
            } catch (error) {
                console.error('统计分析失败:', error);
                this.showError(error.message || '统计分析失败');
                return;
            }
        }

        // 其他高级功能需要后端 API
        if (!this.isApiOnline) {
            this.showError('此功能需要 API 服务，但当前 API 离线');
            return;
        }

        this.showLoading();

        try {
            let result;
            
            switch (action) {
                // 这里可以添加需要后端处理的高级功能
                // 如引物设计、gRNA设计等
                default:
                    throw new Error(`不支持的操作: ${action}`);
            }

            this.displayResult(result);
        } catch (error) {
            console.error('处理失败:', error);
            this.showError(error.message || '处理失败');
        } finally {
            this.hideLoading();
        }
    }

    async callApi(endpoint) {
        const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sequence: this.currentSequence,
                sequence_type: 'auto'
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        return await response.json();
    }

    async getSequenceStats(sequence) {
        const response = await fetch(`${this.apiBaseUrl}/sequence/stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sequence: sequence,
                sequence_type: 'auto'
            })
        });

        if (!response.ok) {
            throw new Error('获取统计信息失败');
        }

        return await response.json();
    }

    displayResult(result) {
        const resultSection = document.getElementById('resultSection');
        const resultContent = document.getElementById('resultContent');
        
        resultContent.textContent = result.result;
        resultSection.style.display = 'block';
        
        // 滚动到结果区域
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    displayStats(stats) {
        const statsSection = document.getElementById('statsSection');
        const statsContent = document.getElementById('statsContent');
        
        // 创建统计信息 HTML
        const statsHtml = this.createStatsHtml(stats);
        statsContent.innerHTML = statsHtml;
        statsSection.style.display = 'block';
    }

    createStatsHtml(stats) {
        const { length, composition, gc_content, molecular_weight, sequence_type } = stats;
        
        // 基础统计
        let html = `
            <div class="stats-grid">
                <div class="stats-item">
                    <div class="stats-label">序列类型</div>
                    <div class="stats-value">${sequence_type.toUpperCase()}</div>
                </div>
                <div class="stats-item">
                    <div class="stats-label">长度</div>
                    <div class="stats-value">${length}</div>
                </div>
        `;
        
        if (gc_content !== undefined) {
            html += `
                <div class="stats-item">
                    <div class="stats-label">GC 含量</div>
                    <div class="stats-value">${gc_content}%</div>
                </div>
            `;
        }
        
        if (molecular_weight !== undefined) {
            html += `
                <div class="stats-item">
                    <div class="stats-label">分子量</div>
                    <div class="stats-value">${molecular_weight.toLocaleString()} Da</div>
                </div>
            `;
        }
        
        html += '</div>';
        
        // 组成分析
        if (composition && Object.keys(composition).length > 0) {
            const total = Object.values(composition).reduce((sum, count) => sum + count, 0);
            
            html += `
                <h3 style="margin: 16px 0 12px 0; color: #374151;">组成分析</h3>
                <div class="composition-grid">
            `;
            
            Object.entries(composition)
                .sort(([,a], [,b]) => b - a)
                .forEach(([base, count]) => {
                    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                    html += `
                        <div class="composition-item">
                            <div class="composition-base">${base}</div>
                            <div class="composition-count">${count}</div>
                            <div class="composition-percent">${percent}%</div>
                        </div>
                    `;
                });
            
            html += '</div>';
        }
        
        return html;
    }

    async copyResult() {
        const resultContent = document.getElementById('resultContent');
        const text = resultContent.textContent;
        
        this.copyToClipboard(text);
    }

    copyToClipboard(text) {
        try {
            // 优先使用 preload.js 提供的增强剪贴板功能
            if (window.enhancedClipboard && window.enhancedClipboard.writeText) {
                const success = window.enhancedClipboard.writeText(text);
                if (success) {
                    this.showSuccess('已复制到剪贴板');
                    // 显示系统通知
                    if (window.showNotification) {
                        window.showNotification('Biotools', '结果已复制到剪贴板');
                    }
                    return;
                }
            }
            
            // 回退到标准剪贴板 API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showSuccess('已复制到剪贴板');
                }).catch(() => {
                    this.fallbackCopyToClipboard(text);
                });
            } else {
                this.fallbackCopyToClipboard(text);
            }
        } catch (error) {
            console.error('复制失败:', error);
            this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showSuccess('已复制到剪贴板');
            } else {
                this.showError('复制失败，请手动复制');
            }
        } catch (err) {
            this.showError('复制失败，请手动复制');
        }
        
        document.body.removeChild(textArea);
    }

    hideResult() {
        document.getElementById('resultSection').style.display = 'none';
    }

    hideStats() {
        document.getElementById('statsSection').style.display = 'none';
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showError(message) {
        const errorToast = document.getElementById('errorToast');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorToast.style.display = 'block';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            errorToast.style.display = 'none';
        }, 3000);
    }

    showSuccess(message) {
        // 可以添加成功提示，这里简化处理
        console.log('Success:', message);
    }
}

// 初始化插件
document.addEventListener('DOMContentLoaded', () => {
    new BiotoolsPlugin();
});
