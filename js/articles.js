class ArticlesManager {
    constructor() {
        this.articles = [];
        this.filteredArticles = [];
        this.currentFilter = 'all';
        this.apiClient = new JSONBinAPI();
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadArticles();
        this.renderArticles();
        
        // Show setup instructions if no API key configured
        if (!this.apiClient.isConfigured()) {
            this.showSetupInstructions();
        }
    }

    bindEvents() {
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterArticles(e.target.value);
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Form submission
        document.getElementById('articleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitArticle();
        });

        // Modal close
        document.getElementById('modalClose').addEventListener('click', () => {
            this.closeModal();
        });

        // Preview button
        document.getElementById('previewBtn').addEventListener('click', () => {
            this.previewArticle();
        });

        // Close modal on outside click
        document.getElementById('articleModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });
    }

    async loadArticles() {
        try {
            this.articles = await this.apiClient.getArticles();
            this.filteredArticles = [...this.articles];
        } catch (error) {
            console.error('Error loading articles:', error);
            this.showError('Failed to load articles. Using sample data.');
            this.loadSampleArticles();
        }
    }

    renderArticles() {
        const grid = document.getElementById('articlesGrid');
        
        if (this.filteredArticles.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <p>No articles found. Be the first to submit one!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.filteredArticles.map(article => `
            <div class="article-card" data-id="${article.id}">
                <div class="article-image">
                    <i class="fas fa-${this.getCategoryIcon(article.category)}"></i>
                </div>
                <div class="article-content">
                    <div class="article-meta">
                        <div class="article-author">
                            <i class="fas fa-user"></i>
                            <span>${article.author}</span>
                        </div>
                        <div class="article-date">
                            <i class="fas fa-calendar"></i>
                            <span>${this.formatDate(article.date)}</span>
                        </div>
                    </div>
                    <h3 class="article-title">${article.title}</h3>
                    <p class="article-excerpt">${article.excerpt || article.content.substring(0, 150) + '...'}</p>
                    <div class="article-actions">
                        <button class="like-btn ${article.liked ? 'liked' : ''}" data-id="${article.id}">
                            <i class="fas fa-heart"></i>
                            <span class="like-count">${article.likes || 0}</span>
                        </button>
                        <button class="view-btn" data-id="${article.id}">
                            <i class="fas fa-eye"></i> View Article
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners to new elements
        this.addArticleEventListeners();
    }

    addArticleEventListeners() {
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const articleId = btn.dataset.id;
                await this.likeArticle(articleId);
            });
        });

        // View buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const articleId = btn.dataset.id;
                this.viewArticle(articleId);
            });
        });

        // Card click
        document.querySelectorAll('.article-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.article-actions')) {
                    const articleId = card.dataset.id;
                    this.viewArticle(articleId);
                }
            });
        });
    }

    getCategoryIcon(category) {
        const icons = {
            technical: 'microchip',
            tutorial: 'graduation-cap',
            news: 'newspaper',
            research: 'flask'
        };
        return icons[category] || 'file-alt';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    filterArticles(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            this.filteredArticles = [...this.articles];
        } else {
            this.filteredArticles = this.articles.filter(article => 
                article.title.toLowerCase().includes(term) ||
                article.author.toLowerCase().includes(term) ||
                article.content.toLowerCase().includes(term) ||
                article.category.toLowerCase().includes(term)
            );
        }
        
        this.renderArticles();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        if (filter === 'all') {
            this.filteredArticles = [...this.articles];
        } else {
            this.filteredArticles = this.articles.filter(article => 
                article.category === filter
            );
        }
        
        this.renderArticles();
    }

    async likeArticle(articleId) {
        try {
            const article = this.articles.find(a => a.id === articleId);
            if (!article) return;
            
            article.likes = (article.likes || 0) + 1;
            article.liked = !article.liked;
            
            if (article.liked) {
                article.likes++;
            } else {
                article.likes = Math.max(0, article.likes - 1);
            }
            
            // Update UI
            const likeBtn = document.querySelector(`.like-btn[data-id="${articleId}"]`);
            const likeCount = likeBtn.querySelector('.like-count');
            
            likeBtn.classList.toggle('liked', article.liked);
            likeCount.textContent = article.likes;
            
            // Update in API
            await this.apiClient.updateArticle(articleId, {
                likes: article.likes
            });
            
        } catch (error) {
            console.error('Error liking article:', error);
            this.showError('Failed to update like');
        }
    }

    viewArticle(articleId) {
        const article = this.articles.find(a => a.id === articleId);
        if (!article) return;
        
        // Update modal content
        document.getElementById('modalTitle').textContent = article.title;
        
        document.getElementById('modalMeta').innerHTML = `
            <div class="article-meta">
                <div class="article-author">
                    <i class="fas fa-user"></i>
                    <span>${article.author}</span>
                </div>
                <div class="article-date">
                    <i class="fas fa-calendar"></i>
                    <span>${this.formatDate(article.date)}</span>
                </div>
                <div class="article-category">
                    <i class="fas fa-tag"></i>
                    <span>${article.category}</span>
                </div>
                <div class="article-likes">
                    <i class="fas fa-heart"></i>
                    <span>${article.likes || 0} likes</span>
                </div>
            </div>
        `;
        
        document.getElementById('modalContent').innerHTML = `
            <div class="article-content-full">
                ${article.content.split('\n').map(p => `<p>${p}</p>`).join('')}
            </div>
        `;
        
        // Show modal
        document.getElementById('articleModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('articleModal').classList.remove('active');
        document.body.style.overflow = '';
    }

    async submitArticle() {
        const title = document.getElementById('articleTitle').value.trim();
        const author = document.getElementById('articleAuthor').value.trim();
        const category = document.getElementById('articleCategory').value;
        const content = document.getElementById('articleContent').value.trim();
        const excerpt = document.getElementById('articleExcerpt').value.trim();
        
        // Validation
        if (!title || !author || !category || !content) {
            this.showError('Please fill in all required fields');
            return;
        }
        
        try {
            const newArticle = {
                id: Date.now().toString(),
                title,
                author,
                category,
                content,
                excerpt: excerpt || content.substring(0, 150) + '...',
                date: new Date().toISOString(),
                likes: 0,
                liked: false
            };
            
            // Add to local array
            this.articles.unshift(newArticle);
            this.filteredArticles.unshift(newArticle);
            
            // Save to API
            await this.apiClient.addArticle(newArticle);
            
            // Reset form
            document.getElementById('articleForm').reset();
            
            // Update UI
            this.renderArticles();
            
            // Show success message
            this.showSuccess('Article submitted successfully!');
            
        } catch (error) {
            console.error('Error submitting article:', error);
            this.showError('Failed to submit article');
        }
    }

    previewArticle() {
        const title = document.getElementById('articleTitle').value.trim();
        const author = document.getElementById('articleAuthor').value.trim();
        const content = document.getElementById('articleContent').value.trim();
        
        if (!title || !author || !content) {
            this.showError('Please fill in title, author, and content to preview');
            return;
        }
        
        // Show preview in modal
        document.getElementById('modalTitle').textContent = title;
        
        document.getElementById('modalMeta').innerHTML = `
            <div class="article-meta">
                <div class="article-author">
                    <i class="fas fa-user"></i>
                    <span>${author}</span>
                </div>
                <div class="article-date">
                    <i class="fas fa-calendar"></i>
                    <span>Preview</span>
                </div>
            </div>
        `;
        
        document.getElementById('modalContent').innerHTML = `
            <div class="article-content-full">
                ${content.split('\n').map(p => `<p>${p}</p>`).join('')}
            </div>
        `;
        
        document.getElementById('articleModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    loadSampleArticles() {
        this.articles = [
            {
                id: '1',
                title: 'Understanding GenLayer Architecture',
                author: 'Alex Chen',
                category: 'technical',
                content: 'GenLayer introduces a revolutionary three-layer architecture that enables AI-native blockchain operations...',
                excerpt: 'Deep dive into the technical architecture of GenLayer and how it enables AI-native blockchain operations.',
                date: '2024-01-15',
                likes: 42,
                liked: false
            },
            {
                id: '2',
                title: 'Getting Started with Intelligent Contracts',
                author: 'Maria Rodriguez',
                category: 'tutorial',
                content: 'Learn how to write and deploy your first intelligent contract on GenLayer...',
                excerpt: 'Step-by-step tutorial on creating and deploying intelligent contracts.',
                date: '2024-01-10',
                likes: 28,
                liked: false
            }
        ];
        this.filteredArticles = [...this.articles];
    }

    showSetupInstructions() {
        const setupDiv = document.getElementById('jsonbinSetup');
        const sampleData = document.getElementById('sampleData');
        
        const sampleStructure = {
            articles: [
                {
                    id: "unique-id",
                    title: "Article Title",
                    author: "Author Name",
                    category: "technical",
                    content: "Full article content...",
                    excerpt: "Brief excerpt...",
                    date: "2024-01-01T00:00:00.000Z",
                    likes: 0,
                    liked: false
                }
            ]
        };
        
        sampleData.textContent = JSON.stringify(sampleStructure, null, 2);
        setupDiv.style.display = 'block';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div style="background: rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); 
                       color:#ef4444; padding:1rem; border-radius:var(--radius); margin:1rem 0;">
                <i class="fas fa-exclamation-circle"></i> ${message}
            </div>
        `;
        
        // Insert at top of articles section
        const articlesSection = document.querySelector('.articles-section .container');
        articlesSection.insertBefore(errorDiv, articlesSection.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <div style="background: rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); 
                       color:#10b981; padding:1rem; border-radius:var(--radius); margin:1rem 0;">
                <i class="fas fa-check-circle"></i> ${message}
            </div>
        `;
        
        // Insert at top of articles section
        const articlesSection = document.querySelector('.articles-section .container');
        articlesSection.insertBefore(successDiv, articlesSection.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => successDiv.remove(), 5000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const articlesManager = new ArticlesManager();
});