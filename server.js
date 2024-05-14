const express = require('express');
const app = express();
const fs = require('fs').promises;  // Use promise-based fs
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const PORT = 3001;
app.use(express.json());

const EDT_USERNAME = process.env.EDT_USERNAME;
const EDT_PASSWORD = process.env.EDT_PASSWORD;
const WIGOR_URL = process.env.WIGOR_URL;

async function wigorLogin() {
    try {
        const response = await axios.get("http://localhost:3000/auth", {
            data: {
                username: EDT_USERNAME,
                password: EDT_PASSWORD
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error in wigorLogin:', error);
        throw error;
    }
}

async function wigorGetEDT(cookies, date) {
    try {
        if (cookies) {
            const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
            const response = await axios.get(`${WIGOR_URL}&date=${date}`, {
                headers: {
                    'Cookie': cookieHeader
                }
            });
            return response.data;
        } else {
            return "error";
        }
    } catch (error) {
        console.error('Error in wigorGetEDT:', error);
        return "error";
    }
}

app.get('/edt', async (req, res) => {
    const date = req.query.date;
    try {
        let cookiesText = await fs.readFile('cookies.json', 'utf8').catch(async () => {
            const loginData = await wigorLogin();
            const cookiesString = JSON.stringify(loginData.data.cookies);
            await fs.writeFile('cookies.json', cookiesString);
            return cookiesString;  // Directly return the string to be parsed next
        });

        const cookies = JSON.parse(cookiesText);  // Parse outside the condition to ensure it's always an array
        if (!Array.isArray(cookies)) {
            throw new TypeError("Stored cookies are not in array format");
        }

        const edt = await wigorGetEDT(cookies, date);
        res.send(edt);
    } catch (error) {
        console.error('Error in /edt route:', error);
        res.status(500).send('Failed to process request due to internal error');
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
