// 本地序列处理工具库

// 密码子表
const CODON_TABLE = {
    'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
    'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
    'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
    'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
    'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
    'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
    'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
    'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
    'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
    'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
    'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
    'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
    'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
    'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
    'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
    'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
};

// 序列验证函数
function validateDNASequence(sequence) {
    return /^[ATCG\s]*$/i.test(sequence.replace(/\s/g, ''));
}

function validateRNASequence(sequence) {
    return /^[AUCG\s]*$/i.test(sequence.replace(/\s/g, ''));
}

// 序列类型检测
function detectSequenceType(sequence) {
    const cleanSeq = sequence.replace(/\s/g, '').toUpperCase();
    
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

// 反向互补
function reverseComplement(sequence) {
    const complement = {
        'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C',
        'a': 't', 't': 'a', 'c': 'g', 'g': 'c'
    };
    
    return sequence
        .split('')
        .reverse()
        .map(base => complement[base] || base)
        .join('');
}

// 转录 (DNA → RNA)
function transcribe(sequence) {
    return sequence.replace(/T/g, 'U').replace(/t/g, 'u');
}

// 反转录 (RNA → DNA)
function reverseTranscribe(sequence) {
    return sequence.replace(/U/g, 'T').replace(/u/g, 't');
}

// 翻译 (DNA/RNA → 蛋白质)
function translate(sequence) {
    const cleanSeq = sequence.replace(/\s/g, '').toUpperCase();
    let protein = '';
    
    for (let i = 0; i < cleanSeq.length - 2; i += 3) {
        const codon = cleanSeq.substring(i, i + 3);
        const aminoAcid = CODON_TABLE[codon] || 'X';
        protein += aminoAcid;
        
        // 遇到终止密码子就停止
        if (aminoAcid === '*') {
            break;
        }
    }
    
    return protein;
}

// 大小写转换
function toUpperCase(sequence) {
    return sequence.toUpperCase();
}

function toLowerCase(sequence) {
    return sequence.toLowerCase();
}

// 移除换行符
function removeNewlines(sequence) {
    return sequence.replace(/[\r\n]/g, '');
}

// 序列统计
function calculateStats(sequence) {
    const cleanSeq = sequence.replace(/\s/g, '').toUpperCase();
    const composition = {};
    
    // 统计碱基/氨基酸组成
    for (const char of cleanSeq) {
        composition[char] = (composition[char] || 0) + 1;
    }
    
    const sequenceType = detectSequenceType(sequence);
    const stats = {
        length: cleanSeq.length,
        composition,
        sequence_type: sequenceType
    };
    
    // 计算 GC 含量（仅对 DNA/RNA）
    if (sequenceType === 'dna' || sequenceType === 'rna') {
        const gcCount = (composition['G'] || 0) + (composition['C'] || 0);
        const totalBases = (composition['A'] || 0) + (composition['T'] || 0) + 
                          (composition['U'] || 0) + (composition['G'] || 0) + 
                          (composition['C'] || 0);
        if (totalBases > 0) {
            stats.gc_content = Math.round((gcCount / totalBases) * 100 * 10) / 10;
        }
    }
    
    // 简单的分子量估算
    if (sequenceType === 'dna') {
        stats.molecular_weight = Math.round(cleanSeq.length * 650);
    } else if (sequenceType === 'rna') {
        stats.molecular_weight = Math.round(cleanSeq.length * 340);
    } else if (sequenceType === 'protein') {
        stats.molecular_weight = Math.round(cleanSeq.length * 110);
    }
    
    return stats;
}

// 本地序列处理函数
const LocalSequenceProcessor = {
    // 反向互补
    'reverse-complement': (sequence) => {
        if (!validateDNASequence(sequence)) {
            throw new Error('输入序列不是有效的 DNA 序列');
        }
        return {
            result: reverseComplement(sequence),
            original_sequence: sequence,
            sequence_type: 'dna'
        };
    },
    
    // 转录
    'transcribe': (sequence) => {
        if (!validateDNASequence(sequence)) {
            throw new Error('输入序列不是有效的 DNA 序列');
        }
        return {
            result: transcribe(sequence),
            original_sequence: sequence,
            sequence_type: 'dna'
        };
    },
    
    // 反转录
    'reverse-transcribe': (sequence) => {
        if (!validateRNASequence(sequence)) {
            throw new Error('输入序列不是有效的 RNA 序列');
        }
        return {
            result: reverseTranscribe(sequence),
            original_sequence: sequence,
            sequence_type: 'rna'
        };
    },
    
    // 翻译
    'translate': (sequence) => {
        const seqType = detectSequenceType(sequence);
        if (seqType !== 'dna' && seqType !== 'rna') {
            throw new Error('输入序列不是有效的 DNA 或 RNA 序列');
        }
        
        let translateSeq = sequence;
        if (seqType === 'dna') {
            translateSeq = transcribe(translateSeq);
        }
        
        return {
            result: translate(translateSeq),
            original_sequence: sequence,
            sequence_type: seqType
        };
    },
    
    // 大写
    'uppercase': (sequence) => {
        return {
            result: toUpperCase(sequence),
            original_sequence: sequence,
            sequence_type: detectSequenceType(sequence)
        };
    },
    
    // 小写
    'lowercase': (sequence) => {
        return {
            result: toLowerCase(sequence),
            original_sequence: sequence,
            sequence_type: detectSequenceType(sequence)
        };
    },
    
    // 移除换行符
    'remove-newlines': (sequence) => {
        return {
            result: removeNewlines(sequence),
            original_sequence: sequence,
            sequence_type: detectSequenceType(sequence)
        };
    },
    
    // 统计分析
    'stats': (sequence) => {
        return calculateStats(sequence);
    }
};

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    // Node.js 环境
    module.exports = {
        LocalSequenceProcessor,
        detectSequenceType,
        validateDNASequence,
        validateRNASequence,
        calculateStats
    };
} else {
    // 浏览器环境
    window.LocalSequenceProcessor = LocalSequenceProcessor;
    window.detectSequenceType = detectSequenceType;
    window.validateDNASequence = validateDNASequence;
    window.validateRNASequence = validateRNASequence;
    window.calculateStats = calculateStats;
}
