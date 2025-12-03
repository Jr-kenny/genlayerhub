class QuizSystem {
    constructor() {
        this.difficulty = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.timeLimit = 900; // 15 minutes in seconds
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadQuizData();
    }

    bindEvents() {
        // Difficulty selection
        document.querySelectorAll('.difficulty-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectDifficulty(e.currentTarget.dataset.difficulty);
            });
        });

        // Quiz navigation
        document.getElementById('prevBtn').addEventListener('click', () => this.prevQuestion());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
        
        // Result actions
        document.getElementById('restartBtn').addEventListener('click', () => this.restartQuiz());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareResults());
        document.getElementById('certificateBtn').addEventListener('click', () => this.showCertificate());
        document.getElementById('downloadCertBtn').addEventListener('click', () => this.downloadCertificate());
    }

    async loadQuizData() {
        try {
            const response = await fetch('data/quiz.json');
            const data = await response.json();
            this.allQuestions = data;
        } catch (error) {
            console.error('Error loading quiz data:', error);
            this.allQuestions = this.getDefaultQuestions();
        }
    }

    selectDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.questions = this.getQuestionsByDifficulty(difficulty);
        this.userAnswers = new Array(this.questions.length).fill(null);
        
        // Update UI
        document.getElementById('difficultySelection').style.display = 'none';
        document.getElementById('quizContainer').style.display = 'block';
        document.getElementById('quizTitle').textContent = `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level Quiz`;
        document.getElementById('totalQuestions').textContent = this.questions.length;
        
        // Set time limit based on difficulty
        this.timeLimit = difficulty === 'easy' ? 900 : difficulty === 'medium' ? 1500 : 2100;
        
        // Start timer
        this.startTimer();
        
        // Load first question
        this.loadQuestion(0);
    }

    getQuestionsByDifficulty(difficulty) {
        const filtered = this.allQuestions.filter(q => q.difficulty === difficulty);
        return this.shuffleArray(filtered);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    loadQuestion(index) {
        this.currentQuestionIndex = index;
        const question = this.questions[index];
        
        // Update UI
        document.getElementById('questionText').textContent = question.question;
        document.getElementById('currentQuestion').textContent = index + 1;
        
        // Update progress
        const progress = ((index + 1) / this.questions.length) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
        
        // Clear options
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        
        // Add options
        question.options.forEach((option, i) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            if (this.userAnswers[index] === i) {
                optionElement.classList.add('selected');
            }
            
            optionElement.innerHTML = `
                <div class="option-label">${String.fromCharCode(65 + i)}</div>
                <div class="option-text">${option}</div>
            `;
            
            optionElement.addEventListener('click', () => this.selectOption(i));
            optionsContainer.appendChild(optionElement);
        });
        
        // Update navigation buttons
        document.getElementById('prevBtn').disabled = index === 0;
        document.getElementById('nextBtn').textContent = 
            index === this.questions.length - 1 ? 'Submit Quiz' : 'Next';
    }

    selectOption(optionIndex) {
        // Remove selected class from all options
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        document.querySelectorAll('.option')[optionIndex].classList.add('selected');
        
        // Save answer
        this.userAnswers[this.currentQuestionIndex] = optionIndex;
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.loadQuestion(this.currentQuestionIndex - 1);
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.loadQuestion(this.currentQuestionIndex + 1);
        } else {
            this.submitQuiz();
        }
    }

    startTimer() {
        this.startTime = Date.now();
        clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const remaining = this.timeLimit - elapsed;
            
            if (remaining <= 0) {
                clearInterval(this.timerInterval);
                this.submitQuiz();
                return;
            }
            
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            document.getElementById('timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    submitQuiz() {
        clearInterval(this.timerInterval);
        
        // Calculate score
        this.score = 0;
        this.questions.forEach((question, index) => {
            if (this.userAnswers[index] === question.correctAnswer) {
                this.score++;
            }
        });
        
        // Calculate percentage
        const percentage = (this.score / this.questions.length) * 100;
        
        // Calculate time taken
        const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(timeTaken / 60);
        const seconds = timeTaken % 60;
        
        // Show results
        this.showResults(percentage, timeTaken);
    }

    showResults(percentage, timeTaken) {
        document.getElementById('quizContainer').style.display = 'none';
        document.getElementById('resultContainer').style.display = 'block';
        
        // Update results
        document.getElementById('finalScore').textContent = `${percentage.toFixed(1)}%`;
        document.getElementById('correctAnswers').textContent = this.score;
        document.getElementById('incorrectAnswers').textContent = this.questions.length - this.score;
        document.getElementById('skippedAnswers').textContent = this.userAnswers.filter(a => a === null).length;
        document.getElementById('timeTaken').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Set feedback
        const feedback = this.getFeedback(percentage);
        document.getElementById('resultFeedback').textContent = feedback.message;
        document.getElementById('resultFeedback').style.color = feedback.color;
        document.getElementById('resultMessage').textContent = feedback.description;
        
        // Update certificate preview
        document.getElementById('certDifficulty').textContent = 
            this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
        document.getElementById('certScore').textContent = `${percentage.toFixed(1)}%`;
    }

    getFeedback(percentage) {
        if (percentage >= 90) {
            return {
                message: 'Perfect! 🎯',
                color: '#10b981',
                description: 'Excellent! You have mastered GenLayer concepts.'
            };
        } else if (percentage >= 70) {
            return {
                message: 'Great Job! 👍',
                color: '#3b82f6',
                description: 'Very good understanding of GenLayer technology.'
            };
        } else if (percentage >= 50) {
            return {
                message: 'Good Effort! 👏',
                color: '#f59e0b',
                description: 'You have a solid foundation. Keep learning!'
            };
        } else {
            return {
                message: 'Keep Learning! 📚',
                color: '#ef4444',
                description: 'Review the documentation and try again.'
            };
        }
    }

    restartQuiz() {
        // Reset quiz state
        this.currentQuestionIndex = 0;
        this.userAnswers = new Array(this.questions.length).fill(null);
        this.score = 0;
        
        // Show difficulty selection
        document.getElementById('resultContainer').style.display = 'none';
        document.getElementById('difficultySelection').style.display = 'grid';
        document.getElementById('certificatePreview').style.display = 'none';
    }

    shareResults() {
        const shareText = `I scored ${this.score}/${this.questions.length} on the GenLayer ${this.difficulty} level quiz! Test your knowledge: ${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'GenLayer Quiz Results',
                text: shareText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Results copied to clipboard!');
            });
        }
    }

    showCertificate() {
        document.getElementById('certificatePreview').style.display = 'block';
    }

    downloadCertificate() {
        // In a real implementation, this would generate a PDF
        alert('Certificate download feature would generate a PDF in production.');
    }

    getDefaultQuestions() {
        return [
            {
                difficulty: 'easy',
                question: 'What is GenLayer primarily designed for?',
                options: [
                    'AI-native blockchain operations',
                    'Traditional financial transactions',
                    'Social media applications',
                    'Gaming platforms'
                ],
                correctAnswer: 0
            },
            {
                difficulty: 'easy',
                question: 'What makes GenLayer different from traditional blockchains?',
                options: [
                    'Non-deterministic operations',
                    'Faster transaction speeds',
                    'Lower fees',
                    'More nodes'
                ],
                correctAnswer: 0
            },
            {
                difficulty: 'medium',
                question: 'How does GenLayer handle subjective decision-making?',
                options: [
                    'Through AI agent consensus',
                    'By human voting',
                    'Random selection',
                    'Centralized authority'
                ],
                correctAnswer: 0
            },
            {
                difficulty: 'hard',
                question: 'What is the role of the Learning Layer in GenLayer architecture?',
                options: [
                    'Continuous AI model improvement',
                    'Transaction validation',
                    'Network security',
                    'Storage management'
                ],
                correctAnswer: 0
            }
        ];
    }
}

// Initialize quiz when page loads
document.addEventListener('DOMContentLoaded', () => {
    const quiz = new QuizSystem();
});