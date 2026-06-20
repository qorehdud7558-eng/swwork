ame');

const retryWeakBtn = document.getElementById('retry-weak-btn');
const
    prevQuestionBtn.addEventListener('click', loadPreviousQuestion);
    nextQuestionBtn.addEventListener('click', loadNextQuestion);
    studentAnswerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loadNextQuestion();
    });

    restartQuizBtn.addEventListener('click', () => resetQuiz("normal"));
    document.getElementById('restart-quiz-btn').addEventListener('click', () => resetQuiz("normal"));
    retryWrongBtn.addEventListener('click', () => resetQuiz("wrong_review"));
    retryWeakBtn.addEventListener('click', () => resetQuiz("weak_review"));

    viewHistoryBtn.addEventListener('click', openHistoryPanel);
    closeHistoryBtn.addEventListener('click', closeHistoryPanel);
    clearHistoryBtn.addEventListener('click', clearHistory);

    // 가상으로 학습 분석 결과 보고서를 먼저 로드하고 싶을 경우 대비해 초기 이름 세팅
    usernameInput.value = state.username;
});

// SVG 그라디언트 주입 함수
function injectSvgGradients() {
    const svgs = [document.querySelector('.score-ring-svg'), historyChartSvg];
    const defsHtml = `
        <defs>
            <linearGradient id="score-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8b5cf6" />
                <stop offset="100%" stop-color="#6366f1" />
            </linearGradient>
            <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#6366f1" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
            </linearGradient>
        </defs>
    `;
    svgs.forEach(svg => {
        if (svg) {
            svg.insertAdjacentHTML('afterbegin', defsHtml);
        }
    });
}

// 화면 전환 기능
function showView(targetPanel) {
    const panels = [welcomeScreen, quizScreen, dashboardScreen, historyScreen];
    panels.forEach(panel => {
        panel.classList.remove('active');
    });
    
    targetPanel.classList.add('active');
}

// 퀴즈 시작
function startQuiz() {
    state.username = usernameInput.value.trim() || "학습자";
    resetQuiz("normal");
}

// 가상 데이터 결과 즉시 로드
function loadSampleReport() {
    state.username = usernameInput.value.trim() || "홍길동";
    state.studentAnswers = { ...virtualAnswers };
    state.studentAnswersMaster = { ...virtualAnswers };
    generateAnalysisReport();
}

// 퀴즈 상태 초기화
function resetQuiz(mode = "normal") {
    state.quizMode = mode;

    if (mode === "normal") {
        state.studentAnswers = {};
        state.studentAnswersMaster = {};
        state.questions = { ...originalQuestions };
        state.activeQuestionIds = Object.keys(originalQuestions).map(Number);
    } else if (mode === "wrong_review") {
        // 이전 제출 답안 중 틀린 것들만 필터링
        const wrongIds = Object.keys(originalQuestions).map(Number).filter(qId => {
            const correctAns = originalQuestions[qId].answer.toLowerCase();
            const studentAns = (state.studentAnswersMaster[qId] || "").trim().toLowerCase();
            return studentAns !== correctAns;
        });

        state.studentAnswers = {};
        // 만약 틀린 문제가 없다면 전체 리스트 사용
        state.activeQuestionIds = wrongIds.length > 0 ? wrongIds : Object.keys(originalQuestions).map(Number);
    } else if (mode === "weak_review" && state.weakestCategory) {
        // 취약 과목의 문제들만 필터링
        const weakIds = Object.keys(originalQuestions).map(Number).filter(qId => {
            return originalQuestions[qId].category === state.weakestCategory;
        });
        state.studentAnswers = {};
        state.activeQuestionIds = weakIds.length > 0 ? weakIds : Object.keys(originalQuestions).map(Number);
    }

    state.currentActiveIndex = 0;
    showView(quizScreen);
    renderCurrentQuestion();
}

// 현재 질문 렌더링
function renderCurrentQuestion() {
    const qId = state.activeQuestionIds[state.currentActiveIndex];
    const qInfo = originalQuestions[qId];

    // 번호 및 카테고리 정보 변경
    currentQNumSpan.textContent = state.currentActiveIndex + 1;
    totalQNumSpan.textContent = state.activeQuestionIds.length;
    categoryBadge.textContent = qInfo.category;
    
    // 카테고리별 테마 클래스 분기
    categoryBadge.className = 'category-badge';
    if (qInfo.category === '수학') categoryBadge.classList.add('math');
    else if (qInfo.category === '과학') categoryBadge.classList.add('science');
    else if (qInfo.category === '영어') categoryBadge.classList.add('english');

    // 질문 텍스트
    questionText.textContent = qInfo.question;

    // 진행 바 조절
    const progressPercent = ((state.currentActiveIndex + 1) / state.activeQuestionIds.length) * 100;
    progressBarInner.style.width = `${progressPercent}%`;

    // 이전 입력값 불러오기
    studentAnswerInput.value = state.studentAnswers[qId] || "";
    studentAnswerInput.focus();

    // 이전/다음 버튼 활성 제어
    if (state.currentActiveIndex === 0) {
        prevQuestionBtn.classList.add('disabled');
        prevQuestionBtn.disabled = true;
    } else {
        prevQuestionBtn.classList.remove('disabled');
        prevQuestionBtn.disabled = false;
    }

    // 마지막 문제일 경우 버튼 텍스트 변경
    if (state.currentActiveIndex === state.activeQuestionIds.length - 1) {
        nextQuestionBtn.querySelector('span').textContent = "분석 제출";
    } else {
        nextQuestionBtn.querySelector('span').textContent = "제출 및 다음";
    }
}

