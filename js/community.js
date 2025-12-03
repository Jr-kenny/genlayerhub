class CommunityManager {
    constructor() {
        this.posts = [];
        this.displayedPosts = 5;
        this.apiClient = new JSONBinAPI();
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadPosts();
        this.renderPosts();
        this.updateStats();
    }

    bindEvents() {
        // Post form submission
        document.getElementById('postForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createPost();
        });

        // Load more posts
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMorePosts();
        });
    }

    async loadPosts() {
        try {
            // In a real implementation, this would fetch from JSONBin
            // For now, use sample data
            this.posts = []; // Start with no posts
            this.renderPosts();
            
        } catch (error) {
            console.error('Error loading posts:', error);
            this.posts = this.getSamplePosts();
            this.renderPosts();
        }
    }

    renderPosts() {
        const container = document.getElementById('postsContainer');
        
        if (this.posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No posts yet. Be the first to share your thoughts!</p>
                </div>
            `;
            return;
        }

        const postsToShow = this.posts.slice(0, this.displayedPosts);
        
        container.innerHTML = postsToShow.map(post => `
            <div class="post-card" data-id="${post.id}">
                <div class="post-header">
                    <div class="post-avatar">${post.avatar}</div>
                    <div class="post-info">
                        <div class="post-author">${post.author}</div>
                        <div class="post-meta">
                            <span><i class="fas fa-clock"></i> ${this.formatTimeAgo(post.timestamp)}</span>
                            <span><i class="fas fa-globe"></i> Public</span>
                        </div>
                    </div>
                </div>
                
                <div class="post-content">
                    <div class="post-excerpt">${post.content}</div>
                </div>
                
                <div class="post-actions">
                    <button class="post-action-btn ${post.liked ? 'liked' : ''}" data-action="like" data-id="${post.id}">
                        <i class="fas fa-heart"></i>
                        <span class="like-count">${post.likes}</span>
                    </button>
                    <button class="post-action-btn" data-action="comment" data-id="${post.id}">
                        <i class="fas fa-comment"></i>
                        <span>${post.comments}</span>
                    </button>
                    <button class="post-action-btn" data-action="share" data-id="${post.id}">
                        <i class="fas fa-share"></i>
                        <span>${post.shares}</span>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        this.addPostEventListeners();
    }

    addPostEventListeners() {
        // Like buttons
        document.querySelectorAll('[data-action="like"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = btn.dataset.id;
                this.likePost(postId);
            });
        });

        // Comment buttons
        document.querySelectorAll('[data-action="comment"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = btn.dataset.id;
                this.showComments(postId);
            });
        });

        // Share buttons
        document.querySelectorAll('[data-action="share"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = btn.dataset.id;
                this.sharePost(postId);
            });
        });
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const postDate = new Date(timestamp);
        const diffInSeconds = Math.floor((now - postDate) / 1000);
        
        if (diffInSeconds < 60) {
            return 'just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else {
            return postDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    }

    async createPost() {
        const content = document.getElementById('postContent').value.trim();
        
        if (!content) {
            this.showError('Please enter some content for your post');
            return;
        }
        
        try {
            const newPost = {
                id: Date.now().toString(),
                author: 'You', // In a real app, this would be the logged-in user
                avatar: 'ME',
                content,
                likes: 0,
                comments: 0,
                shares: 0,
                timestamp: new Date().toISOString(),
                liked: false
            };
            
            // Add to beginning of posts array
            this.posts.unshift(newPost);
            
            // Clear form
            document.getElementById('postContent').value = '';
            
            // Re-render posts
            this.renderPosts();
            
            // Update stats
            this.updateStats();
            
            // Show success message
            this.showSuccess('Post published successfully!');
            
            // In a real implementation, save to JSONBin
            // await this.apiClient.addPost(newPost);
            
        } catch (error) {
            console.error('Error creating post:', error);
            this.showError('Failed to create post');
        }
    }

    likePost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;
        
        post.liked = !post.liked;
        
        if (post.liked) {
            post.likes++;
        } else {
            post.likes = Math.max(0, post.likes - 1);
        }
        
        // Update UI
        const likeBtn = document.querySelector(`[data-action="like"][data-id="${postId}"]`);
        const likeCount = likeBtn.querySelector('.like-count');
        
        likeBtn.classList.toggle('liked', post.liked);
        likeCount.textContent = post.likes;
        
        // In a real implementation, update in JSONBin
        // await this.apiClient.updatePost(postId, { likes: post.likes, liked: post.liked });
    }

    showComments(postId) {
        // In a real implementation, this would show a comments modal
        alert('Comments feature would be implemented with a modal showing all comments for this post.');
    }

    sharePost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;
        
        const shareText = `Check out this GenLayer community post: "${post.content.substring(0, 100)}..."`;
        const shareUrl = `${window.location.href}#post-${postId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'GenLayer Community Post',
                text: shareText,
                url: shareUrl
            }).then(() => {
                post.shares++;
                this.updatePostShares(postId, post.shares);
            });
        } else {
            navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
                post.shares++;
                this.updatePostShares(postId, post.shares);
                this.showSuccess('Post link copied to clipboard!');
            });
        }
    }

    updatePostShares(postId, shares) {
        const shareBtn = document.querySelector(`[data-action="share"][data-id="${postId}"]`);
        if (shareBtn) {
            shareBtn.querySelector('span').textContent = shares;
        }
    }

    loadMorePosts() {
        this.displayedPosts += 5;
        this.renderPosts();
        
        // Hide load more button if all posts are shown
        if (this.displayedPosts >= this.posts.length) {
            document.getElementById('loadMoreBtn').style.display = 'none';
        }
    }

    updateStats() {
        // Update statistics
        document.getElementById('totalMembers').textContent = '1,247';
        document.getElementById('totalPosts').textContent = this.posts.length;
        document.getElementById('onlineNow').textContent = Math.floor(Math.random() * 50) + 50; // Random number 50-100
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
        
        // Insert at top of community section
        const communitySection = document.querySelector('.community-section .container');
        communitySection.insertBefore(errorDiv, communitySection.firstChild);
        
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
        
        // Insert at top of community section
        const communitySection = document.querySelector('.community-section .container');
        communitySection.insertBefore(successDiv, communitySection.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => successDiv.remove(), 5000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const communityManager = new CommunityManager();
});