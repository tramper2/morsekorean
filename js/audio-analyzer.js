// 오디오 분석 설정
export const ANALYSIS_CONFIG = {
    WINDOW_SIZE_MS: 10,    // 윈도우 크기 (밀리초)
    THRESHOLD: 0.03,       // 신호 감지 임계값
    DOT_MAX_SEC: 0.2,      // 점으로 인식할 최대 길이 (초)
    LETTER_GAP_SEC: 0.15,  // 문자 간격 (초)
    WORD_GAP_SEC: 0.5      // 단어 간격 (초) - `/`와 `  `으로 생성되는 긴 무음 구분
};

/**
 * 오디오 버퍼를 분석하여 모스 부호로 변환
 * @param {AudioBuffer} audioBuffer
 * @returns {string} 인식된 모스 부호
 */
export function analyzeAudioToMorse(audioBuffer) {
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const { WINDOW_SIZE_MS, THRESHOLD, DOT_MAX_SEC, LETTER_GAP_SEC, WORD_GAP_SEC } = ANALYSIS_CONFIG;

    // 윈도우 크기 (샘플 수)
    const windowSize = Math.floor(sampleRate * WINDOW_SIZE_MS / 1000);

    // 각 윈도우의 RMS 계산하여 신호/무음 상태 결정
    let states = [];
    for (let i = 0; i < data.length; i += windowSize) {
        let sum = 0;
        for (let j = 0; j < windowSize && i + j < data.length; j++) {
            sum += Math.abs(data[i + j]);
        }
        let rms = sum / windowSize;
        states.push(rms > THRESHOLD ? 1 : 0);
    }

    // 상태 변화를 모스 부호로 변환
    let morse = '';
    let i = 0, n = states.length;
    const windowDuration = WINDOW_SIZE_MS / 1000; // 초 단위

    while (i < n) {
        const val = states[i];
        const start = i;
        while (i < n && states[i] === val) i++;
        const length = i - start;
        const duration = length * windowDuration;

        if (val === 1) {
            // 신호: 점 또는 대시
            morse += (duration < DOT_MAX_SEC) ? '.' : '-';
        } else {
            // 무음: 간격
            if (duration >= WORD_GAP_SEC) {
                morse += '  ';      // 단어 간격 (공백 2개)
            } else if (duration >= LETTER_GAP_SEC) {
                morse += ' ';       // 문자 간격 (공백 1개)
            }
        }
    }

    return morse.trim();
}
