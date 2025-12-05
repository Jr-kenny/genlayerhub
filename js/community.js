class CommunityManager {
    constructor() {
        this.posts = [];
        this.displayedPosts = 5;
        this.apiClient = new JSONBinAPI();
        this.selectedImage = null;
        
        this.init();
    }

    async init() {
        this.bindEvents();
        this.removeLoadingState(); // Remove loading state immediately
        this.renderPosts();
    }

    bindEvents() {
        // Post form submission
        const postForm = document.getElementById('postForm');
        if (postForm) {
            postForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createPost();
            });
        }

        // Load more posts button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMorePosts();
            });
        }

        // Image attachment click
        const imageAttachment = document.querySelector('.post-attachment');
        if (imageAttachment) {
            imageAttachment.addEventListener('click', (e) => {
                this.triggerImageUpload();
            });
        }

        // Link attachment click
        const linkAttachment = document.querySelectorAll('.post-attachment')[1];
        if (linkAttachment) {
            linkAttachment.addEventListener('click', (e) => {
                this.addLink();
            });
        }

        // Code attachment click
        const codeAttachment = document.querySelectorAll('.post-attachment')[2];
        if (codeAttachment) {
            codeAttachment.addEventListener('click', (e) => {
                this.addCodeBlock();
            });
        }
    }

    removeLoadingState() {
        const loadingElement = document.getElementById('loadingPosts');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    triggerImageUpload() {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageUpload(file);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    handleImageUpload(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.selectedImage = {
                data: e.target.result,
                name: file.name,
                type: file.type
            };
            
            // Show preview or indication that image is selected
            const imageAttachment = document.querySelector('.post-attachment');
            if (imageAttachment) {
                imageAttachment.innerHTML = `
                    <i class="fas fa-image" style="color: var(--primary-color);"></i>
                    <span>${file.name.substring(0, 10)}...</span>
                `;
            }
            
            this.showSuccess('Image selected! It will be added to your post.');
        };
        
        reader.readAsDataURL(file);
    }

    addLink() {
        const url = prompt('Enter URL to share:');
        if (url) {
            const textarea = document.getElementById('postContent');
            if (textarea) {
                textarea.value += `\n${url}\n`;
                this.showSuccess('Link added to post!');
            }
        }
    }

    addCodeBlock() {
        const code = prompt('Enter your code:');
        if (code) {
            const textarea = document.getElementById('postContent');
            if (textarea) {
                textarea.value += `\n\`\`\`\n${code}\n\`\`\`\n`;
                this.showSuccess('Code block added to post!');
            }
        }
    }

    renderPosts() {
        const container = document.getElementById('postsContainer');
        if (!container) return;
        
        // Make sure loading state is hidden
        this.removeLoadingState();
        
        if (this.posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No posts yet. Be the first to share your thoughts!</p>
                </div>
            `;
            
            // Update load more button visibility
            this.updateLoadMoreButton();
            return;
        }

        const postsToShow = this.posts.slice(0, this.displayedPosts);
        
        container.innerHTML = postsToShow.map(post => `
            <div class="post-card" data-id="${post.id}">
                <div class="post-header">
                    <div class="post-avatar">${post.avatar || (post.author ? post.author.charAt(0) : '?')}</div>
                    <div class="post-info">
                        <div class="post-author">${post.author || 'Anonymous'}</div>
                        <div class="post-meta">
                            <span><i class="fas fa-clock"></i> ${post.timestamp || 'Just now'}</span>
                            <span><i class="fas fa-globe"></i> Public</span>
                        </div>
                    </div>
                </div>
                
                <div class="post-content">
                    ${post.image ? `<img src="${post.image}" alt="Post image" style="max-width: 100%; border-radius: var(--radius); margin-bottom: 1rem;">` : ''}
                    <div class="post-excerpt">${post.content || 'No content'}</div>
                </div>
                
                <div class="post-actions">
                    <button class="post-action-btn ${post.liked ? 'liked' : ''}" data-action="like" data-id="${post.id}">
                        <i class="fas fa-heart"></i>
                        <span class="like-count">${post.likes || 0}</span>
                    </button>
                    <button class="post-action-btn" data-action="comment" data-id="${post.id}">
                        <i class="fas fa-comment"></i>
                        <span>${post.comments || 0}</span>
                    </button>
                    <button class="post-action-btn" data-action="share" data-id="${post.id}">
                        <i class="fas fa-share"></i>
                        <span>${post.shares || 0}</span>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to new elements
        this.addPostEventListeners();
        
        // Update load more button visibility
        this.updateLoadMoreButton();
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

    updateLoadMoreButton() {
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        if (!loadMoreContainer || !loadMoreBtn) return;
        
        // Only show load more button if there are more posts to show
        if (this.displayedPosts < this.posts.length && this.posts.length > 0) {
            loadMoreContainer.classList.add('has-posts');
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreContainer.classList.remove('has-posts');
            loadMoreBtn.style.display = 'none';
        }
    }

    async createPost() {
        const postContent = document.getElementById('postContent');
        if (!postContent) return;
        
        const content = postContent.value.trim();
        
        if (!content) {
            this.showError('Please enter some content for your post');
            return;
        }
        
        try {
            const newPost = {
                id: Date.now().toString(),
                author: 'You', // In a real app, this would be the logged-in user
                avatar: 'ME',
                content: content,
                image: this.selectedImage ? this.selectedImage.data : null,
                likes: 0,
                comments: 0,
                shares: 0,
                timestamp: this.formatTimeAgo(new Date().toISOString()),
                liked: false
            };
            
            // Add to beginning of posts array
            this.posts.unshift(newPost);
            
            // Reset displayed posts counter
            this.displayedPosts = 5;
            
            // Clear form and reset image
            postContent.value = '';
            this.selectedImage = null;
            
            // Reset attachment button text
            const imageAttachment = document.querySelector('.post-attachment');
            if (imageAttachment) {
                imageAttachment.innerHTML = `
                    <i class="fas fa-image"></i>
                    <span>Image</span>
                `;
            }
            
            // Re-render posts
            this.renderPosts();
            
            // Show success message
            this.showSuccess('Post published successfully!');
            
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
            post.likes = (post.likes || 0) + 1;
        } else {
            post.likes = Math.max(0, (post.likes || 0) - 1);
        }
        
        // Update UI
        const likeBtn = document.querySelector(`[data-action="like"][data-id="${postId}"]`);
        if (likeBtn) {
            const likeCount = likeBtn.querySelector('.like-count');
            if (likeCount) {
                likeBtn.classList.toggle('liked', post.liked);
                likeCount.textContent = post.likes;
            }
        }
    }

    showComments(postId) {
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
                post.shares = (post.shares || 0) + 1;
                this.updatePostShares(postId, post.shares);
            });
        } else {
            navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
                post.shares = (post.shares || 0) + 1;
                this.updatePostShares(postId, post.shares);
                this.showSuccess('Post link copied to clipboard!');
            });
        }
    }

    updatePostShares(postId, shares) {
        const shareBtn = document.querySelector(`[data-action="share"][data-id="${postId}"]`);
        if (shareBtn) {
            const shareCount = shareBtn.querySelector('span');
            if (shareCount) {
                shareCount.textContent = shares;
            }
        }
    }

    loadMorePosts() {
        this.displayedPosts += 5;
        this.renderPosts();
        this.updateLoadMoreButton();
    }

    formatTimeAgo(timestamp) {
        try {
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
        } catch (error) {
            return 'Just now';
        }
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
        if (communitySection) {
            communitySection.insertBefore(errorDiv, communitySection.firstChild);
            
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
        
        // Insert at top of community section
        const communitySection = document.querySelector('.community-section .container');
        if (communitySection) {
            communitySection.insertBefore(successDiv, communitySection.firstChild);
            
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
    const communityManager = new CommunityManager();
});