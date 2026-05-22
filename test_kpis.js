const mongoose = require('mongoose');
const statsController = require('./src/controllers/statsController');
require('dotenv').config();

async function testKPIs() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/scholarsnet');
    
    const req = { params: { labo: 'LARI' } };
    const res = {
        json: (data) => {
            console.log("JSON response:", data);
            process.exit(0);
        },
        status: (code) => {
            console.log("Status:", code);
            return { json: (data) => { console.log(data); process.exit(1); } };
        }
    };
    
    await statsController.kpis(req, res);
}

testKPIs();