// 이전 문제로 이동
function loadPreviousQuestion() {
    if (state.currentActiveIndex > 0) {
        // 현재 작성한 답안 저장
        const qId = state.activeQuestionIds[state.currentActiveIndex];
        state.studentAnswers[qId] = studentAnswerInput.value;

        state.currentActiveIndex--;
        renderCurrentQuestion();
    }
}

// 다음 문제로 이동 (또는 결과 제출)
function loadNextQuestion() {
    const qId = state.activeQuestionIds[state.currentActiveIndex];
    state.studentAnswers[qId] = studentAnswerInput.value;

    if (state.currentActiveIndex < state.activeQuestionIds.length - 1) {
        state.currentActiveIndex++;
        renderCurrentQuestion();
    } else {
        // 마지막 문제 완료 -> 보고서 생성 및 이동
        generateAnalysisReport();
    }
}

// 학습 성과 채점 및 보고서 생성 (파이썬 알고리즘 포팅)
function generateAnalysisReport() {
    // 새로 입력한 답변을 마스터 레코드에 병합하여 전체 성취도를 유지
    state.studentAnswersMaster = { ...state.studentAnswersMaster, ...state.studentAnswers };
    const fullAnswers = { ...state.studentAnswersMaster };
    
    // 원본 데이터 전체 기준 채점 진행
    let correctCount = 0;
    const totalQuestions = Object.keys(originalQuestions).length;
    const categoryStats = {};

    // 채점 및 분류 루프
    for (const [qIdStr, qInfo] of Object.entries(originalQuestions)) {
        const qId = Number(qIdStr);
        const category = qInfo.category;
        const correctAns = qInfo.answer;
        
        // 제출 답안 정제 (대소문자/공백 제거)
        const studentAns = (fullAnswers[qId] || "").trim().toLowerCase();

        if (!categoryStats[category]) {
            categoryStats[category] = { total: 0, correct: 0 };
        }
        categoryStats[category].total += 1;

        if (studentAns === correctAns.toLowerCase()) {
            correctCount += 1;
            categoryStats[category].correct += 1;
        }
    }

    // 결과 수치 계산
    const overallErrorRate = ((totalQuestions - correctCount) / totalQuestions) * 100;

    // 1. 종합 요약 UI 갱신
    reportUserName.textContent = state.username;
    scoreFraction.textContent = `${correctCount} / ${totalQuestions}`;
    scorePercentage.textContent = `${((correctCount / totalQuestions) * 100).toFixed(1)}%`;
    
    // 게이지 차트 애니메이션 적용 (314는 SVG 원 둘레)
    const strokeOffset = 314 * (1 - (correctCount / totalQuestions));
    scoreRingProgress.style.strokeDashoffset = strokeOffset;
    
    statErrorRate.textContent = `${overallErrorRate.toFixed(1)}%`;
    statCorrectCount.textContent = `${correctCount}문항`;
    statWrongCount.textContent = `${totalQuestions - correctCount}문항`;

    // 2. 카테고리별 오답률 분석 렌더링 & 취약 유형 탐색
    categoryBarsContainer.innerHTML = '';
    let weakestCategory = "";
    let maxErrorRate = -1;

    for (const [category, stats] of Object.entries(categoryStats)) {
        const wrongCount = stats.total - stats.correct;
        const errorRate = (wrongCount / stats.total) * 100;

        // 가로 바 HTML 생성
        const barRow = document.createElement('div');
        barRow.className = 'category-bar-row';
        
        let themeClass = 'math';
        if (category === '과학') themeClass = 'science';
        if (category === '영어') themeClass = 'english';

        barRow.innerHTML = `
            <span class="category-bar-label">${category}</span>
            <div class="category-bar-outer">
                <div class="category-bar-inner ${themeClass}" style="width: ${errorRate}%"></div>
            </div>
            <span class="category-bar-value ${errorRate > 0 ? 'wrong' : ''}">${errorRate.toFixed(1)}% 오답</span>
        `;
        categoryBarsContainer.appendChild(barRow);

        // 취약 과목 도출 로직 (파이썬 로직 완벽 매칭)
        if (errorRate > maxErrorRate) {
            maxErrorRate = errorRate;
            weakestCategory = category;
        } else if (errorRate === maxErrorRate) {
            weakestCategory += `, ${category}`;
        }
    }

    // 3. 취약 유형 피드백 노출 (모두 맞춘 경우는 제외)
    state.weakestCategory = maxErrorRate > 0 ? weakestCategory : "";
    
    if (maxErrorRate > 0) {
        weakestCategoryInfo.classList.remove('hidden');
        perfectScoreInfo.classList.add('hidden');
        weakestSubjectName.textContent = weakestCategory;
        weakestDescription.innerHTML = `현재 가장 오답률이 높은 취약 유형은 <strong>'${weakestCategory}'</strong> 입니다.<br>해당 유형의 개념을 다시 학습하고 오답 노트를 작성해보세요!`;
        retryWeakBtn.classList.remove('hidden');
    } else {
        weakestCategoryInfo.classList.add('hidden');
        perfectScoreInfo.classList.remove('hidden');
        retryWeakBtn.classList.add('hidden');
    }

    // 4. 문항별 세부 채점표 테이블 채우기
    detailedTableBody.innerHTML = '';
    for (const [qIdStr, qInfo] of Object.entries(originalQuestions)) {
        const qId = Number(qIdStr);
        const studentAns = fullAnswers[qId] || "-";
        const correctAns = qInfo.answer;
        const isCorrect = studentAns.trim().toLowerCase() === correctAns.toLowerCase();

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${qId}</td>
            <td><span class="category-badge ${qInfo.category === '수학' ? 'math' : qInfo.category === '과학' ? 'science' : 'english'}">${qInfo.category}</span></td>
            <td><strong>${qInfo.question}</strong></td>
            <td class="${isCorrect ? 'text-success' : 'text-error'}">${studentAns}</td>
            <td><strong>${correctAns}</strong></td>
            <td><span class="result-tag ${isCorrect ? 'correct' : 'wrong'}">${isCorrect ? '정답' : '오답'}</span></td>
        `;
        detailedTableBody.appendChild(tr);
    }

    // 5. 로컬스토리지에 이력 저장
    saveQuizAttempt(correctCount, totalQuestions, overallErrorRate, state.weakestCategory);

    // 대시보드 뷰로 이동
    showView(dashboardScreen);
}

// 로컬스토리지 학습 이력 저장
function saveQuizAttempt(score, total, errorRate, weakest) {
    const attempt = {
        id: Date.now(),
        timestamp: new Date().toLocaleString('ko-KR'),
        username: state.username,
        score: score,
        total: total,
        errorRate: errorRate,
        weakest: weakest || "없음"
    };

    const history = JSON.parse(localStorage.getItem('study_history') || '[]');
    history.push(attempt);
    localStorage.setItem('study_history', JSON.stringify(history));
}

// 학습 이력 패널 열기 및 차트 그리기
function openHistoryPanel() {
    showView(historyScreen);
    renderHistoryTable();
    drawHistoryChart();
}

function closeHistoryPanel() {
    showView(dashboardScreen);
}

// 이력 테이블 렌더링
function renderHistoryTable() {
    const history = JSON.parse(localStorage.getItem('study_history') || '[]');
    historyTableBody.innerHTML = '';

    if (history.length === 0) {
        historyTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">저장된 학습 이력이 없습니다. 퀴즈를 풀면 여기에 기록됩니다.</td></tr>`;
        return;
    }

    // 역순 정렬 (최신 시도가 위로)
    const reversedHistory = [...history].reverse();
    reversedHistory.forEach((attempt, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${history.length - index}회차</td>
            <td>${attempt.timestamp}</td>
            <td>${attempt.username}</td>
            <td><strong>${attempt.score} / ${attempt.total}</strong> (${(100 - attempt.errorRate).toFixed(1)}%)</td>
            <td><span class="text-error" style="font-weight:600;">${attempt.weakest}</span></td>
        `;
        historyTableBody.appendChild(tr);
    });
}

// SVG 누적 성취도 선형 그래프 그리기
function drawHistoryChart() {
    const history = JSON.parse(localStorage.getItem('study_history') || '[]');
    historyChartSvg.querySelectorAll('.dynamic-chart-element').forEach(el => el.remove());

    if (history.length < 2) {
        // 데이터 부족 안내 텍스트 노출
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", "250");
        text.setAttribute("y", "100");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "var(--text-muted)");
        text.setAttribute("class", "dynamic-chart-element");
        text.textContent = "누적 성취도를 시각화하려면 최소 2번 이상의 시도가 필요합니다.";
        historyChartSvg.appendChild(text);
        return;
    }

    // 가로 폭 500, 세로 폭 200 기준 차트 포인트 매핑
    const maxPoints = Math.min(history.length, 10); // 최대 최근 10개 시도 시각화
    const recentHistory = history.slice(-maxPoints);

    const paddingX = 40;
    const paddingY = 30;
    const chartWidth = 500 - paddingX * 2;
    const chartHeight = 200 - paddingY * 2;

    const points = recentHistory.map((attempt, index) => {
        const x = paddingX + (index * (chartWidth / (recentHistory.length - 1)));
        const accuracy = 100 - attempt.errorRate;
        const y = paddingY + chartHeight - (accuracy * (chartHeight / 100)); // 100%가 가장 위(0)에 해당
        return { x, y, accuracy, attemptNum: history.length - recentHistory.length + index + 1 };
    });

    // 1. 그리드 가이드라인 그리기 (0%, 50%, 100%)
    const yGridValues = [0, 50, 100];
    yGridValues.forEach(val => {
        const y = paddingY + chartHeight - (val * (chartHeight / 100));
        
        // 가이드선
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", paddingX.toString());
        line.setAttribute("y1", y.toString());
        line.setAttribute("x2", (500 - paddingX).toString());
        line.setAttribute("y2", y.toString());
        line.setAttribute("stroke", "rgba(255, 255, 255, 0.05)");
        line.setAttribute("stroke-dasharray", "4");
        line.setAttribute("class", "dynamic-chart-element");
        historyChartSvg.appendChild(line);

        // 가이드 텍스트
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", (paddingX - 10).toString());
        text.setAttribute("y", (y + 4).toString());
        text.setAttribute("text-anchor", "end");
        text.setAttribute("fill", "var(--text-muted)");
        text.setAttribute("font-size", "10");
        text.setAttribute("class", "dynamic-chart-element");
        text.textContent = `${val}%`;
        historyChartSvg.appendChild(text);
    });

    // 2. 꺾은선 경로(Path) 생성
    let pathD = `M ${points[0].x} ${points[0].y}`;
    let areaD = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x} ${points[i].y}`;
    }
    
    // 그라데이션 채우기를 위한 Area 경로 닫기
    areaD = pathD + ` L ${points[points.length - 1].x} ${paddingY + chartHeight} L ${points[0].x} ${paddingY + chartHeight} Z`;

    // 3. Area 그리기
    const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    areaPath.setAttribute("d", areaD);
    areaPath.setAttribute("class", "history-chart-area dynamic-chart-element");
    historyChartSvg.appendChild(areaPath);

    // 4. Line 그리기
    const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    linePath.setAttribute("d", pathD);
    linePath.setAttribute("class", "history-chart-line dynamic-chart-element");
    historyChartSvg.appendChild(linePath);

    // 5. 점(Dot) 및 툴팁 그리기
    points.forEach(pt => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", pt.x.toString());
        circle.setAttribute("cy", pt.y.toString());
        circle.setAttribute("r", "4.5");
        circle.setAttribute("class", "history-chart-point dynamic-chart-element");
        
        // 마우스 호버 시 정확도 툴팁 효과용 title 추가
        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `${pt.attemptNum}회차: 정답률 ${pt.accuracy.toFixed(1)}%`;
        circle.appendChild(title);
        
        historyChartSvg.appendChild(circle);

        // x축 라벨 (회차 번호)
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", pt.x.toString());
        text.setAttribute("y", (paddingY + chartHeight + 15).toString());
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "var(--text-muted)");
        text.setAttribute("font-size", "10");
        text.setAttribute("class", "dynamic-chart-element");
        text.textContent = `${pt.attemptNum}회`;
        historyChartSvg.appendChild(text);
    });
}

