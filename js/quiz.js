// Quiz Application
class QuizApp {
    constructor() {
        this.quizData = null;
        this.currentLevel = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
        this.timer = null;
        this.timeLeft = 0;
        this.startTime = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Load quiz data from JSON
            const response = await fetch('/data/quiz.json');
            this.quizData = await response.json();
            
            // Set up event listeners
            this.setupEventListeners();
        } catch (error) {
            console.error('Error loading quiz data:', error);
            alert('Failed to load quiz data. Please try again later.');
        }
    }
    
    setupEventListeners() {
        // Difficulty selection
        document.querySelectorAll('.difficulty-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.showReadingMaterial(e.currentTarget.dataset.difficulty);
            });
        });
        
        // Back to levels button
        document.getElementById('backToLevelsBtn').addEventListener('click', () => {
            this.hideReadingMaterial();
        });
        
        // Start quiz button
        document.getElementById('startQuizBtn').addEventListener('click', () => {
            this.startQuiz();
        });
        
        // Quiz navigation
        document.getElementById('prevBtn').addEventListener('click', () => this.prevQuestion());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
        
        // Restart quiz
        document.getElementById('restartBtn').addEventListener('click', () => this.restartQuiz());
        
        // Share results
        document.getElementById('shareBtn').addEventListener('click', () => this.shareResults());
        
        // Certificate
        document.getElementById('certificateBtn').addEventListener('click', () => this.showCertificate());
        document.getElementById('downloadCertBtn').addEventListener('click', () => this.downloadCertificate());
    }
    
    showReadingMaterial(level) {
        this.currentLevel = level;
        const levelData = this.quizData.quizLevels[level];
        
        if (!levelData) {
            alert('Quiz data not found for this level.');
            return;
        }
        
        // Hide difficulty selection, show reading material
        document.getElementById('difficultySelection').style.display = 'none';
        document.getElementById('readingMaterialContainer').style.display = 'block';
        
        // Set reading material title
        document.getElementById('readingMaterialTitle').textContent = `${levelData.title} - Reading Material`;
        
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
    
    hideReadingMaterial() {
        document.getElementById('readingMaterialContainer').style.display = 'none';
        document.getElementById('difficultySelection').style.display = 'grid';
        this.currentLevel = null;
    }
    
    startQuiz() {
        const levelData = this.quizData.quizLevels[this.currentLevel];
        
        // Hide reading material, show quiz
        document.getElementById('readingMaterialContainer').style.display = 'none';
        document.getElementById('quizContainer').style.display = 'block';
        
        // Set quiz title
        document.getElementById('quizTitle').textContent = levelData.title;
        
        // Set total questions
        document.getElementById('totalQuestions').textContent = levelData.questionsCount;
        
        // Initialize quiz state
        this.currentQuestionIndex = 0;
        this.userAnswers = new Array(levelData.questions.length).fill(null);
        this.score = 0;
        
        // Set timer
        this.timeLeft = levelData.timeLimit; // seconds
        this.startTime = Date.now();
        this.updateTimerDisplay();
        this.startTimer();
        
        // Load first question
        this.loadQuestion();
    }
    
    // ... rest of your existing methods (startTimer, updateTimerDisplay, loadQuestion, etc.)
    // These remain exactly the same as before
    startTimer() {
        if (this.timer) clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.endQuiz();
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    loadQuestion() {
        const levelData = this.quizData.quizLevels[this.currentLevel];
        const question = levelData.questions[this.currentQuestionIndex];
        
        // Update question counter
        document.getElementById('currentQuestion').textContent = this.currentQuestionIndex + 1;
        
        // Update progress bar
        const progress = ((this.currentQuestionIndex + 1) / levelData.questions.length) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
        
        // Set question text
        document.getElementById('questionText').textContent = question.question;
        
        // Create options
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            if (this.userAnswers[this.currentQuestionIndex] === index) {
                optionElement.classList.add('selected');
            }
            optionElement.dataset.index = index;
            
            optionElement.innerHTML = `
                <div class="option-label">${String.fromCharCode(65 + index)}</div>
                <div class="option-text">${option}</div>
            `;
            
            optionElement.addEventListener('click', () => this.selectOption(index));
            optionsContainer.appendChild(optionElement);
        });
        
        // Update navigation buttons
        document.getElementById('prevBtn').disabled = this.currentQuestionIndex === 0;
        document.getElementById('nextBtn').textContent = 
            this.currentQuestionIndex === levelData.questions.length - 1 ? 
            'Submit Quiz' : 
            'Next';
    }
    
    selectOption(optionIndex) {
        // Deselect all options
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Select clicked option
        event.currentTarget.classList.add('selected');
        
        // Store answer
        this.userAnswers[this.currentQuestionIndex] = optionIndex;
    }
    
    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.loadQuestion();
        }
    }
    
    nextQuestion() {
        const levelData = this.quizData.quizLevels[this.currentLevel];
        
        // If no answer selected, skip
        if (this.userAnswers[this.currentQuestionIndex] === null) {
            // You can add a warning here if you want
        }
        
        if (this.currentQuestionIndex < levelData.questions.length - 1) {
            this.currentQuestionIndex++;
            this.loadQuestion();
        } else {
            this.endQuiz();
        }
    }
    
    endQuiz() {
        clearInterval(this.timer);
        
        // Calculate score
        const levelData = this.quizData.quizLevels[this.currentLevel];
        let correct = 0;
        let incorrect = 0;
        let skipped = 0;
        
        levelData.questions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            
            if (userAnswer === null) {
                skipped++;
            } else if (userAnswer === question.correctAnswer) {
                correct++;
            } else {
                incorrect++;
            }
        });
        
        this.score = Math.round((correct / levelData.questions.length) * 100);
        
        // Hide quiz, show results
        document.getElementById('quizContainer').style.display = 'none';
        document.getElementById('resultContainer').style.display = 'block';
        
        // Update result display
        document.getElementById('finalScore').textContent = `${this.score}%`;
        document.getElementById('correctAnswers').textContent = correct;
        document.getElementById('incorrectAnswers').textContent = incorrect;
        document.getElementById('skippedAnswers').textContent = skipped;
        
        // Calculate time taken
        const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(timeTaken / 60);
        const seconds = timeTaken % 60;
        document.getElementById('timeTaken').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Set feedback
        let feedback = '';
        let message = '';
        
        if (this.score >= 90) {
            feedback = 'Outstanding!';
            message = 'You have mastered this level!';
        } else if (this.score >= 70) {
            feedback = 'Great Job!';
            message = 'You have a solid understanding of the material.';
        } else if (this.score >= 50) {
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
            this.currentLevel.charAt(0).toUpperCase() + this.currentLevel.slice(1);
        document.getElementById('certScore').textContent = `${this.score}%`;
    }
    
    restartQuiz() {
        // Hide results and certificate, show difficulty selection
        document.getElementById('resultContainer').style.display = 'none';
        document.getElementById('certificatePreview').style.display = 'none';
        document.getElementById('difficultySelection').style.display = 'grid';
        document.getElementById('readingMaterialContainer').style.display = 'none';
        document.getElementById('quizContainer').style.display = 'none';
    }
    
    shareResults() {
        const levelData = this.quizData.quizLevels[this.currentLevel];
        const shareText = `I scored ${this.score}% on the GenLayer ${this.currentLevel} level quiz! Test your knowledge at GenLayer.`;
        
        if (navigator.share) {
            navigator.share({
                title: 'GenLayer Quiz Results',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Results copied to clipboard!');
            });
        }
    }
    
    showCertificate() {
        const certificate = document.getElementById('certificatePreview');
        certificate.style.display = certificate.style.display === 'none' ? 'block' : 'none';
    }
    
    downloadCertificate() {
        // In a real implementation, you would generate a PDF here
        // For now, we'll just show an alert
        alert('Certificate download would be implemented here. In a production app, this would generate a PDF with your name, score, and completion date.');
    }
}

// Initialize quiz when page loads
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});