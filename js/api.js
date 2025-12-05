class JSONBinAPI {
    constructor() {
        this.BIN_ID = window.CONFIG?.JSONBIN_BIN_ID || '';
        this.API_KEY = window.CONFIG?.JSONBIN_API_KEY || '';
        this.BASE_URL = 'https://api.jsonbin.io/v3/b';
        this.HEADERS = {
            'Content-Type': 'application/json',
            'X-Master-Key': this.API_KEY
        };
    }

    isConfigured() {
        // Only return true if both BIN_ID and API_KEY are set
        return this.BIN_ID && this.API_KEY && 
               this.BIN_ID.length > 0 && 
               this.API_KEY.length > 0;
    }

    async getArticles() {
        if (!this.isConfigured()) {
            console.warn('JSONBin not configured. Returning empty array.');
            return [];
        }
        
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
            return [];
        }
    }

    async addArticle(article) {
        if (!this.isConfigured()) {
            console.warn('JSONBin not configured. Article saved locally only.');
            return Promise.resolve();
        }
        
        try {
            const currentArticles = await this.getArticles();
            const updatedArticles = [article, ...currentArticles];
            
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
            return Promise.resolve();
        }
        
        try {
            const currentArticles = await this.getArticles();
            const updatedArticles = currentArticles.map(article => {
                if (article.id === articleId) {
                    return { ...article, ...updates };
                }
                return article;
            });
            
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
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JSONBinAPI;
}