// 학습 이력 초기화
function clearHistory() {
    if (confirm('모든 누적 학습 이력을 삭제하시겠습니까?')) {
        localStorage.removeItem('study_history');
        renderHistoryTable();
        drawHistoryChart();
    }
}
)

[style.css](https://github.com/user-attachments/files/29160744/style.css)/* Design System Tokens */
:root {
    --bg-gradient-start: #0a0f1d;
    --bg-gradient-end: #070a13;
    
    --card-bg: rgba(18, 26, 47, 0.6);
    --card-border: rgba(255, 255, 255, 0.08);
    --card-glow: rgba(99, 102, 241, 0.05);

    --primary-color: #6366f1; /* Indigo */
    --primary-hover: #4f46e5;
    --primary-glow: rgba(99, 102, 241, 0.4);

    --accent-color: #f59e0b; /* Amber */
    --accent-hover: #d97706;

    --success-color: #10b981; /* Emerald */
    --error-color: #ef4444; /* Rose */
    
    --text-main: #f3f4f6;
    --text-muted: #9ca3af;
    --text-inverse: #ffffff;

    /* Category colors */
    --cat-math: #a855f7;    /* Violet */
    --cat-science: #14b8a6; /* Teal */
    --cat-english: #ec4899; /* Pink */

    --font-outfit: 'Outfit', sans-serif;
    --font-inter: 'Inter', sans-serif;

    --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Global Reset */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background-color: var(--bg-gradient-start);
    color: var(--text-main);
    font-family: var(--font-inter);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    position: relative;
}

/* Decorative Background Blobs */
.app-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -2;
    background: radial-gradient(circle at bottom right, #0d1527, var(--bg-gradient-end));
    overflow: hidden;
}

.blob-1, .blob-2, .blob-3 {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.25;
    animation: float-blobs 25s infinite ease-in-out alternate;
}

.blob-1 {
    width: 400px;
    height: 400px;
    background: var(--primary-color);
    top: -100px;
    left: -100px;
}

.blob-2 {
    width: 500px;
    height: 500px;
    background: var(--cat-math);
    bottom: -150px;
    right: -100px;
    animation-delay: -5s;
}

.blob-3 {
    width: 300px;
    height: 300px;
    background: var(--cat-science);
    top: 40%;
    left: 60%;
    animation-delay: -10s;
}

@keyframes float-blobs {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(40px, 60px) scale(1.1); }
}

