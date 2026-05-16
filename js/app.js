import { playMorse, downloadMorse } from './audio-gen.js';
import { analyzeAudioToMorse } from './audio-analyzer.js';
import { textToMorse, morseToText } from './text-converter.js';

// DOM 요소 참조
const textInput = document.getElementById('textInput');
const morseOutput = document.getElementById('morseOutput');
const audioFileInput = document.getElementById('audioFile');
const analysisInfo = document.getElementById('analysisInfo');

// 오디오 컨텍스트 초기화
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/**
 * 모스 부호 입력 변경 시 텍스트 업데이트
 */
function updateTextFromMorse() {
    const morseText = morseToText(morseOutput.value, Hangul);
    textInput.value = morseText;
}

/**
 * 텍스트 입력 변경 시 모스 부호 업데이트
 */
function updateMorseFromText() {
    const morseText = textToMorse(textInput.value, Hangul);
    morseOutput.value = morseText;
}

/**
 * 오디오 파일 업로드 처리
 */
async function handleAudioUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    analysisInfo.innerHTML = '⏳ 오디오 분석 중...';
    const progressBar = document.querySelector('.progress-bar');
    progressBar.style.display = 'block';

    try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const recognizedMorse = analyzeAudioToMorse(audioBuffer);

        analysisInfo.innerHTML = `✅ 분석 완료!<br>파일: ${file.name}<br>길이: ${audioBuffer.duration.toFixed(2)}초<br>인식된 부호: <code>${recognizedMorse}</code>`;
        morseOutput.value = recognizedMorse;
        updateTextFromMorse();
        progressBar.style.display = 'none';
    } catch (error) {
        analysisInfo.innerHTML = `❌ 오류: ${error.message}`;
        progressBar.style.display = 'none';
    }
}

/**
 * 모스 오디오 재생 버튼 핸들러
 */
function onPlayClick() {
    playMorse(morseOutput.value, audioCtx);
}

/**
 * 오디오 다운로드 버튼 핸들러
 */
function onDownloadClick() {
    downloadMorse(morseOutput.value, audioCtx);
}

// 이벤트 리스너 등록
morseOutput.addEventListener('input', updateTextFromMorse);
textInput.addEventListener('input', updateMorseFromText);
audioFileInput.addEventListener('change', handleAudioUpload);

// 전역 함수로 노출 (HTML onclick 속성에서 사용)
window.playMorse = onPlayClick;
window.downloadMorse = onDownloadClick;
