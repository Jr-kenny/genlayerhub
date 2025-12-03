class JSONBinAPI {
    constructor() {
        // Replace these with your actual JSONBin configuration
        this.BIN_ID = '692f900443b1c97be9d3e8a4';
        this.API_KEY = '$2a$10$e277b.QC4g4NTiLvYTWmCO0el57oC0ZrmPZc14UMx6vQPem5dl4GW';
        this.BASE_URL = 'https://api.jsonbin.io/v3/b';
        this.HEADERS = {
            'Content-Type': 'application/json',
            'X-Master-Key': this.API_KEY
        };
    }

    isConfigured() {
        return !this.API_KEY.includes('your-api-key');
    }

    async getArticles() {
        try {
            const response = await fetch(`${this.BASE_URL}/${this.BIN_ID}/latest`, {
                headers: this.HEADERS
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.record.articles || [];
            
        } catch (error) {
            console.error('Error fetching articles:', error);
            throw error;
        }
    }

    async addArticle(article) {
        if (!this.isConfigured()) {
            console.warn('JSONBin not configured. Article saved locally only.');
            return Promise.resolve(); // Return resolved promise for local testing
        }
        
        try {
            // First, get current articles
            const currentArticles = await this.getArticles();
            
            // Add new article
            const updatedArticles = [article, ...currentArticles];
            
            // Update the bin
            const response = await fetch(`${this.BASE_URL}/${this.BIN_ID}`, {
                method: 'PUT',
                headers: this.HEADERS,
                body: JSON.stringify({ articles: updatedArticles })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Error adding article:', error);
            throw error;
        }
    }

    async updateArticle(articleId, updates) {
        if (!this.isConfigured()) {
            console.warn('JSONBin not configured. Update saved locally only.');
            return Promise.resolve(); // Return resolved promise for local testing
        }
        
        try {
            // Get current articles
            const currentArticles = await this.getArticles();
            
            // Find and update the article
            const updatedArticles = currentArticles.map(article => {
                if (article.id === articleId) {
                    return { ...article, ...updates };
                }
                return article;
            });
            
            // Update the bin
            const response = await fetch(`${this.BASE_URL}/${this.BIN_ID}`, {
                method: 'PUT',
                headers: this.HEADERS,
                body: JSON.stringify({ articles: updatedArticles })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Error updating article:', error);
            throw error;
        }
    }

    async deleteArticle(articleId) {
        if (!this.isConfigured()) {
            console.warn('JSONBin not configured. Article deleted locally only.');
            return Promise.resolve(); // Return resolved promise for local testing
        }
        
        try {
            // Get current articles
            const currentArticles = await this.getArticles();
            
            // Remove the article
            const updatedArticles = currentArticles.filter(article => article.id !== articleId);
            
            // Update the bin
            const response = await fetch(`${this.BASE_URL}/${this.BIN_ID}`, {
                method: 'PUT',
                headers: this.HEADERS,
                body: JSON.stringify({ articles: updatedArticles })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Error deleting article:', error);
            throw error;
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JSONBinAPI;
}