/* Main Container Layout */
.app-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem 1rem;
    position: relative;
    z-index: 1;
}

/* Glassmorphism Card Style */
.glass-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 2.5rem;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    width: 100%;
    position: relative;
    overflow: hidden;
    transition: var(--transition-smooth);
}

.glass-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at top left, var(--card-glow), transparent 60%);
    pointer-events: none;
}

/* View Panels and Dynamic Switching */
.view-panel {
    display: none;
    width: 100%;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.5s ease, transform 0.5s ease;
}

.view-panel.active {
    display: block;
    opacity: 1;
    transform: translateY(0);
}

/* --- 1. WELCOME SCREEN STYLE --- */
.welcome-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
}

.brand-logo {
    background: linear-gradient(135deg, var(--primary-color), var(--cat-math));
    padding: 1rem;
    border-radius: 20px;
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
}

.logo-icon {
    color: white;
}

.main-title {
    font-family: var(--font-outfit);
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.75rem;
    letter-spacing: -0.03em;
}

.subtitle {
    font-size: 1.05rem;
    color: var(--text-muted);
    line-height: 1.6;
    margin-bottom: 2rem;
    max-width: 460px;
}

.user-input-group {
    width: 100%;
    max-width: 360px;
    margin-bottom: 2rem;
    text-align: left;
}

