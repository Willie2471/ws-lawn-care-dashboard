/**
 * WS Lawn Care - Google Sheets Integration
 * This script connects your dashboard to live Tiller HQ data
 */

const SPREADSHEET_ID = '1fFbsuDFXu_W4MK234vNwM-WsEHkcDp6N1Tn_ZRe_J1I';
const API_KEY = 'YOUR_GOOGLE_API_KEY_HERE'; // Get from Google Cloud Console

class TillerDataConnector {
    constructor() {
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    }
    
    /**
     * Fetch data from Transactions sheet
     */
    async getTransactions() {
        try {
            const range = 'Transactions!A:R'; // All columns
            const url = `${this.baseUrl}/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.values) {
                throw new Error('No data found in Transactions sheet');
            }
            
            // Parse rows into transaction objects
            const headers = data.values[0];
            const transactions = [];
            
            for (let i = 1; i < data.values.length; i++) {
                const row = data.values[i];
                const transaction = {
                    date: row[0] || '',
                    description: row[1] || '',
                    category: row[2] || '',
                    amount: this.parseAmount(row[3]),
                    account: row[4] || '',
                    accountNum: row[5] || '',
                    note: row[6] || '',
                    jobName: row[7] || '',
                    institution: row[8] || '',
                    month: row[9] || '',
                    week: row[10] || '',
                    transactionId: row[11] || ''
                };
                
                transactions.push(transaction);
            }
            
            console.log(`Loaded ${transactions.length} transactions`);
            return transactions;
            
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    }
    
    /**
     * Fetch categorization data from fixed/variable sheet
     */
    async getCategorization() {
        try {
            const range = 'fixed/variable!A:H';
            const url = `${this.baseUrl}/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.values) {
                throw new Error('No data found in fixed/variable sheet');
            }
            
            const categorization = {};
            
            // Skip header row
            for (let i = 1; i < data.values.length; i++) {
                const row = data.values[i];
                const category = row[0];
                
                if (category) {
                    categorization[category] = {
                        group: row[1] || 'Unknown',
                        type: row[2] || 'Expense',
                        costType: row[3] || 'Unknown',
                        balance: row[7] || ''
                    };
                }
            }
            
            console.log(`Loaded ${Object.keys(categorization).length} category definitions`);
            return categorization;
            
        } catch (error) {
            console.error('Error fetching categorization:', error);
            throw error;
        }
    }
    
    /**
     * Parse amount string to number
     * Handles formats like "-$1,234.56" or "$1,234.56"
     */
    parseAmount(amountStr) {
        if (!amountStr) return 0;
        
        // Remove $ and commas, then parse
        const cleanStr = amountStr.replace(/[$,]/g, '');
        return parseFloat(cleanStr) || 0;
    }
    
    /**
     * Load all data needed for dashboard
     */
    async loadAllData() {
        console.log('Loading data from Tiller HQ...');
        
        const [transactions, categorization] = await Promise.all([
            this.getTransactions(),
            this.getCategorization()
        ]);
        
        return {
            transactions,
            categorization,
            loadedAt: new Date().toISOString()
        };
    }
}

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TillerDataConnector;
}
