import { DOUBLE_CONSONANTS, MORSE_MAP, REVERSE_MAP } from './morse-map.js';

// 쌍자음 조합 맵
const COMBINE_MAP = {
    'ㄱㄱ': 'ㄲ',
    'ㄷㄷ': 'ㄸ',
    'ㅂㅂ': 'ㅃ',
    'ㅅㅅ': 'ㅆ',
    'ㅈㅈ': 'ㅉ'
};

/**
 * 분해된 자음을 쌍자음으로 결합
 * @param {string} chars - 분해된 자음 문자열
 * @returns {string} 쌍자음이 결합된 문자열
 */
function packDoubleConsonants(chars) {
    let result = chars;
    for (const key in COMBINE_MAP) {
        result = result.split(key).join(COMBINE_MAP[key]);
    }
    return result;
}

/**
 * 텍스트를 모스 부호로 변환
 * @param {string} text - 한글/영문 텍스트
 * @param {typeof Hangul} Hangul - Hangul.js 라이브러리
 * @returns {string} 모스 부호
 */
export function textToMorse(text, Hangul) {
    let result = [];

    for (const char of text) {
        if (char === ' ') {
            result.push('/');
            continue;
        }

        // 한글 분해
        const disassembled = Hangul.disassemble(char);
        let fixedList = [];

        // 쌍자음 분해 처리
        for (const c of disassembled) {
            if (DOUBLE_CONSONANTS[c]) {
                fixedList.push(...DOUBLE_CONSONANTS[c].split(''));
            } else {
                fixedList.push(c);
            }
        }

        // 모스 부호 변환
        result.push(fixedList.map(c => MORSE_MAP[c] || c).join(' '));
    }

    return result.join('  ');
}

/**
 * 모스 부호를 텍스트로 변환
 * @param {string} morse - 모스 부호 문자열
 * @param {typeof Hangul} Hangul - Hangul.js 라이브러리
 * @returns {string} 변환된 텍스트
 */
export function morseToText(morse, Hangul) {
    if (!morse || !morse.trim()) return '';

    // `/` 주변의 공백을 정규화하고 단어 분리
    let inputVal = morse.trim().replace(/\s*\/\s*/g, '  '); // `/`를 공백 2개로 변환

    // 공백 3개 이상을 단어 구분자로 사용
    const words = inputVal.split(/\s{3,}/).filter(w => w.trim());

    const decodedMessage = words.map(word => {
        // 공백 2개로 문자 분리
        const letters = word.split(/\s{2}/).filter(l => l.trim());
        return letters.map(letter => {
            // 공백 1개로 자소 분리
            const codes = letter.split(/\s+/).filter(c => c.trim());
            if (codes.length === 0) return '';

            let combinedChars = codes.map(code => REVERSE_MAP[code] || '').join('');
            combinedChars = packDoubleConsonants(combinedChars);

            // 빈 문자열이 아닐 때만 assemble 호출
            return combinedChars ? Hangul.assemble(combinedChars) : '';
        }).join('');
    }).filter(text => text).join(' ');

    return decodedMessage;
}