.user-input-group label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.user-input-group input {
    width: 100%;
    padding: 1rem 1.25rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--card-border);
    color: white;
    font-size: 1rem;
    font-family: var(--font-inter);
    outline: none;
    transition: var(--transition-smooth);
}

.user-input-group input:focus {
    border-color: var(--primary-color);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.25);
}

.quiz-info-preview {
    display: flex;
    gap: 1rem;
    margin-bottom: 2.5rem;
    flex-wrap: wrap;
    justify-content: center;
}

.info-badge {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--card-border);
    padding: 0.6rem 1.2rem;
    border-radius: 99px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
}

.welcome-buttons {
    display: flex;
    gap: 1rem;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
}

/* Button Styles */
.primary-btn {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
    color: white;
    border: none;
    padding: 1.1rem 2.5rem;
    border-radius: 14px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition: var(--transition-smooth);
    box-shadow: 0 4px 20px var(--primary-glow);
}

.primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(99, 102, 241, 0.6);
}

.primary-btn:active {
    transform: translateY(0);
}

.secondary-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--card-border);
    color: var(--text-main);
    padding: 0.9rem 1.8rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: var(--transition-smooth);
}

.secondary-btn:hover:not(.disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--text-muted);
}

.secondary-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.primary-btn-sm {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-smooth);
}

.primary-btn-sm:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
}

.accent-btn {
    background: linear-gradient(135deg, var(--accent-color), #d97706);
    color: white;
    border: none;
    padding: 1rem 1.8rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-smooth);
    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
}

.accent-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
}

.accent-btn.secondary {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: var(--accent-color);
    box-shadow: none;
}

.accent-btn.secondary:hover {
    background: rgba(245, 158, 11, 0.1);
}

.danger-btn {
    background: var(--error-color);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-smooth);
}

.danger-btn:hover {
    background: #dc2626;
}

/* --- 2. QUIZ SCREEN STYLE --- */
.quiz-card {
    max-width: 700px;
    margin: 0 auto;
}

.quiz-header {
    margin-bottom: 2.5rem;
}

.quiz-progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.question-number {
    font-family: var(--font-outfit);
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-muted);
}

.category-badge {
    padding: 0.35rem 1rem;
    border-radius: 99px;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
}

.category-badge.math { background: rgba(168, 85, 247, 0.2); color: var(--cat-math); border: 1px solid rgba(168, 85, 247, 0.4); }
.category-badge.science { background: rgba(20, 184, 166, 0.2); color: var(--cat-science); border: 1px solid rgba(20, 184, 166, 0.4); }
.category-badge.english { background: rgba(236, 72, 153, 0.2); color: var(--cat-english); border: 1px solid rgba(236, 72, 153, 0.4); }

.progress-bar-outer {
    background: rgba(255, 255, 255, 0.05);
    height: 8px;
    border-radius: 99px;
    overflow: hidden;
}

.progress-bar-inner {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), var(--cat-math));
    border-radius: 99px;
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.question-container {
    min-height: 110px;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
}

.question-text {
    font-size: 1.6rem;
    font-weight: 600;
    line-height: 1.5;
    font-family: var(--font-outfit);
}

.answer-container {
    position: relative;
    margin-bottom: 2.5rem;
}

.answer-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--card-border);
    border-radius: 16px;
    padding: 1.25rem 1.5rem;
    color: white;
    font-size: 1.2rem;
    outline: none;
    transition: var(--transition-smooth);
}

