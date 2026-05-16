// 오디오 생성 관련 상수
export const DOT_DURATION = 0.1;  // 점 길이 (초)
export const TONE_FREQUENCY = 700; // 주파수 (Hz)
export const AMPLITUDE = 0.3;      // 진폭

/**
 * 모스 부호 문자열로 AudioBuffer 생성
 * @param {string} morse - 모스 부호 문자열
 * @param {AudioContext} audioCtx - 오디오 컨텍스트
 * @returns {AudioBuffer}
 */
export function generateMorseAudio(morse, audioCtx) {
    const sampleRate = audioCtx.sampleRate;
    const dot = DOT_DURATION;
    let totalLength = 0;

    // 전체 길이 계산
    for (const symbol of morse) {
        if (symbol === '.' || symbol === '-') {
            const duration = (symbol === '.') ? dot : dot * 3;
            totalLength += duration + dot; // 신호 + 점 간격
        } else if (symbol === ' ') {
            totalLength += dot * 2;
        }
    }

    const audioBuffer = audioCtx.createBuffer(1, totalLength * sampleRate, sampleRate);
    const data = audioBuffer.getChannelData(0);
    let sampleIndex = 0;

    for (const symbol of morse) {
        if (symbol === '.' || symbol === '-') {
            const duration = (symbol === '.') ? dot : dot * 3;
            const durationSamples = duration * sampleRate;
            const silenceSamples = dot * sampleRate;

            // 사인파 생성
            for (let i = 0; i < durationSamples; i++) {
                data[sampleIndex++] = Math.sin(2 * Math.PI * TONE_FREQUENCY * i / sampleRate) * AMPLITUDE;
            }
            // 점 간격 무음
            for (let i = 0; i < silenceSamples; i++) {
                data[sampleIndex++] = 0;
            }
        } else if (symbol === ' ') {
            const silenceSamples = dot * 2 * sampleRate;
            for (let i = 0; i < silenceSamples; i++) {
                data[sampleIndex++] = 0;
            }
        }
    }

    return audioBuffer;
}

/**
 * AudioBuffer를 WAV 파일로 변환
 * @param {AudioBuffer} audioBuffer
 * @returns {ArrayBuffer} WAV 파일 데이터
 */
export function audioBufferToWav(audioBuffer) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const data = audioBuffer.getChannelData(0);
    const length = data.length;

    const wav = new ArrayBuffer(44 + length * 2);
    const view = new DataView(wav);

    function writeString(offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    // RIFF 헤더
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');

    // fmt 청크
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * bitDepth / 8, true);
    view.setUint16(32, numberOfChannels * bitDepth / 8, true);
    view.setUint16(34, bitDepth, true);

    // data 청크
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    let offset = 44;
    for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, data[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
    }

    return wav;
}

/**
 * 모스 오디오 재생
 * @param {string} morse - 모스 부호 문자열
 * @param {AudioContext} audioCtx
 */
export function playMorse(morse, audioCtx) {
    const audioBuffer = generateMorseAudio(morse, audioCtx);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start(0);
}

/**
 * 모스 오디오를 WAV 파일로 다운로드
 * @param {string} morse - 모스 부호 문자열
 * @param {AudioContext} audioCtx
 */
export function downloadMorse(morse, audioCtx) {
    if (!morse.trim()) {
        alert('모르스 부호를 입력하세요.');
        return;
    }

    const audioBuffer = generateMorseAudio(morse, audioCtx);
    const wav = audioBufferToWav(audioBuffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'morse_' + Date.now() + '.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
