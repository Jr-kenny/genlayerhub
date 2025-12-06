// Simple Quiz Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Quiz app initializing...');
    
    let quizData = null;
    let currentLevel = null;
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let score = 0;
    let timer = null;
    let timeLeft = 0;
    let startTime = null;
    
    // Load quiz data
    async function loadQuizData() {
        try {
            console.log('Loading quiz data from /data/quiz.json...');
            const response = await fetch('/data/quiz.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            quizData = await response.json();
            console.log('Quiz data loaded successfully');
            setupEventListeners();
        } catch (error) {
            console.error('Error loading quiz data:', error);
        }
    }
    
    function setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Difficulty selection
        const difficultyCards = document.querySelectorAll('.difficulty-card');
        difficultyCards.forEach(card => {
            card.addEventListener('click', function(e) {
                console.log('Difficulty card clicked:', this.dataset.difficulty);
                showReadingMaterial(this.dataset.difficulty);
            });
        });
        
        // Back to levels button
        document.getElementById('backToLevelsBtn').addEventListener('click', hideReadingMaterial);
        
        // Start quiz button
        document.getElementById('startQuizBtn').addEventListener('click', startQuiz);
        
        // Quiz navigation
        document.getElementById('prevBtn').addEventListener('click', prevQuestion);
        document.getElementById('nextBtn').addEventListener('click', nextQuestion);
        
        // Results page buttons
        document.getElementById('restartBtn').addEventListener('click', restartQuiz);
        document.getElementById('shareBtn').addEventListener('click', shareResults);
        document.getElementById('certificateBtn').addEventListener('click', showCertificate);
        document.getElementById('downloadCertBtn').addEventListener('click', downloadCertificate);
        
        console.log('Event listeners set up successfully');
    }
    
    function showReadingMaterial(level) {
        if (!quizData || !quizData.quizLevels[level]) {
            alert('Quiz data not loaded. Please refresh the page.');
            return;
        }
        
        currentLevel = level;
        const levelData = quizData.quizLevels[level];
        
        console.log('Showing reading material for:', level);
        
        // Hide difficulty selection, show reading material
        document.getElementById('difficultySelection').style.display = 'none';
        document.getElementById('readingMaterialContainer').style.display = 'block';
        
        // Set reading material title
        document.getElementById('readingMaterialTitle').textContent = 
            `${levelData.title} - Reading Material`;
        
        // Format and display reading material
        const contentElement = document.getElementById('readingMaterialContent');
        const formattedContent = levelData.readingMaterial
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        contentElement.innerHTML = `<p>${formattedContent}</p>`;
        
        // Update stats
        document.getElementById('materialQuestions').textContent = levelData.questionsCount;
        
        const minutes = Math.floor(levelData.timeLimit / 60);
        const seconds = levelData.timeLimit % 60;
        document.getElementById('materialTime').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    function hideReadingMaterial() {
        document.getElementById('readingMaterialContainer').style.display = 'none';
        document.getElementById('difficultySelection').style.display = 'grid';
        currentLevel = null;
    }
    
    function startQuiz() {
        if (!quizData || !quizData.quizLevels[currentLevel]) {
            alert('Quiz data not loaded. Please refresh the page.');
            return;
        }
        
        const levelData = quizData.quizLevels[currentLevel];
        
        console.log('Starting quiz for level:', currentLevel);
        
        // Hide reading material, show quiz
        document.getElementById('readingMaterialContainer').style.display = 'none';
        document.getElementById('quizContainer').style.display = 'block';
        
        // Set quiz title
        document.getElementById('quizTitle').textContent = levelData.title;
        
        // Set total questions
        document.getElementById('totalQuestions').textContent = levelData.questionsCount;
        
        // Initialize quiz state
        currentQuestionIndex = 0;
        userAnswers = new Array(levelData.questions.length).fill(null);
        score = 0;
        
        // Set timer
        timeLeft = levelData.timeLimit;
        startTime = Date.now();
        updateTimerDisplay();
        startTimer();
        
        // Load first question
        loadQuestion();
    }
    
    function startTimer() {
        if (timer) clearInterval(timer);
        
        timer = setInterval(function() {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                endQuiz();
            }
        }, 1000);
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    function loadQuestion() {
        if (!quizData || !quizData.quizLevels[currentLevel]) return;
        
        const levelData = quizData.quizLevels[currentLevel];
        const question = levelData.questions[currentQuestionIndex];
        
        // Update question counter
        document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
        
        // Update progress bar
        const progress = ((currentQuestionIndex + 1) / levelData.questions.length) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
        
        // Set question text
        document.getElementById('questionText').textContent = question.question;
        
        // Create options
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            if (userAnswers[currentQuestionIndex] === index) {
                optionElement.classList.add('selected');
            }
            
            optionElement.innerHTML = `
                <div class="option-label">${String.fromCharCode(65 + index)}</div>
                <div class="option-text">${option}</div>
            `;
            
            optionElement.addEventListener('click', function() {
                // Deselect all options
                document.querySelectorAll('.option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Select clicked option
                this.classList.add('selected');
                
                // Store answer
                userAnswers[currentQuestionIndex] = index;
            });
            
            optionsContainer.appendChild(optionElement);
        });
        
        // Update navigation buttons
        document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
        
        // Change next button to submit if last question
        if (currentQuestionIndex === levelData.questions.length - 1) {
            document.getElementById('nextBtn').innerHTML = 'Submit Quiz <i class="fas fa-paper-plane"></i>';
            document.getElementById('nextBtn').onclick = endQuiz;
        } else {
            document.getElementById('nextBtn').innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
            document.getElementById('nextBtn').onclick = nextQuestion;
        }
    }
    
    function prevQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion();
        }
    }
    
    function nextQuestion() {
        if (!quizData || !quizData.quizLevels[currentLevel]) return;
        
        const levelData = quizData.quizLevels[currentLevel];
        
        if (currentQuestionIndex < levelData.questions.length - 1) {
            currentQuestionIndex++;
            loadQuestion();
        } else {
            endQuiz();
        }
    }
    
    function endQuiz() {
        clearInterval(timer);
        
        if (!quizData || !quizData.quizLevels[currentLevel]) return;
        
        const levelData = quizData.quizLevels[currentLevel];
        
        // Calculate score
        let correct = 0;
        let incorrect = 0;
        let skipped = 0;
        
        levelData.questions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            
            if (userAnswer === null) {
                skipped++;
            } else if (userAnswer === question.correctAnswer) {
                correct++;
            } else {
                incorrect++;
            }
        });
        
        score = Math.round((correct / levelData.questions.length) * 100);
        
        // Hide quiz, show results
        document.getElementById('quizContainer').style.display = 'none';
        document.getElementById('resultContainer').style.display = 'block';
        
        // Update result display
        document.getElementById('finalScore').textContent = `${score}%`;
        document.getElementById('correctAnswers').textContent = correct;
        document.getElementById('incorrectAnswers').textContent = incorrect;
        document.getElementById('skippedAnswers').textContent = skipped;
        
        // Calculate time taken
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(timeTaken / 60);
        const seconds = timeTaken % 60;
        document.getElementById('timeTaken').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Set feedback
        let feedback = '';
        let message = '';
        
        if (score >= 90) {
            feedback = 'Outstanding!';
            message = 'You have mastered this level!';
        } else if (score >= 70) {
            feedback = 'Great Job!';
            message = 'You have a solid understanding of the material.';
        } else if (score >= 50) {
            feedback = 'Good Effort!';
            message = 'You have a basic understanding but room for improvement.';
        } else {
            feedback = 'Keep Learning!';
            message = 'Review the material and try again.';
        }
        
        document.getElementById('resultFeedback').textContent = feedback;
        document.getElementById('resultMessage').textContent = message;
        
        // Update certificate preview
        document.getElementById('certDifficulty').textContent = 
            currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1);
        document.getElementById('certScore').textContent = `${score}%`;
    }
    
    function restartQuiz() {
        // Hide results and certificate, show difficulty selection
        document.getElementById('resultContainer').style.display = 'none';
        document.getElementById('certificatePreview').style.display = 'none';
        document.getElementById('difficultySelection').style.display = 'grid';
        document.getElementById('readingMaterialContainer').style.display = 'none';
        document.getElementById('quizContainer').style.display = 'none';
        
        // Reset variables
        currentLevel = null;
        currentQuestionIndex = 0;
        userAnswers = [];
        score = 0;
    }
    
    function shareResults() {
        const shareText = `I scored ${score}% on the GenLayer ${currentLevel} level quiz! Test your knowledge at GenLayer.`;
        const url = window.location.href;
        const hashtags = 'GenLayer,Quiz,AI,Blockchain';
        
        // Twitter/X share URL
        const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}&hashtags=${hashtags}`;
        
        // Open Twitter share in a new window
        window.open(twitterShareUrl, '_blank', 'width=550,height=420');
    }
    
    
    // Initialize the quiz app
    loadQuizData();
});
