[learning_analyzer.py](https://github.com/user-attachments/files/29160613/learning_analyzer.py)

# 1. 문제 데이터셋 정의 (문제, 정답, 유형) 
questions = { 
    1: {"question": "2 + 2는 무엇일까요?", "answer": "4", "category": "수학"}, 
    2: {"question": "5 * 6은 무엇일까요?", "answer": "30", "category": "수학"}, 
    3: {"question": "물은 섭씨 몇 도에서 끓을까요? (숫자만)", "answer": "100", "category": "과학"}, 
    4: {"question": "지구에서 가장 가까운 행성은 무엇일까요?", "answer": "금성", "category": "과학"}, 
    5: {"question": "사과를 뜻하는 영어 단어는?", "answer": "apple", "category": "영어"}, 
    6: {"question": "소년을 뜻하는 영어 단어는?", "answer": "boy", "category": "영어"} 
} 
 
# 2. 학생의 제출 답안 가상 데이터 
# (실제 시스템에서는 input() 등을 통해 입력을 받겠지만, 분석 기능을 위해 가상 데이터를 사용합니다.) 
student_answers = { 
    1: "4",      # 수학 - 맞음 
    2: "35",     # 수학 - 틀림 
    3: "100",    # 과학 - 맞음 
    4: "화성",   # 과학 - 틀림 
    5: "banana", # 영어 - 틀림 
    6: "boy"     # 영어 - 맞음 
} 
 
def analyze_learning_pattern(questions, student_answers): 
    total_questions = len(questions) 
    correct_count = 0 
     
    # 유형별 통계를 저장할 딕셔너리 
    # 구조: {"유형": {"총문제수": 0, "맞은문제수": 0}} 
    category_stats = {} 
 
    # 채점 및 유형별 분류 시작 
    for q_id, q_info in questions.items(): 
        category = q_info["category"] 
        correct_ans = q_info["answer"] 
        student_ans = student_answers.get(q_id, "").strip().lower() # 대소문자 및 공백 제거 
 
        # 해당 유형이 딕셔너리에 없으면 초기화 
        if category not in category_stats: 
            category_stats[category] = {"total": 0, "correct": 0} 
         
        category_stats[category]["total"] += 1 
 
        # 정답 여부 확인 
        if student_ans == correct_ans.lower(): 
            correct_count += 1 
            category_stats[category]["correct"] += 1 
 
    # 3. 분석 결과 계산 및 출력 
    print("=" * 40) 
    print("         [ 학습 결과 보고서 ]         ") 
    print("=" * 40) 
     
    # 전체 오답률 계산 
    overall_error_rate = ((total_questions - correct_count) / total_questions) * 100 
    print(f"▶ 전체 점수: {correct_count} / {total_questions} (맞은 개수 / 총 문제수)") 
    print(f"▶ 전체 오답률: {overall_error_rate:.1f}%") 
    print("-" * 40) 
    print("▶ 유형별 오답률 분석:") 
     
    weakest_category = "" 
    max_error_rate = -1 
 
    for category, stats in category_stats.items(): 
        wrong_count = stats["total"] - stats["correct"] 
        # 유형별 오답률 계산 
        error_rate = (wrong_count / stats["total"]) * 100 
        print(f" - [{category}] 총 {stats['total']}문항 중 {wrong_count}문항 틀림 (오답률: {error_rate:.1f}%)") 
         
        # 가장 취약한 유형 찾기 (오답률이 가장 높은 유형) 
        if error_rate > max_error_rate: 
            max_error_rate = error_rate 
            weakest_category = category 
        elif error_rate == max_error_rate: 
            # 오답률이 같다면 이름을 추가 
            weakest_category += f", {category}" 
 
    print("-" * 40) 
    # 취약 유형 피드백 (모두 맞춘 경우는 제외) 
    if max_error_rate > 0: 
        print(f"💡 [집중 보완 필요] 현재 가장 취약한 유형은 **'{weakest_category}'** 입니다.") 
        print("   해당 유형의 개념을 다시 복습하고 오답 노트를 작성해 보세요!") 
    else: 
        print("🎉 축하합니다! 모든 문제를 맞추셨습니다. 취약한 유형이 없습니다.") 
    print("=" * 40) 
 
# 시스템 실행 
analyze_learning_pattern(questions, student_answers) 
