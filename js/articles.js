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
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterArticles(e.target.value);
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Form submission
        const articleForm = document.getElementById('articleForm');
        if (articleForm) {
            articleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitArticle();
            });
        }

        // Modal close
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Preview button
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.previewArticle();
            });
        }

        // Close modal on outside click
        const articleModal = document.getElementById('articleModal');
        if (articleModal) {
            articleModal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.closeModal();
                }
            });
        }
    }

    async loadArticles() {
        try {
            // Remove loading state immediately
            this.removeLoadingState();
            
            // ONLY load from JSONBin if configured
            if (this.apiClient.isConfigured()) {
                this.articles = await this.apiClient.getArticles();
            } else {
                // Empty array if not configured
                this.articles = [];
            }
            
            this.filteredArticles = [...this.articles];
            
        } catch (error) {
            console.error('Error loading articles:', error);
            // Empty arrays on error
            this.articles = [];
            this.filteredArticles = [];
            this.removeLoadingState();
        }
    }

    removeLoadingState() {
        const loadingElement = document.getElementById('loadingState');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    renderArticles() {
        const grid = document.getElementById('articlesGrid');
        if (!grid) return;
        
        // Make sure loading state is hidden
        this.removeLoadingState();
        
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
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }

    filterArticles(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            this.filteredArticles = [...this.articles];
        } else {
            this.filteredArticles = this.articles.filter(article => {
                if (!article || typeof article !== 'object') return false;
                
                return (
                    (article.title && article.title.toLowerCase().includes(term)) ||
                    (article.author && article.author.toLowerCase().includes(term)) ||
                    (article.content && article.content.toLowerCase().includes(term)) ||
                    (article.category && article.category.toLowerCase().includes(term))
                );
            });
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
                article && article.category === filter
            );
        }
        
        this.renderArticles();
    }

    async likeArticle(articleId) {
        try {
            const article = this.articles.find(a => a.id === articleId);
            if (!article) return;
            
            article.liked = !article.liked;
            
            if (article.liked) {
                article.likes = (article.likes || 0) + 1;
            } else {
                article.likes = Math.max(0, (article.likes || 0) - 1);
            }
            
            // Update UI
            const likeBtn = document.querySelector(`.like-btn[data-id="${articleId}"]`);
            if (likeBtn) {
                const likeCount = likeBtn.querySelector('.like-count');
                if (likeCount) {
                    likeBtn.classList.toggle('liked', article.liked);
                    likeCount.textContent = article.likes;
                }
            }
            
            // Update in API
            if (this.apiClient.isConfigured()) {
                await this.apiClient.updateArticle(articleId, {
                    likes: article.likes,
                    liked: article.liked
                });
            }
            
        } catch (error) {
            console.error('Error liking article:', error);
            this.showError('Failed to update like');
        }
    }

    viewArticle(articleId) {
        const article = this.articles.find(a => a.id === articleId);
        if (!article) return;
        
        const modal = document.getElementById('articleModal');
        if (!modal) return;
        
        // Update modal content
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = article.title || 'No Title';
        
        const modalMeta = document.getElementById('modalMeta');
        if (modalMeta) {
            modalMeta.innerHTML = `
                <div class="article-meta">
                    <div class="article-author">
                        <i class="fas fa-user"></i>
                        <span>${article.author || 'Unknown Author'}</span>
                    </div>
                    <div class="article-date">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatDate(article.date)}</span>
                    </div>
                    ${article.category ? `
                    <div class="article-category">
                        <i class="fas fa-tag"></i>
                        <span>${article.category}</span>
                    </div>
                    ` : ''}
                    <div class="article-likes">
                        <i class="fas fa-heart"></i>
                        <span>${article.likes || 0} likes</span>
                    </div>
                </div>
            `;
        }
        
        const modalContent = document.getElementById('modalContent');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="article-content-full">
                    ${article.content ? article.content.split('\n').map(p => `<p>${p}</p>`).join('') : 'No content available.'}
                </div>
            `;
        }
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('articleModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    async submitArticle() {
        const title = document.getElementById('articleTitle')?.value.trim();
        const author = document.getElementById('articleAuthor')?.value.trim();
        const category = document.getElementById('articleCategory')?.value;
        const content = document.getElementById('articleContent')?.value.trim();
        const excerpt = document.getElementById('articleExcerpt')?.value.trim();
        
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
            
            // Save to API only if configured
            if (this.apiClient.isConfigured()) {
                await this.apiClient.addArticle(newArticle);
            }
            
            // Reset form
            const articleForm = document.getElementById('articleForm');
            if (articleForm) articleForm.reset();
            
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
        const title = document.getElementById('articleTitle')?.value.trim();
        const author = document.getElementById('articleAuthor')?.value.trim();
        const content = document.getElementById('articleContent')?.value.trim();
        
        if (!title || !author || !content) {
            this.showError('Please fill in title, author, and content to preview');
            return;
        }
        
        const modal = document.getElementById('articleModal');
        if (!modal) return;
        
        // Show preview in modal
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = title;
        
        const modalMeta = document.getElementById('modalMeta');
        if (modalMeta) {
            modalMeta.innerHTML = `
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
        }
        
        const modalContent = document.getElementById('modalContent');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="article-content-full">
                    ${content.split('\n').map(p => `<p>${p}</p>`).join('')}
                </div>
            `;
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    showSetupInstructions() {
        const setupDiv = document.getElementById('jsonbinSetup');
        const sampleData = document.getElementById('sampleData');
        
        if (!setupDiv || !sampleData) return;
        
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
        if (articlesSection) {
            articlesSection.insertBefore(errorDiv, articlesSection.firstChild);
            
            // Remove after 5 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }
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
        if (articlesSection) {
            articlesSection.insertBefore(successDiv, articlesSection.firstChild);
            
            // Remove after 5 seconds
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 5000);
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const articlesManager = new ArticlesManager();
});