.answer-input:focus {
    background: rgba(255, 255, 255, 0.07);
    border-color: var(--primary-color);
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
}

.quiz-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* --- 3. DASHBOARD SCREEN STYLE --- */
.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 2.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.dashboard-title {
    font-family: var(--font-outfit);
    font-size: 2.2rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: 0.25rem;
}

.dashboard-subtitle {
    color: var(--text-muted);
    font-size: 1.05rem;
}

.header-actions {
    display: flex;
    gap: 0.75rem;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 1.3fr;
    gap: 1.5rem;
    width: 100%;
    margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
    .dashboard-grid {
        grid-template-columns: 1fr;
    }
}

/* Left Card: Score ring */
.stat-summary-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.stat-summary-card h3,
.weakest-focus-card h3,
.category-breakdown-card h3,
.detailed-analysis-card h3 {
    width: 100%;
    text-align: left;
    font-family: var(--font-outfit);
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    letter-spacing: -0.01em;
}

.score-ring-container {
    position: relative;
    width: 160px;
    height: 160px;
    margin-bottom: 1.5rem;
}

.score-ring-svg {
    transform: rotate(-90deg);
    width: 100%;
    height: 100%;
}

.score-ring-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.05);
    stroke-width: 10;
}

.score-ring-progress {
    fill: none;
    stroke: url(#score-grad);
    stroke-width: 10;
    stroke-linecap: round;
    transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Fallback color when gradient tag is generated on runtime */
#score-ring-progress {
    stroke: var(--primary-color);
}

.score-ring-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.score-fraction {
    font-family: var(--font-outfit);
    font-size: 2rem;
    font-weight: 800;
    color: white;
}

.score-percentage {
    font-size: 0.95rem;
    color: var(--text-muted);
    font-weight: 600;
}

.stats-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    border-top: 1px solid var(--card-border);
    padding-top: 1.2rem;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.95rem;
}

.stat-label {
    color: var(--text-muted);
}

.stat-value {
    font-weight: 600;
}

.stat-value.error-text {
    color: var(--error-color);
}

.text-success { color: var(--success-color); }
.text-error { color: var(--error-color); }

/* Right Card: Focus Area */
.weakest-focus-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.focus-badge {
    background: rgba(245, 158, 11, 0.15);
    color: var(--accent-color);
    border: 1px solid rgba(245, 158, 11, 0.3);
    padding: 0.3rem 0.8rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    width: fit-content;
    margin-bottom: 1rem;
}

.weakest-category-info,
.perfect-score-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-bottom: 2rem;
}

.weakest-subject-name {
    font-family: var(--font-outfit);
    font-size: 2.2rem;
    font-weight: 800;
    color: var(--accent-color);
    margin-bottom: 0.5rem;
}

.weakest-text {
    font-size: 1rem;
    color: var(--text-main);
    line-height: 1.6;
}

.celebration-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    animation: bounce 2s infinite;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.action-buttons-group {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.hidden {
    display: none !important;
}

/* Category Breakdown Grid */
.category-breakdown-card {
    margin-bottom: 1.5rem;
}

.category-bars {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
}

.category-bar-row {
    display: grid;
    grid-template-columns: 100px 1fr 100px;
    align-items: center;
    gap: 1rem;
}

.category-bar-label {
    font-weight: 600;
    font-size: 0.95rem;
}

.category-bar-outer {
    background: rgba(255, 255, 255, 0.04);
    height: 14px;
    border-radius: 99px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.02);
}

.category-bar-inner {
    height: 100%;
    border-radius: 99px;
    width: 0; /* Dynamic animated fill */
    transition: width 1.2s cubic-bezier(0.1, 0.8, 0.3, 1);
}

