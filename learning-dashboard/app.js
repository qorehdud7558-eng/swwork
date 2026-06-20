// 1. 문제 데이터셋 정의 (원본 파이썬 코드와 동일)
const originalQuestions = { 
    1: {"question": "2 + 2는 무엇일까요?", "answer": "4", "category": "수학"}, 
    2: {"question": "5 * 6은 무엇일까요?", "answer": "30", "category": "수학"}, 
    3: {"question": "물은 섭씨 몇 도에서 끓을까요? (숫자만)", "answer": "100", "category": "과학"}, 
    4: {"question": "지구에서 가장 가까운 행성은 무엇일까요?", "answer": "금성", "category": "과학"}, 
    5: {"question": "사과를 뜻하는 영어 단어는?", "answer": "apple", "category": "영어"}, 
    6: {"question": "소년을 뜻하는 영어 단어는?", "answer": "boy", "category": "영어"} 
};

// 학생의 초기 가상 답안 (파이썬 코드 분석과 동일하게 매칭하기 위해 첫 로드 시 환영 화면 입력값으로 활용)
const virtualAnswers = { 
    1: "4",      // 수학 - 맞음 
    2: "35",     // 수학 - 틀림 
    3: "100",    // 과학 - 맞음 
    4: "화성",   // 과학 - 틀림 
    5: "banana", // 영어 - 틀림 
    6: "boy"     // 영어 - 맞음 
};

// 애플리케이션 상태 관리
let state = {
    username: "홍길동",
    questions: { ...originalQuestions }, // 현재 풀고 있는 문제 세트
    activeQuestionIds: Object.keys(originalQuestions).map(Number), // 현재 진행 중인 문제 ID 목록
    currentActiveIndex: 0, // activeQuestionIds 배열의 인덱스
    studentAnswers: {}, // 학습자 입력 답안
    studentAnswersMaster: {}, // 누적 최신 답안 레코드 (복습 시 이전 맞은 답안 연동용)
    quizMode: "normal", // "normal", "wrong_review", "weak_review"
    weakestCategory: ""
};

// DOM 요소 캐싱
const welcomeScreen = document.getElementById('welcome-screen');
const quizScreen = document.getElementById('quiz-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const historyScreen = document.getElementById('history-screen');

const usernameInput = document.getElementById('username');
const startQuizBtn = document.getElementById('start-quiz-btn');
const viewSampleBtn = document.getElementById('view-sample-btn');

const currentQNumSpan = document.getElementById('current-q-num');
const totalQNumSpan = document.getElementById('total-q-num');
const categoryBadge = document.getElementById('category-badge');
const progressBarInner = document.getElementById('progress-bar-inner');
const questionText = document.getElementById('question-text');
const studentAnswerInput = document.getElementById('student-answer-input');
const prevQuestionBtn = document.getElementById('prev-question-btn');
const nextQuestionBtn = document.getElementById('next-question-btn');

const reportUserName = document.getElementById('report-user-name');
const scoreFraction = document.getElementById('score-fraction');
const scorePercentage = document.getElementById('score-percentage');
const scoreRingProgress = document.getElementById('score-ring-progress');
const statErrorRate = document.getElementById('stat-error-rate');
const statCorrectCount = document.getElementById('stat-correct-count');
const statWrongCount = document.getElementById('stat-wrong-count');

const weakestCategoryInfo = document.getElementById('weakest-category-info');
const perfectScoreInfo = document.getElementById('perfect-score-info');
const weakestSubjectName = document.getElementById('weakest-subject-name');
const weakestDescription = document.getElementById('weakest-description');

const retryWrongBtn = document.getElementById('retry-wrong-btn');
const retryWeakBtn = document.getElementById('retry-weak-btn');
const restartQuizBtn = document.getElementById('restart-quiz-btn');
const dashboardRestartQuizBtn = document.getElementById('dashboard-restart-quiz-btn');

const categoryBarsContainer = document.getElementById('category-bars-container');
const detailedTableBody = document.getElementById('detailed-table-body');

const viewHistoryBtn = document.getElementById('view-history-btn');
const closeHistoryBtn = document.getElementById('close-history-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const historyTableBody = document.getElementById('history-table-body');
const historyChartSvg = document.getElementById('history-chart-svg');

// 초기화
window.addEventListener('DOMContentLoaded', () => {
    // 1. SVG 색상 그라디언트 정의 삽입 (디자인 향상)
    injectSvgGradients();
    
    // 2. 이벤트 리스너 바인딩
    startQuizBtn.addEventListener('click', startQuiz);
    viewSampleBtn.addEventListener('click', loadSampleReport);
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