.category-bar-inner.math { background: linear-gradient(90deg, #8b5cf6, var(--cat-math)); }
.category-bar-inner.science { background: linear-gradient(90deg, #0d9488, var(--cat-science)); }
.category-bar-inner.english { background: linear-gradient(90deg, #db2777, var(--cat-english)); }

.category-bar-value {
    text-align: right;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-muted);
}

.category-bar-value.wrong {
    color: var(--error-color);
}

/* Detailed Answers Table */
.detailed-analysis-card {
    margin-bottom: 1rem;
}

.analysis-table-container {
    width: 100%;
    overflow-x: auto;
}

.analysis-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.95rem;
}

.analysis-table th, 
.analysis-table td {
    padding: 1rem 1.2rem;
    border-bottom: 1px solid var(--card-border);
}

.analysis-table th {
    font-weight: 600;
    color: var(--text-muted);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.analysis-table tbody tr {
    transition: var(--transition-smooth);
}

.analysis-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.02);
}

.result-tag {
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 700;
    display: inline-block;
}

.result-tag.correct {
    background: rgba(16, 185, 129, 0.15);
    color: var(--success-color);
    border: 1px solid rgba(16, 185, 129, 0.3);
}

.result-tag.wrong {
    background: rgba(239, 68, 68, 0.15);
    color: var(--error-color);
    border: 1px solid rgba(239, 68, 68, 0.3);
}

/* --- 4. HISTORY MODAL/PANEL STYLE --- */
.history-card {
    max-width: 800px;
    margin: 0 auto;
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.history-header h2 {
    font-family: var(--font-outfit);
    font-size: 1.8rem;
    font-weight: 800;
}

.close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 2rem;
    cursor: pointer;
    line-height: 1;
    transition: var(--transition-smooth);
}

.close-btn:hover {
    color: white;
}

.chart-container {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--card-border);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.history-chart-svg {
    width: 100%;
    height: 100%;
}

.history-chart-line {
    fill: none;
    stroke: var(--primary-color);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    animation: draw-chart-line 2s forwards ease-in-out;
}

.history-chart-area {
    fill: url(#chart-gradient);
    opacity: 0.15;
}

.history-chart-point {
    fill: var(--primary-color);
    stroke: var(--bg-gradient-start);
    stroke-width: 2.5;
    cursor: pointer;
    transition: var(--transition-smooth);
}

.history-chart-point:hover {
    fill: white;
    r: 6;
}

.history-list-wrapper h3 {
    font-family: var(--font-outfit);
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 1rem;
}

.history-table-container {
    width: 100%;
    overflow-x: auto;
    max-height: 250px;
}

.history-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
}

.history-table th,
.history-table td {
    padding: 0.8rem 1rem;
    border-bottom: 1px solid var(--card-border);
    text-align: left;
}

.history-table th {
    color: var(--text-muted);
    font-size: 0.8rem;
    text-transform: uppercase;
}

.history-footer {
    margin-top: 2rem;
    display: flex;
    justify-content: flex-end;
}

/* Footer Section */
.app-footer {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--text-muted);
    font-size: 0.85rem;
    margin-top: auto;
}

/* Micro-animations */
@keyframes draw-chart-line {
    0% { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
    100% { stroke-dasharray: 1000; stroke-dashoffset: 0; }
}



<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Smart Study Dashboard - 학습 패턴 분석기</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="app-background">
        <div class="blob-1"></div>
        <div class="blob-2"></div>
        <div class="blob-3"></div>
    </div>

    <main class="app-container">
        <!-- 1. WELCOME SCREEN -->
        <section id="welcome-screen" class="view-panel active">
            <div class="glass-card welcome-card">
                <div class="brand-logo">
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" class="logo-icon">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                    </svg>
                </div>
                <h1 class="main-title">AI Smart Study Dashboard</h1>
                <p class="subtitle">제시된 퀴즈를 풀고 인공지능이 제공하는 맞춤형 취약점 분석 리포트를 확인해보세요.</p>
                
                <div class="user-input-group">
                    <label for="username">학습자 이름</label>
                    <input type="text" id="username" placeholder="이름을 입력하세요" value="홍길동">
                </div>

                <div class="quiz-info-preview">
                    <div class="info-badge">
                        <span class="badge-icon">✏️</span>
                        <span class="badge-text">총 6문항</span>
                    </div>
                    <div class="info-badge">
                        <span class="badge-icon">📊</span>
                        <span class="badge-text">실시간 학습 분석</span>
                    </div>
                    <div class="info-badge">
                        <span class="badge-icon">💡</span>
                        <span class="badge-text">취약점 추적</span>
                    </div>
                </div>

                <div class="welcome-buttons">
                    <button id="start-quiz-btn" class="primary-btn">
                        <span>학습 시작하기</span>
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                    <button id="view-sample-btn" class="secondary-btn">
                        <span>가상 분석 결과 보기</span>
                    </button>
                </div>
            </div>
        </section>

        <!-- 2. QUIZ SCREEN -->
        <section id="quiz-screen" class="view-panel">
            <div class="glass-card quiz-card">
                <div class="quiz-header">
                    <div class="quiz-progress-info">
                        <span class="question-number">Question <span id="current-q-num">1</span> / <span id="total-q-num">6</span></span>
                        <span id="category-badge" class="category-badge math">수학</span>
                    </div>
                    <div class="progress-bar-outer">
                        <div id="progress-bar-inner" class="progress-bar-inner" style="width: 16.6%"></div>
                    </div>
                </div>

                <div class="question-container">
                    <h2 id="question-text" class="question-text">2 + 2는 무엇일까요?</h2>
                </div>

                <div class="answer-container">
                    <input type="text" id="student-answer-input" class="answer-input" placeholder="정답을 입력한 후 Enter 또는 제출 버튼을 누르세요..." autocomplete="off">
                    <div class="input-glow"></div>
                </div>

                <div class="quiz-footer">
                    <button id="prev-question-btn" class="secondary-btn disabled" disabled>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        <span>이전</span>
                    </button>
                    <button id="next-question-btn" class="primary-btn">
                        <span>제출 및 다음</span>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </section>

        <!-- 3. DASHBOARD SCREEN -->
        <section id="dashboard-screen" class="view-panel">
            <div class="dashboard-header">
                <div>
                    <h1 class="dashboard-title"><span id="report-user-name">홍길동</span> 학습 패턴 결과 보고서</h1>
                    <p class="dashboard-subtitle">실시간 데이터 연산 및 유형별 성취도 진단 결과</p>
                </div>
                <div class="header-actions">
                    <button id="view-history-btn" class="secondary-btn">
                        <span>학습 이력</span>
                    </button>
                    <button id="restart-quiz-btn" class="primary-btn-sm">
                        <span>다시 풀기</span>
                    </button>
                </div>
            </div>

            <div class="dashboard-grid">
                <!-- Left: Score Ring & Overall Stats -->
                <div class="glass-card stat-summary-card">
                    <h3>종합 성적 및 오답률</h3>
                    <div class="score-ring-container">
                        <svg class="score-ring-svg" viewBox="0 0 120 120">
                            <circle class="score-ring-bg" cx="60" cy="60" r="50"></circle>
                            <circle id="score-ring-progress" class="score-ring-progress" cx="60" cy="60" r="50" stroke-dasharray="314" stroke-dashoffset="314"></circle>
                        </svg>
                        <div class="score-ring-text">
                            <span id="score-fraction" class="score-fraction">4 / 6</span>
                            <span id="score-percentage" class="score-percentage">66.7%</span>
                        </div>
                    </div>
                    <div class="stats-list">
                        <div class="stat-item">
                            <span class="stat-label">전체 오답률</span>
                            <span id="stat-error-rate" class="stat-value error-text">33.3%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">정답 문항</span>
                            <span id="stat-correct-count" class="stat-value text-success">4문항</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">오답 문항</span>
                            <span id="stat-wrong-count" class="stat-value text-error">2문항</span>
                        </div>
                    </div>
                </div>

                <!-- Right: Weakest Area Focus -->
                <div class="glass-card weakest-focus-card">
                    <div class="focus-badge">FOCUS AREA</div>
                    <h3 class="focus-title">💡 집중 보완이 필요한 유형</h3>
                    
                    <div id="weakest-category-info" class="weakest-category-info">
                        <div class="weakest-subject-name" id="weakest-subject-name">과학</div>
                        <p class="weakest-text" id="weakest-description">현재 해당 유형의 오답률이 가장 높습니다. 개념을 다시 복습하고 하단의 오답 분석을 확인하여 오답 노트를 작성해보세요!</p>
                    </div>
                    
                    <div id="perfect-score-info" class="perfect-score-info hidden">
                        <div class="celebration-icon">🎉</div>
                        <div class="weakest-subject-name">만점입니다!</div>
                        <p class="weakest-text">모든 유형의 문제를 정답 처리하셨습니다. 취약한 유형이 존재하지 않습니다. 훌륭합니다!</p>
                    </div>

                    <div class="action-buttons-group">
                        <button id="retry-wrong-btn" class="accent-btn">
                            <span>오답 노트 복습하기</span>
                        </button>
                        <button id="retry-weak-btn" class="accent-btn secondary">
                            <span>취약 유형만 다시 풀기</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Row 2: Category Breakdown -->
            <div class="glass-card category-breakdown-card">
                <h3>📚 과목 유형별 오답률 분석</h3>
                <div class="category-bars" id="category-bars-container">
                    <!-- Dynamic rendering in app.js -->
                </div>
            </div>

            <!-- Row 3: Incorrect Answers Detailed Analysis -->
            <div class="glass-card detailed-analysis-card">
                <h3>🔍 문항별 세부 채점표</h3>
                <div class="analysis-table-container">
                    <table class="analysis-table">
                        <thead>
                            <tr>
                                <th>번호</th>
                                <th>유형</th>
                                <th>질문 내용</th>
                                <th>학생 답안</th>
                                <th>정답</th>
                                <th>결과</th>
                            </tr>
                        </thead>
                        <tbody id="detailed-table-body">
                            <!-- Dynamic rendering in app.js -->
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- 4. HISTORY MODAL/PANEL -->
        <section id="history-screen" class="view-panel">
            <div class="glass-card history-card">
                <div class="history-header">
                    <h2>📈 누적 학습 성취도 추이</h2>
                    <button id="close-history-btn" class="close-btn">&times;</button>
                </div>
                <div class="history-content">
                    <div class="chart-container">
                        <svg id="history-chart-svg" class="history-chart-svg" viewBox="0 0 500 200">
                            <!-- SVG lines & dots will be drawn dynamically -->
                        </svg>
                    </div>
                    <div class="history-list-wrapper">
                        <h3>학습 완료 이력</h3>
                        <div class="history-table-container">
                            <table class="history-table">
                                <thead>
                                    <tr>
                                        <th>시도</th>
                                        <th>일시</th>
                                        <th>학습자</th>
                                        <th>점수</th>
                                        <th>취약 유형</th>
                                    </tr>
                                </thead>
                                <tbody id="history-table-body">
                                    <!-- Dynamic rows in app.js -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="history-footer">
                        <button id="clear-history-btn" class="danger-btn">기록 전체 삭제</button>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="app-footer">
        <p>&copy; 2026 AI Smart Study Dashboard. Designed for excellence.</p>
    </footer>

    <script src="app.js"></script>
</body>
</html>
